import { renderJourney } from "./journey.mjs";
import { loadGitHubMetadata } from "./github.mjs";
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
  for (const group of Object.values(s.colors || {}))
    for (const c of Object.values(group))
      if (!/^#[a-f\d]{6}$/i.test(c))
        throw Error("Colors must be six-digit hex");
  for (const asset of [s.portrait, s.resume, s.socialImage].filter(Boolean))
    if (!/^assets\/[\w./-]+$/.test(asset) || asset.includes(".."))
      throw Error("Use local assets/ paths");
  for (const link of [
    p.contact.github,
    p.contact.linkedin,
    ...p.work.map((w) => w.link),
    ...p.work.flatMap((w) => [w.repoUrl, w.demoUrl]),
  ].filter(Boolean))
    if (!/^https:\/\//.test(link))
      throw Error("Project and social links must use HTTPS");
  if (
    !["light", "dark"].includes(s.defaultTheme) ||
    (s.defaultView && !["recruiter", "engineering"].includes(s.defaultView))
  )
    throw Error("Invalid default mode");
  const collections = [
    p.journey,
    p.work,
    p.products,
    p.builds,
    p.achievements,
    s.journey.worlds,
  ];
  for (const collection of collections) {
    const ids = collection.map((x) => x.id).filter((x) => x !== undefined);
    if (
      ids.some((id) => !/^[a-z][a-z0-9-]*$/.test(id)) ||
      new Set(ids).size !== ids.length
    )
      throw Error("Record IDs must be unique lowercase slugs");
  }
  const builds = new Set(p.builds.map((x) => x.id).filter(Boolean));
  const products = new Set(p.products.map((x) => x.id).filter(Boolean));
  const sources = new Set(
    [...p.journey, ...p.work, ...p.builds].map((x) => x.id).filter(Boolean),
  );
  for (const record of [...p.work, ...s.journey.worlds]) {
    if (record.architectureIds?.some((id) => !builds.has(id)))
      throw Error("Unknown architecture reference");
    if (record.productId && !products.has(record.productId))
      throw Error("Unknown product reference");
  }
  for (const record of p.achievements) {
    if (
      record.caseStudy &&
      (!record.caseStudy.context ||
        !record.caseStudy.decision ||
        !record.caseStudy.result ||
        !Array.isArray(record.caseStudy.sourceIds) ||
        record.caseStudy.sourceIds.some((id) => !sources.has(id)))
    )
      throw Error(
        "Case studies require context, decision, result and valid sources",
      );
  }
  for (const record of p.journey)
    if (record.kind && !["employment", "independent"].includes(record.kind))
      throw Error("Invalid career kind");
  for (const record of p.builds) {
    if (
      record.diagramKind &&
      !["flow", "components"].includes(record.diagramKind)
    )
      throw Error("Invalid diagram kind");
    if (
      record.nodeDetails &&
      record.nodeDetails.length !== record.diagram.length
    )
      throw Error("Node details must match diagram components");
  }
  if (s.assistant && typeof s.assistant.enabled !== "boolean")
    throw Error("Assistant enabled must be a boolean");
  if (
    s.github &&
    (typeof s.github.enabled !== "boolean" ||
      !Array.isArray(s.github.repositories) ||
      !Number.isFinite(s.github.ttlHours) ||
      s.github.ttlHours < 1 ||
      s.github.ttlHours > 720)
  )
    throw Error("Invalid GitHub cache settings");
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
export function render(p, s, github = loadGitHubMetadata(p, s)) {
  validate(p, s);
  validateJourney(s.journey);
  return renderJourney(p, s, github).replace(/[\t ]+$/gm, "");
}
export function build(
  profilePath = "data/profile.json",
  sitePath = "data/site.json",
  out = "dist",
) {
  const p = read(profilePath),
    s = read(sitePath);
  const html = render(p, s);
  // Never delete an arbitrary caller-supplied directory. Only dist/ or a marked
  // output from this builder is owned; reject symlinks and nonempty unknown paths.
  const resolved = path.resolve(out);
  if (fs.existsSync(out)) {
    if (fs.lstatSync(out).isSymbolicLink() || !fs.lstatSync(out).isDirectory())
      throw Error("Build output must be an owned directory");
    if (
      resolved !== path.resolve("dist") &&
      fs.readdirSync(out).length &&
      !fs.existsSync(path.join(out, ".profile-build-output"))
    )
      throw Error("Refusing to replace an unowned build directory");
    fs.rmSync(out, { recursive: true });
  }
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(
    path.join(out, ".profile-build-output"),
    "Generated portfolio output\n",
  );
  fs.writeFileSync(path.join(out, "index.html"), html);
  fs.mkdirSync(path.join(out, "assets"), { recursive: true });
  for (const name of [
    "portfolio.css",
    "app.js",
    "favicon.svg",
    "icons",
    ...(s.assistant?.enabled ? ["guide.js"] : []),
  ])
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
  ].filter(Boolean)) {
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
