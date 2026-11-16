import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { build, render, validate } from "../scripts/build.mjs";
const p = JSON.parse(fs.readFileSync("data/profile.json")),
  s = JSON.parse(fs.readFileSync("data/site.json"));
test("professional records survive static rendering", () => {
  const html = render(p, s);
  for (const job of p.journey) assert.ok(html.includes(job.company));
  for (const b of p.builds)
    assert.ok(html.includes(b.name.replaceAll("&", "&amp;")));
  assert.ok(html.includes("Friendly help"));
  assert.ok(!html.includes("Client work"));
});
test("configuration changes identity, sections, theme and links", () => {
  const c = {
    ...s,
    displayName: "Example Engineer",
    headline: "Build better.",
    journey: {
      ...s.journey,
      stops: s.journey.stops.filter((x) => ["about", "contact"].includes(x.id)),
    },
    defaultTheme: "dark",
    url: "https://example.com/",
  };
  const h = render({ ...p, name: "Example Engineer" }, c);
  assert.ok(h.includes("Example Engineer"));
  assert.ok(h.includes('data-theme="dark"'));
  assert.ok(!h.includes('id="projects"'));
  assert.ok(h.includes("https://example.com/"));
});
test("reject unsafe asset paths and colors", () => {
  assert.throws(() => validate(p, { ...s, resume: "../secret" }));
  assert.throws(() =>
    validate(p, { ...s, colors: { light: { blue: "red;display:none" } } }),
  );
});

test("journey art and character remain configurable", () => {
  const changed = {
    ...s,
    journey: {
      ...s.journey,
      character: { ...s.journey.character, shirt: "#123abc" },
      homeIllustration: "assets/my-home.svg",
      stops: s.journey.stops.map((x) =>
        x.id === "about"
          ? {
              ...x,
              title: "My own lookout",
              illustration: "assets/my-lookout.svg",
            }
          : x,
      ),
    },
  };
  const html = render({ ...p, shortName: "Alex" }, changed);
  assert.ok(html.includes("#123abc"));
  assert.ok(html.includes("My own lookout"));
  assert.ok(html.includes("assets/my-lookout.svg"));
  assert.ok(html.includes("assets/my-home.svg"));
  assert.ok(html.includes("Hi, I’m <em>Alex."));
});
test("reject unsafe scene configuration", () => {
  assert.throws(() =>
    render(p, {
      ...s,
      journey: {
        ...s.journey,
        stops: [{ id: "about", label: "About", illustration: "../secret.svg" }],
      },
    }),
  );
  assert.throws(() =>
    render(p, {
      ...s,
      journey: { ...s.journey, character: { shirt: "red;}" } },
    }),
  );
});

test("renamed and reordered records retain explicit architecture relationships", () => {
  const changed = structuredClone(p);
  changed.builds.reverse();
  changed.builds.find((x) => x.id === "secretmesh-architecture").name =
    "Renamed architecture";
  changed.work.find((x) => x.id === "secretmesh").name = "Renamed project";
  const site = structuredClone(s);
  site.journey.worlds.reverse();
  const html = render(changed, site);
  const security = html.match(
    /<dialog id="world-security"[\s\S]*?<\/dialog>/,
  )[0];
  assert.ok(
    security.includes('data-open="architecture-secretmesh-architecture"'),
  );
  assert.ok(security.includes("Renamed architecture"));
  assert.ok(!security.includes('data-open="architecture-developer-platform"'));
  const project = html.match(
    /<dialog id="project-secretmesh"[\s\S]*?<\/dialog>/,
  )[0];
  assert.ok(project.includes("Renamed project"));
  assert.ok(project.includes("Metadata-only persistence"));
});

test("reject broken references, duplicate IDs and incomplete diagram annotations", () => {
  const copy = structuredClone(p);
  copy.work[0].architectureIds = ["missing"];
  assert.throws(() => validate(copy, s), /Unknown architecture/);
  copy.work[0].architectureIds = [];
  copy.journey[1].id = copy.journey[0].id;
  assert.throws(() => validate(copy, s), /unique/);
  copy.journey[1].id = "another-role";
  copy.builds[0].nodeDetails = ["One detail for many nodes"];
  assert.throws(() => validate(copy, s), /Node details/);
});

test("example profile omits unavailable actions and keeps every dialog target valid", () => {
  const example = JSON.parse(fs.readFileSync("data/profile.example.json"));
  const exampleSite = JSON.parse(fs.readFileSync("data/site.example.json"));
  const html = render(example, {
    ...exampleSite,
    assistant: { enabled: true },
  });
  assert.ok(!html.includes('href="undefined"'));
  assert.ok(!html.includes('href=""'));
  assert.ok(!html.includes('data-open="impact-0"'));
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((x) => x[1]));
  for (const target of html.matchAll(/\bdata-open="([^"]+)"/g))
    assert.ok(ids.has(target[1]), target[1]);
  assert.ok(
    !html.includes("vsp6692/secretmesh"),
    "A fork never inherits unrelated GitHub cache records",
  );
});

test("repeat builds remove stale assets and refuse unrelated output directories", () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "profile-build-test-"));
  const out = path.join(temp, "output");
  try {
    build("data/profile.json", "data/site.json", out);
    fs.writeFileSync(
      path.join(out, "assets", "old-personal-asset.txt"),
      "stale",
    );
    build("data/profile.json", "data/site.json", out);
    assert.ok(
      !fs.existsSync(path.join(out, "assets", "old-personal-asset.txt")),
    );
    const unrelated = path.join(temp, "unrelated");
    fs.mkdirSync(unrelated);
    fs.writeFileSync(path.join(unrelated, "keep.txt"), "keep");
    assert.throws(
      () => build("data/profile.json", "data/site.json", unrelated),
      /unowned/,
    );
    assert.equal(
      fs.readFileSync(path.join(unrelated, "keep.txt"), "utf8"),
      "keep",
    );
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});
