import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  configuredRepositories,
  loadGitHubMetadata,
  refreshGitHubMetadata,
  renderRepositoryNote,
  repositoryFromUrl,
} from "../scripts/github.mjs";

const key = "example/atlas";
const profile = { work: [{ repoUrl: `https://github.com/${key}` }] };
const site = { github: { enabled: true, repositories: [key], ttlHours: 24 } };
const now = Date.parse("2026-11-16T09:00:00Z");
const record = {
  htmlUrl: `https://github.com/${key}`,
  fetchedAt: "2026-11-14T09:00:00.000Z",
  pushedAt: "2026-11-12T09:00:00.000Z",
  language: "JavaScript",
  license: "MIT",
  stars: 2,
};
const cache = { version: 1, repositories: { [key]: record } };
const response = (changes = {}) => ({
  ok: true,
  status: 200,
  json: async () => ({
    full_name: key,
    html_url: record.htmlUrl,
    private: false,
    visibility: "public",
    pushed_at: record.pushedAt,
    language: "TypeScript",
    license: { spdx_id: "Apache-2.0" },
    stargazers_count: 3,
    ...changes,
  }),
});

test("GitHub refresh requires an explicit allowlist and a linked project", async () => {
  assert.equal(repositoryFromUrl("https://github.com/Example/Atlas/"), key);
  for (const url of [
    "https://github.com.evil.example/example/atlas",
    "https://user@github.com/example/atlas",
    "http://github.com/example/atlas",
    "https://github.com/example/atlas/issues",
    "https://github.com/example/atlas?token=x",
  ])
    assert.equal(repositoryFromUrl(url), null);
  assert.deepEqual(
    configuredRepositories(profile, {
      github: {
        enabled: true,
        repositories: [key, "unknown/project", "../secret"],
      },
    }),
    [key],
  );
  let requests = 0;
  const result = await refreshGitHubMetadata(
    profile,
    { github: { enabled: false, repositories: [key] } },
    {
      fetcher: async () => {
        requests++;
        return response();
      },
    },
  );
  assert.equal(requests, 0);
  assert.deepEqual(result.cache.repositories, {});
});

test("GitHub metadata refreshes after TTL, excludes unneeded API fields, and caches within TTL", async () => {
  let requests = 0;
  const fetcher = async () => {
    requests++;
    return response({
      description: "Not a professional profile source",
      owner: { email: "private@example.test" },
    });
  };
  const fresh = await refreshGitHubMetadata(profile, site, {
    cache,
    fetcher,
    now,
  });
  assert.equal(requests, 1);
  assert.equal(fresh.results[0].status, "updated");
  assert.equal(fresh.cache.repositories[key].language, "TypeScript");
  assert.equal(fresh.cache.repositories[key].description, undefined);
  assert.equal(fresh.cache.repositories[key].owner, undefined);
  const reused = await refreshGitHubMetadata(profile, site, {
    cache: fresh.cache,
    fetcher,
    now: now + 1000,
  });
  assert.equal(requests, 1);
  assert.equal(reused.results[0].status, "cached");
});

test("GitHub network failures, rate limits, and invalid payloads retain last-good metadata", async () => {
  for (const fetcher of [
    async () => {
      throw Error("offline");
    },
    async () => ({ ok: false, status: 429 }),
    async () => response({ stargazers_count: "unknown" }),
    async () => response({ html_url: "https://evil.example/" }),
    async () => ({ ok: true, json: async () => null }),
    async () => response({ private: undefined }),
  ]) {
    const result = await refreshGitHubMetadata(profile, site, {
      cache,
      fetcher,
      now,
    });
    assert.deepEqual(result.cache.repositories[key], record);
    assert.equal(result.results[0].status, "last-good");
  }
});

test("Private or removed repositories are removed from the public snapshot", async () => {
  for (const fetcher of [
    async () => response({ private: true }),
    async () => response({ visibility: "internal" }),
    async () => ({ ok: false, status: 404 }),
    async () => ({ ok: false, status: 410 }),
  ]) {
    const result = await refreshGitHubMetadata(profile, site, {
      cache,
      fetcher,
      now,
    });
    assert.equal(result.cache.repositories[key], undefined);
    assert.equal(result.results[0].status, "unavailable");
  }
});

test("A first-time API failure produces an empty optional cache", async () => {
  const result = await refreshGitHubMetadata(profile, site, {
    cache: { version: 1, repositories: {} },
    fetcher: async () => {
      throw Error("offline");
    },
    now,
  });
  assert.deepEqual(result.cache.repositories, {});
  assert.equal(renderRepositoryNote(record.htmlUrl, result.cache), "");
});

test("Cache loading filters unrelated repositories, identifies stale data, and tolerates corruption", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "profile-github-"));
  const cachePath = path.join(directory, "cache.json");
  try {
    fs.writeFileSync(
      cachePath,
      JSON.stringify({
        version: 1,
        repositories: {
          [key]: record,
          "someone/private": {
            ...record,
            htmlUrl: "https://github.com/someone/private",
          },
        },
      }),
    );
    const loaded = loadGitHubMetadata(profile, site, { cachePath, now });
    assert.deepEqual(Object.keys(loaded.repositories), [key]);
    assert.equal(loaded.repositories[key].stale, true);
    assert.ok(
      renderRepositoryNote(record.htmlUrl, loaded).includes(
        "Last available snapshot",
      ),
    );
    assert.deepEqual(
      loadGitHubMetadata({ work: [] }, site, { cachePath, now }).repositories,
      {},
    );
    fs.writeFileSync(cachePath, "not JSON");
    assert.deepEqual(
      loadGitHubMetadata(profile, site, { cachePath, now }).repositories,
      {},
    );
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("Repository notes escape remote strings and show the data source and timestamp", () => {
  const html = renderRepositoryNote(record.htmlUrl, {
    version: 1,
    repositories: {
      [key]: { ...record, language: "<img src=x>", license: "<script>" },
    },
  });
  assert.ok(!html.includes("<img"));
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes("&lt;img"));
  assert.ok(html.includes("cached snapshot"));
  assert.ok(html.includes(record.fetchedAt));
  assert.equal(renderRepositoryNote("https://evil.example/", cache), "");
});
