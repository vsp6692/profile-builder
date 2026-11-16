import { renderJourney } from "./journey.mjs";
import fs from "node:fs";
import path from "node:path";
export const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
export function validate(p, s) {
  if (!p.name || !p.contact?.email || !Array.isArray(p.journey))
    throw Error("Profile requires name, contact.email and journey");
  if (!/^https:\/\//.test(s.url))
    throw Error("site.url must be an HTTPS deployment URL");
  for (const group of Object.values(s.colors))
    for (const c of Object.values(group))
      if (!/^#[a-f\d]{6}$/i.test(c))
        throw Error("Colors must be six-digit hex");
  for (const asset of [s.portrait, s.resume, s.socialImage])
    if (!/^assets\/[\w./-]+$/.test(asset) || asset.includes(".."))
      throw Error("Use local assets/ paths");
  for (const link of [
    p.contact.github,
    p.contact.linkedin,
    ...p.work.map((w) => w.link),
  ].filter(Boolean))
    if (!/^https:\/\//.test(link))
      throw Error("Project and social links must use HTTPS");
  if (
    !["light", "dark"].includes(s.defaultTheme) ||
    !["recruiter", "engineering"].includes(s.defaultView)
  )
    throw Error("Invalid default mode");
}
function validateJourney(j) {
  if (!j || !Array.isArray(j.stops))
    throw Error("A journey with stops is required");
  const allowed = [
    "about",
    "career",
    "impact",
    "world",
    "projects",
    "skills",
    "contact",
  ];
  if (new Set(j.stops.map((x) => x.id)).size !== j.stops.length)
    throw Error("Journey stop IDs must be unique");
  for (const stop of [
    ...j.stops,
    ...(j.homeIllustration
      ? [{ id: "about", illustration: j.homeIllustration }]
      : []),
  ]) {
    if (!allowed.includes(stop.id)) throw Error("Unknown journey stop");
    if (
      stop.illustration &&
      (!/^assets\/[\w./-]+$/.test(stop.illustration) ||
        stop.illustration.includes(".."))
    )
      throw Error("Illustration must be a local assets path");
  }
  for (const colors of Object.values(j.palette))
    for (const color of Object.values(colors))
      if (!/^#[a-f\d]{6}$/i.test(color))
        throw Error("Scene colors must be hex");
  for (const color of Object.values(j.character))
    if (!/^#[a-f\d]{6}$/i.test(color))
      throw Error("Character colors must be hex");
}
export function render(p, s) {
  validate(p, s);
  validateJourney(s.journey);
  return renderJourney(p, s);
}
export function build(
  profilePath = "data/profile.json",
  sitePath = "data/site.json",
  out = "dist",
) {
  const p = read(profilePath),
    s = read(sitePath);
  const html = render(p, s);
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, "index.html"), html);
  fs.mkdirSync(path.join(out, "assets"), { recursive: true });
  for (const name of ["portfolio.css", "app.js", "favicon.svg", "icons"])
    fs.cpSync("assets/" + name, path.join(out, "assets", name), {
      recursive: true,
    });
  fs.writeFileSync(
    path.join(out, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${esc(s.url)}</loc></url></urlset>`,
  );
  fs.writeFileSync(
    path.join(out, "robots.txt"),
    `User-agent: *\nAllow: /\nSitemap: ${s.url}sitemap.xml\n`,
  );
  fs.writeFileSync(path.join(out, ".nojekyll"), "");
  // Include customized assets, even when they use a different filename.
  for (const a of [
    s.portrait,
    s.resume,
    s.socialImage,
    ...[
      s.journey.homeIllustration,
      ...s.journey.stops.map((x) => x.illustration),
    ].filter(Boolean),
  ]) {
    fs.mkdirSync(path.dirname(path.join(out, a)), { recursive: true });
    fs.cpSync(a, path.join(out, a), { recursive: true });
  }
  return html;
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve("scripts/build.mjs")
) {
  const html = build(process.env.PROFILE_CONFIG, process.env.SITE_CONFIG);
  fs.writeFileSync("index.html", html);
  console.log("Built static HTML and deployable dist/");
}
