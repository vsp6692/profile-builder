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
    sections: ["about", "contact"],
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
