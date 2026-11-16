import fs from "node:fs";

const CACHE_PATH = "data/github-cache.json";
const REPOSITORY = /^[a-z\d](?:[a-z\d-]{0,38})\/[a-z\d_.-]+$/i;
const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const isoDate = (value) =>
  typeof value === "string" && Number.isFinite(Date.parse(value))
    ? new Date(value).toISOString()
    : null;
const shortString = (value) =>
  typeof value === "string" && value.length <= 100 ? value : null;

export function repositoryFromUrl(value) {
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.hostname !== "github.com" ||
      url.port ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    )
      return null;
    const key = url.pathname
      .replace(/^\//, "")
      .replace(/\/$/, "")
      .replace(/\.git$/, "");
    return REPOSITORY.test(key) ? key.toLowerCase() : null;
  } catch {
    return null;
  }
}

export function configuredRepositories(profile, site) {
  if (!site.github?.enabled) return [];
  const linked = new Set(
    [...(profile.work || []), ...(profile.products || [])]
      .map((project) => repositoryFromUrl(project.repoUrl || project.link))
      .filter(Boolean),
  );
  return [
    ...new Set(
      (site.github.repositories || [])
        .filter((key) => typeof key === "string" && REPOSITORY.test(key))
        .map((key) => key.toLowerCase()),
    ),
  ].filter((key) => linked.has(key));
}

export function readGitHubCache(cachePath = CACHE_PATH) {
  try {
    const cache = JSON.parse(fs.readFileSync(cachePath, "utf8"));
    if (
      cache.version === 1 &&
      cache.repositories &&
      typeof cache.repositories === "object" &&
      !Array.isArray(cache.repositories)
    )
      return cache;
  } catch {
    /* A missing or malformed optional cache never blocks a build. */
  }
  return { version: 1, repositories: {} };
}

function cleanRecord(record, key) {
  if (
    !record ||
    repositoryFromUrl(record.htmlUrl) !== key ||
    !isoDate(record.fetchedAt)
  )
    return null;
  return {
    htmlUrl: `https://github.com/${key}`,
    fetchedAt: isoDate(record.fetchedAt),
    pushedAt: isoDate(record.pushedAt),
    language: shortString(record.language),
    license: shortString(record.license),
    stars:
      Number.isSafeInteger(record.stars) && record.stars >= 0
        ? record.stars
        : 0,
  };
}

function ttl(site) {
  const hours = site.github?.ttlHours;
  return (
    (Number.isFinite(hours) && hours >= 1 && hours <= 720 ? hours : 24) *
    60 *
    60 *
    1000
  );
}

export function loadGitHubMetadata(
  profile,
  site,
  { cachePath = CACHE_PATH, now = Date.now() } = {},
) {
  const source = readGitHubCache(cachePath);
  const repositories = {};
  for (const key of configuredRepositories(profile, site)) {
    const record = cleanRecord(source.repositories[key], key);
    if (record)
      repositories[key] = {
        ...record,
        stale: now - Date.parse(record.fetchedAt) >= ttl(site),
      };
  }
  return { version: 1, repositories };
}

export async function refreshGitHubMetadata(
  profile,
  site,
  {
    cache = readGitHubCache(),
    fetcher = fetch,
    now = Date.now(),
    token = "",
    force = false,
  } = {},
) {
  const repositories = {};
  const results = [];
  // Sequential requests are intentionally small and respect GitHub's rate limit.
  for (const key of configuredRepositories(profile, site)) {
    const previous = cleanRecord(cache.repositories?.[key], key);
    if (previous) repositories[key] = previous;
    if (
      previous &&
      !force &&
      now >= Date.parse(previous.fetchedAt) &&
      now - Date.parse(previous.fetchedAt) < ttl(site)
    ) {
      results.push({ repository: key, status: "cached" });
      continue;
    }
    try {
      const response = await fetcher(`https://api.github.com/repos/${key}`, {
        headers: {
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "engineering-profile-build",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        signal: AbortSignal.timeout(10000),
        redirect: "error",
      });
      if (!response.ok) {
        // A removed or inaccessible repository should no longer appear public.
        if (response.status === 404 || response.status === 410)
          delete repositories[key];
        throw Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      if (
        data?.private === true ||
        data?.visibility === "private" ||
        data?.visibility === "internal"
      ) {
        delete repositories[key];
        throw Error("Repository is not public");
      }
      if (
        data?.private !== false ||
        typeof data.full_name !== "string" ||
        data.full_name.toLowerCase() !== key ||
        repositoryFromUrl(data.html_url) !== key ||
        !isoDate(data.pushed_at) ||
        (data.language !== null && !shortString(data.language)) ||
        !Number.isSafeInteger(data.stargazers_count) ||
        data.stargazers_count < 0
      )
        throw Error("Unexpected repository metadata");
      repositories[key] = {
        htmlUrl: `https://github.com/${key}`,
        fetchedAt: new Date(now).toISOString(),
        pushedAt: isoDate(data.pushed_at),
        language: data.language,
        license:
          data.license?.spdx_id && data.license.spdx_id !== "NOASSERTION"
            ? shortString(data.license.spdx_id)
            : null,
        stars: data.stargazers_count,
      };
      results.push({ repository: key, status: "updated" });
    } catch {
      // Do not log errors or headers: they may contain an optional API token.
      results.push({
        repository: key,
        status: repositories[key] ? "last-good" : "unavailable",
      });
    }
  }
  return { cache: { version: 1, repositories }, results };
}

export function renderRepositoryNote(repoUrl, cache) {
  const key = repositoryFromUrl(repoUrl);
  const record = key && cache?.repositories?.[key];
  if (!record) return "";
  const safe = cleanRecord(record, key);
  if (!safe) return "";
  const date = (value) =>
    new Date(value).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  return `<aside class="repository-note" aria-label="Public repository information"><p class="eyebrow">From GitHub · cached snapshot</p><p>${[safe.language, safe.license].filter(Boolean).map(escape).join(" · ")}${safe.pushedAt ? `${safe.language || safe.license ? " · " : ""}Last push <time datetime="${escape(safe.pushedAt)}">${date(safe.pushedAt)}</time>` : ""}</p><p class="small">${record.stale ? "Last available snapshot" : "Checked"} <time datetime="${escape(safe.fetchedAt)}">${date(safe.fetchedAt)}</time>${record.stale ? "." : " · daily refresh scheduled."}</p></aside>`;
}
