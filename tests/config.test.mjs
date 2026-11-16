import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { render, validate } from "../scripts/build.mjs";
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
