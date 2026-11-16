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
export function render(p, s) {
  validate(p, s);
  const link = (url, label, cls = "") =>
    `<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} <span aria-hidden="true">↗</span></a>`;
  const resume = (cls = "button secondary") =>
    `<a class="${cls}" href="${esc(s.resume)}" download="${esc(p.resume.filename)}">Download resume <span aria-hidden="true">↓</span></a>`;
  const chips = (items) =>
    `<ul class="tags">${items.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`;
  const section = (id, label, title, body, technical = false) =>
    s.sections.includes(id)
      ? `<section id="${id}" class="section ${technical ? "technical" : ""}" aria-labelledby="${id}-title"><div class="section-heading"><p class="eyebrow">${label}</p><h2 id="${id}-title">${title}</h2></div>${body}</section>`
      : "";
  const diagram = (b, i) =>
    `<article class="architecture-card surface"><header><span class="eyebrow">SYSTEM / 0${i + 1}</span><h3>${esc(b.name)}</h3><p>${esc(b.text)}</p></header><div class="architecture-nodes" aria-label="Components of ${esc(b.name)}">${b.diagram.map(([name, detail], j) => `<details class="architecture-node"><summary><span class="node-number">0${j + 1}</span>${esc(name)}<span class="expand" aria-hidden="true">+</span></summary><p>${esc(detail)}</p></details>${j < b.diagram.length - 1 ? '<svg class="connector" viewBox="0 0 40 30" aria-hidden="true"><path d="M20 0v26m-5-5 5 5 5-5"/></svg>' : ""}`).join("")}</div>${chips(b.stack.split(" · "))}</article>`;

  const projects = [...p.work]
    .sort(
      (a, b) =>
        Number(p.products.some((x) => x.name === b.name)) -
        Number(p.products.some((x) => x.name === a.name)),
    )
    .map((w) => {
      const product = p.products.find((x) => x.name === w.name);
      const architecture = p.builds.find((x) => x.name.startsWith(w.name));
      return { ...w, product, architecture };
    });
  const impacts = p.achievements;
  const body =
    section(
      "about",
      "01 / Perspective",
      "Engineering is a team sport.",
      `<div class="about-layout"><p class="large-copy">Platforms should make the safe path the easy path.</p><div>${p.about.map((x) => `<p>${esc(x)}</p>`).join("")}<p class="small">${esc(p.education.map((x) => `${x.degree} · ${x.school} · ${x.dates} · ${x.location}`).join(" / "))}</p></div></div>`,
    ) +
    section(
      "impact",
      "02 / Measurable outcomes",
      "Infrastructure. Real impact.",
      `<div class="metrics">${impacts.map((x) => `<article class="metric surface"><span class="metric-value" data-count="${x.number}" data-prefix="${x.prefix || ""}" data-suffix="${x.suffix || ""}">${x.value}</span><h3>${x.label}</h3><p>${x.text}</p><a href="#${s.sections.includes(x.anchor) ? x.anchor : "about"}">Explore the context <span aria-hidden="true">↗</span></a></article>`).join("")}</div><div class="impact-note"><span class="signal" aria-hidden="true"></span><p><strong>Security is part of delivery.</strong> ${esc(p.securityNote || "")}</p></div>`,
    ) +
    section(
      "experience",
      "03 / Career trajectory",
      "Built through every stage.",
      `<div class="timeline">${p.journey
        .map(
          (j, i) =>
            `<article class="career"><div class="career-date"><span>${esc(j.dates)}</span><small>${esc(j.where)}</small></div><div class="career-content"><span class="career-dot" aria-hidden="true"></span><div class="career-top"><h3>${esc(j.company)}</h3><span class="small">0${i + 1}</span></div><p class="role">${esc(j.role)}</p><p>${esc(j.bullets[0])}</p><details><summary>Engineering contributions <span aria-hidden="true">+</span></summary><ul>${j.bullets
              .slice(1)
              .map((x) => `<li>${esc(x)}</li>`)
              .join(
                "",
              )}</ul>${chips(j.technologies || [])}</details></div></article>`,
        )
        .join("")}</div>`,
    ) +
    section(
      "projects",
      "04 / Selected work",
      "Ideas made tangible.",
      `<div class="section-intro"><p>Open-source products, infrastructure experiments, and a little help for friends. Each has a different story.</p><span class="small" id="project-count" aria-live="polite">${projects.length} projects</span></div><div class="filters" role="group" aria-label="Filter projects">${["All", ...p.filters].map((x, i) => `<button data-filter="${esc(x)}" aria-pressed="${i === 0}">${esc(x)}</button>`).join("")}</div><div class="project-grid">${projects.map((w, i) => `<article class="project surface" data-category="${esc(w.type)}"><div class="project-art art-${i % 3}" aria-hidden="true"><span class="art-code">${["{ }", "/ /", "[ ]"][i % 3]}</span><span class="art-label">${esc(w.name)}</span><span class="art-index">0${i + 1}</span></div><div class="project-body"><p class="eyebrow">${esc(w.type)}</p><h3>${esc(w.name)}</h3><p>${esc(w.note)}</p>${w.product ? chips(w.product.stack.split(" · ")) : w.architecture ? chips(w.architecture.stack.split(" · ")) : ""}<details><summary>Project notes <span aria-hidden="true">+</span></summary>${w.product ? `<p>${esc(w.product.blurb)}</p><ul>${w.product.bullets.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : w.architecture ? `<p>${esc(w.architecture.text)}</p>` : `<p>${esc(w.note)}.</p>`}</details>${w.link ? link(w.link, "View repository", "text-link") : ""}</div></article>`).join("")}</div>`,
    ) +
    section(
      "architecture",
      "05 / Under the hood",
      "Decisions, not just diagrams.",
      `<p class="section-intro">Three real systems. Open a component to explore its responsibilities. These are high-level views of the work, not production topology specifications.</p><div class="architecture-grid">${p.builds.map(diagram).join("")}</div>`,
      true,
    ) +
    section(
      "skills",
      "06 / Engineering toolkit",
      "Tools with a purpose.",
      `<p class="section-intro">Explore the technologies behind the work. Practical experience, without arbitrary proficiency scores.</p><div class="skills-grid">${p.skills.map((g) => `<article class="skill surface"><h3>${esc(g.category)}</h3>${chips(g.items)}<div class="tool-list">${g.tools.map((t) => `<details class="tool"><summary><img src="assets/icons/${esc(t.icon)}.svg" width="24" height="24" loading="lazy" alt="">${esc(t.name)}<span class="expand" aria-hidden="true">+</span></summary><p>${esc(t.detail)}</p></details>`).join("")}</div></article>`).join("")}</div>`,
      true,
    ) +
    section(
      "briefs",
      "07 / Working notes",
      "Intent before implementation.",
      `<p class="section-intro">Original engineering and design briefs, preserved as a look at how the work was framed.</p><div class="brief-grid">${p.prompts.map((b, i) => `<details class="brief surface"><summary>${esc(b.title)}<span class="expand" aria-hidden="true">+</span></summary><p class="eyebrow">${esc(b.project)}</p><blockquote id="brief-${i}">${esc(b.text)}</blockquote><button class="copy" data-copy="brief-${i}">Copy brief</button></details>`).join("")}</div>`,
      true,
    ) +
    section(
      "contact",
      "08 / Start a conversation",
      "Let’s build what comes next.",
      `<div class="contact-layout"><div><p class="large-copy">Secure platforms. Better developer experiences. Room for the next challenge.</p><p>Connect about DevSecOps, cloud security, platform engineering, or the work you see here.</p><a class="email" href="mailto:${esc(p.contact.email)}">${esc(p.contact.email)} <span aria-hidden="true">↗</span></a><div class="actions"><button class="button secondary" id="copy-email" data-email="${esc(p.contact.email)}">Copy email</button>${resume()}</div><div class="social">${link(p.contact.linkedin, "LinkedIn")}${link(p.contact.github, "GitHub")}<span>${esc(p.contact.location)}</span></div></div><form id="contact-form" class="surface"><h3>Say hello</h3><label>Your name<input name="name" autocomplete="name" required maxlength="100"></label><label>Email<input name="email" type="email" autocomplete="email" required maxlength="200"></label><label>Message<textarea name="message" required maxlength="3000" rows="3"></textarea></label><button class="button primary" type="submit">Open email draft ↗</button><p class="small">Opens your email app. Nothing is collected by this site.</p></form></div>`,
    );
  const nav = [
    ["about", "About"],
    ["impact", "Impact"],
    ["experience", "Experience"],
    ["projects", "Projects"],
    ["architecture", "Architecture"],
    ["skills", "Skills"],
    ["contact", "Contact"],
  ].filter(([id]) => s.sections.includes(id));
  return `<!doctype html><html lang="en" data-theme="${s.defaultTheme}" data-view="${s.defaultView}" data-motion="${s.motion ? "on" : "off"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(s.displayName)} — ${esc(p.title)}</title><meta name="description" content="${esc(s.positioning)}"><meta name="theme-color" content="#f8f9fc"><link rel="canonical" href="${esc(s.url)}"><meta property="og:type" content="website"><meta property="og:title" content="${esc(s.displayName)} | Engineering with impact"><meta property="og:description" content="${esc(s.positioning)}"><meta property="og:url" content="${esc(s.url)}"><meta property="og:image" content="${esc(new URL(s.socialImage, s.url))}"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="assets/portfolio.css"><style>:root{--blue:${s.colors.light.blue};--red:${s.colors.light.red}}:root[data-theme=dark]{--blue:${s.colors.dark.blue};--red:${s.colors.dark.red}}</style><script>try{const t=localStorage.getItem('profile-theme');if(t==='dark'||t==='light')document.documentElement.dataset.theme=t;}catch{}</script><script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "Person", name: p.name, url: s.url, jobTitle: p.title, image: new URL(s.portrait, s.url).href, sameAs: [p.contact.linkedin, p.contact.github], knowsAbout: p.expertise || [] }).replace(/</g, "\\u003c")}</script><script src="assets/app.js" defer></script></head><body><a class="skip" href="#main">Skip to content</a><div class="progress" aria-hidden="true"></div><header class="header"><div class="nav-wrap"><a class="brand" href="#home"><span class="brand-mark" aria-hidden="true">sp<span>↗</span></span><span>${esc(s.displayName)}</span></a><button id="menu" class="icon-button" aria-expanded="false" aria-controls="nav">Menu</button><nav id="nav" aria-label="Main">${nav.map(([id, n]) => `<a href="#${id}" ${["architecture", "skills"].includes(id) ? 'class="technical"' : ""}>${n}</a>`).join("")}</nav><button id="theme" class="icon-button" aria-label="Switch theme">Theme ◐</button></div></header><main id="main"><section id="home" class="hero"><div class="hero-copy"><p class="eyebrow"><span class="tiny-line"></span> ${esc(p.contact.location)} / ${esc(p.greeting)}</p><h1>${esc(s.headline.split(". ")[0])}${s.headline.includes(". ") ? ".<br><em>" + esc(s.headline.split(". ").slice(1).join(". ")) + "</em>" : ""}</h1><p class="hero-role">${esc(s.displayName)}<span>${esc(p.title)}</span></p><p class="hero-description">${esc(s.positioning)}</p><div class="actions"><a class="button primary magnetic" href="#contact">Let’s connect <span aria-hidden="true">↗</span></a>${resume()}</div><a class="explore" href="#projects">Explore my work <span aria-hidden="true">↓</span></a><div class="social">${link(p.contact.linkedin, "LinkedIn")}${link(p.contact.github, "GitHub")}</div></div><div class="hero-visual"><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div><figure class="portrait"><img src="${esc(s.portrait)}" alt="${esc(s.displayName)}" width="640" height="800" fetchpriority="high"><figcaption><span>ENGINEER. BUILDER. TEAMMATE.</span><span aria-hidden="true">↗</span></figcaption></figure><span class="floating-note note-top">01 / THINK IN SYSTEMS</span><span class="floating-note note-bottom">BUILD WITH INTENT <span aria-hidden="true">↗</span></span></div></section><div class="view-bar"><div><p class="eyebrow">Choose your perspective</p><p id="view-description">The story, the leadership, the impact.</p></div><div class="view-switch" role="group" aria-label="Profile perspective"><button data-view-button="recruiter" aria-pressed="${s.defaultView === "recruiter"}">Recruiter view</button><button data-view-button="engineering" aria-pressed="${s.defaultView === "engineering"}">Engineering view</button></div></div><div class="content">${body}</div></main><footer><a class="brand" href="#home">${esc(s.displayName)} ↗</a><p>Thoughtfully built. Always evolving.</p><button class="icon-button" id="motion" aria-pressed="false">Pause motion</button><a href="#home">Back to top ↑</a></footer><p id="feedback" role="status" class="toast"></p></body></html>`;
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
  for (const name of [
    "portfolio.css",
    "app.js",
    "portrait.jpg",
    "resume.pdf",
    "social-preview.png",
    "favicon.svg",
    "icons",
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
  for (const a of [s.portrait, s.resume, s.socialImage]) {
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
