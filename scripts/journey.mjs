import { scenery, landmark, engineer } from "./art.mjs";
const e = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function renderJourney(p, s) {
  const j = s.journey;
  const dialogs = [];
  const title = (id, fallback) =>
    e(j.stops.find((stop) => stop.id === id)?.title || fallback);
  const tags = (a) =>
    `<ul class="tags">${a.map((t) => `<li>${e(t)}</li>`).join("")}</ul>`;
  const link = (u, t) =>
    `<a href="${e(u)}" target="_blank" rel="noopener noreferrer">${e(t)} ↗</a>`;
  const resume = `<a class="resume-link" href="${e(s.resume)}" download="${e(p.resume.filename)}">Download Resume ↓</a>`;
  const dialog = (id, title, content, kicker = "Field notes") => {
    dialogs.push(
      `<dialog id="${id}" aria-labelledby="${id}-title"><div class="dialog-head"><span class="eyebrow">${e(kicker)}</span><button class="close" data-close aria-label="Close ${e(title)}">Close ×</button></div><h2 id="${id}-title">${e(title)}</h2>${content}</dialog>`,
    );
    return id;
  };
  const discover = (id, title, kind, sub = "", extra = "") =>
    `<button class="discovery ${extra}" data-open="${id}" aria-haspopup="dialog">${landmark(kind, j.character)}<span class="landmark-label">${e(title)} <span aria-hidden="true">↗</span></span>${sub ? `<span class="landmark-caption">${e(sub)}</span>` : ""}</button>`;
  const profileId = dialog(
    "profile-dialog",
    s.displayName,
    `<div class="profile-intro"><img src="${e(s.portrait)}" width="90" height="110" alt="${e(s.displayName)}"><div><p class="lead">${e(p.title)}</p><p>${e(s.positioning)}</p></div></div><div class="quick-facts">${p.achievements.map((a) => `<p><strong>${e(a.value)}</strong><span>${e(a.label)}</span></p>`).join("")}</div>${tags(p.expertise || [])}<p>${e(p.securityNote)}</p><div class="actions">${resume}<a class="primary" href="mailto:${e(p.contact.email)}">Contact Me ↗</a></div><div class="contact-links">${link(p.contact.linkedin, "LinkedIn")}${link(p.contact.github, "GitHub")}<a href="mailto:${e(p.contact.email)}">${e(p.contact.email)}</a></div><button class="text-button" id="copy-email" data-email="${e(p.contact.email)}">Copy email</button><details><summary>Career at a glance</summary>${p.journey.map((x) => `<div class="career-note"><h3>${e(x.company)}</h3><p>${e(x.role)} · ${e(x.dates)}</p><ul class="prose-list">${x.bullets.map((b) => `<li>${e(b)}</li>`).join("")}</ul></div>`).join("")}</details>`,
    "The 15-second introduction",
  );
  const aboutId = dialog(
    "about-notes",
    "A little more about me",
    `${p.about.map((t) => `<p>${e(t)}</p>`).join("")}${p.education.map((x) => `<p class="education">${e(x.degree)} · ${e(x.school)}<br>${e(x.dates)} · ${e(x.location)}</p>`).join("")}`,
    "The person behind the platforms",
  );
  const career = [
    ...p.journey.filter((x) => x.company !== "Independent projects"),
  ].reverse();
  const careerHTML = career
    .map((x, i) =>
      discover(
        dialog(
          "career-" + i,
          x.company,
          `<p class="lead">${e(x.role)}</p><p class="eyebrow">${e(x.dates)} / ${e(x.where)}</p><ul class="prose-list">${x.bullets.map((t) => `<li>${e(t)}</li>`).join("")}</ul>${tags(x.technologies || [])}`,
          "Career milestone",
        ),
        x.company,
        j.careerBuildings[i % j.careerBuildings.length],
        x.dates,
      ),
    )
    .join("");
  const impactHTML = p.achievements
    .map(
      (a, i) =>
        `<button class="achievement" data-open="${dialog("impact-" + i, a.label, `<p class="big-number">${e(a.value)}</p><p class="lead">${e(a.text)}</p>`, "Engineering impact")}" aria-haspopup="dialog"><span class="achievement-drawing">${landmark(["chart", "cloud", "tower"][i % 3])}</span><strong>${e(a.value)}</strong><span>${e(a.label)}</span><small>Discover the story ↗</small></button>`,
    )
    .join("");
  const architectures = p.builds
    .map(
      (b, i) =>
        `<details class="architecture-detail"><summary>${e(b.name)} <span>+</span></summary><p>${e(b.text)}</p><ol class="component-list">${b.diagram.map(([title, desc]) => `<li><strong>${e(title)}</strong><span>${e(desc)}</span></li>`).join("")}</ol>${tags(b.stack.split(" · "))}</details>`,
    )
    .join("");
  const worlds = j.worlds
    .map((w, i) => {
      const gs = p.skills.filter((g) => w.categories.includes(g.category));
      return discover(
        dialog(
          "world-" + i,
          w.title,
          `<p class="lead">${e(w.description)}</p>${gs.map((g) => `<h3>${e(g.category)}</h3>${tags(g.items)}${g.tools.map((t) => `<p><strong>${e(t.name)}.</strong> ${e(t.detail)}</p>`).join("")}`).join("")}${i === 1 || i === 2 ? architectures : ""}`,
          "Explore the engineering world",
        ),
        w.title,
        w.art,
        w.label,
      );
    })
    .join("");
  const projects = [...p.work].sort(
    (a, b) =>
      Number(p.products.some((x) => x.name === b.name)) -
      Number(p.products.some((x) => x.name === a.name)),
  );
  const projectHTML = projects
    .map((w, i) => {
      const prod = p.products.find((x) => x.name === w.name),
        arch = p.builds.find((x) => x.name.startsWith(w.name));
      return discover(
        dialog(
          "project-" + i,
          w.name,
          `<p class="eyebrow">${e(w.type)}</p><p class="lead">${e(w.note)}</p>${prod ? `<p>${e(prod.blurb)}</p><ul class="prose-list">${prod.bullets.map((t) => `<li>${e(t)}</li>`).join("")}</ul>${tags(prod.stack.split(" · "))}` : arch ? `<p>${e(arch.text)}</p>${tags(arch.stack.split(" · "))}` : ""}${w.link ? `<div class="actions">${link(w.link, "View repository")}</div>` : ""}`,
          "From the project village",
        ),
        w.name,
        j.projectArt[w.name] || j.defaultProjectArt,
        w.type,
      );
    })
    .join("");
  const skillHTML = p.skills
    .map(
      (g, i) =>
        `<button class="workshop-tool" data-open="${dialog("tool-" + i, g.category, `${tags(g.items)}${g.tools.map((t) => `<div class="tool-note"><img src="assets/icons/${e(t.icon)}.svg" width="28" height="28" alt="" loading="lazy"><div><h3>${e(t.name)}</h3><p>${e(t.detail)}</p></div></div>`).join("")}`, "Inside the workshop")}" aria-haspopup="dialog"><span class="peg" aria-hidden="true"></span><span class="tool-symbol" aria-hidden="true">${["☁", "⎈", "⌘", "↗", "◇", "⌁", "▤", "⌨", "◎", "⚙"][i % 10]}</span><span>${e(g.category)}</span><span class="tool-arrow">↗</span></button>`,
    )
    .join("");
  const briefsId = dialog(
    "briefs-dialog",
    "Notes from the workbench",
    p.prompts
      .map(
        (b, i) =>
          `<details><summary>${e(b.title)}</summary><p class="eyebrow">${e(b.project)}</p><blockquote id="brief-${i}">${e(b.text)}</blockquote><button class="text-button" data-copy="brief-${i}">Copy brief</button></details>`,
      )
      .join(""),
    "Original engineering briefs",
  );
  const bodyById = {
    home: `<div class="welcome-copy"><p class="eyebrow">${e(p.greeting)} / ${e(p.contact.location)}</p><h1>Hi, I’m <em>${e(p.shortName)}.</em></h1><p class="hero-headline">${e(j.heroLine)}</p><p class="welcome-note">${e(j.invitation)}</p><a class="primary walk-cta" href="#${e(j.stops[0]?.id || "home")}">Walk Through My Journey <span aria-hidden="true">→</span></a><div class="quick-actions">${resume}<a href="mailto:${e(p.contact.email)}">Contact Me</a>${link(p.contact.linkedin, "LinkedIn")}</div></div><span class="house-note">The journey starts with curiosity.</span><div class="hero-character" aria-hidden="true">${engineer(j.character)}</div>`,
    about: `<div class="story-copy"><p class="eyebrow">01 / The lookout</p><h2>${e(j.stops.find((x) => x.id === "about")?.title)}</h2><p class="story-lead">${e(p.about[0])}</p><p class="story-caption">${e(j.aboutLine)}</p><button class="ink-link" data-open="${aboutId}">Meet the person behind the platforms ↗</button></div><div class="lookout-note"><span class="handwritten">${e(p.aboutLine)}</span></div>`,
    career: `<div class="scene-heading"><p class="eyebrow">02 / Milestone town</p><h2>${title("career", "Every place left a mark.")}</h2><p>From the foundations to the founding team. Open a building to step inside.</p></div><div class="town career-town">${careerHTML}</div>`,
    impact: `<div class="scene-heading"><p class="eyebrow">03 / The cloud highlands</p><h2>${title("impact", "Good engineering. Real-world impact.")}</h2><p>Behind every number: decisions, teams, and the work of making things better.</p></div><div class="achievement-landscape">${impactHTML}</div>`,
    world: `<div class="scene-heading"><p class="eyebrow">04 / The observatory</p><h2>${title("world", "A world of connected systems.")}</h2><p>Follow a signal. Explore the thinking behind the infrastructure.</p></div><div class="constellation">${worlds}</div><p class="scene-footnote">Illustrated landmarks represent areas of work, not a production network diagram.</p>`,
    projects: `<div class="scene-heading"><p class="eyebrow">05 / The makers’ village</p><h2>${title("projects", "Small ideas. Open doors.")}</h2><p>Products, experiments, and friendly help. Every workshop has a story.</p></div><div class="village">${projectHTML}</div>`,
    skills: `<div class="workshop-heading"><p class="eyebrow">06 / The workshop</p><h2>${title("skills", "The right tool. For the real problem.")}</h2><p>No ratings. No percentages. Just tools, and the work behind them.</p><button class="ink-link" data-open="${briefsId}">Read my workbench notes ↗</button></div><div class="pegboard">${skillHTML}</div>`,
    contact: `<div class="farewell-copy"><p class="eyebrow">07 / The meeting place</p><h2>${title("contact", "Good things start with a hello.")}</h2><p>${e(j.contactLine)}</p><a class="email-link" href="mailto:${e(p.contact.email)}">${e(p.contact.email)} ↗</a><div class="quick-actions">${link(p.contact.linkedin, "LinkedIn")}${link(p.contact.github, "GitHub")}${resume}</div><p class="small">Direct email, no tracking or submission service.</p><a class="walk-again" href="#home">↶ Walk again</a></div>`,
  };
  const stops = [
    {
      id: "home",
      label: "Welcome",
      art: "home",
      illustration: j.homeIllustration,
    },
    ...j.stops,
  ];
  const scenes = stops
    .map(
      (stop, i) =>
        `<section class="scene scene-${e(stop.id)}" data-scene="${e(stop.id)}" data-index="${i}" id="${e(stop.id)}" aria-label="${e(stop.label)}"><div class="scene-art" aria-hidden="true">${
          stop.illustration
            ? `<img class="landscape custom-landscape" src="${e(stop.illustration)}" alt="">`
            : scenery(stop.art || stop.id, j.character) +
              (stop.id === "home" || stop.id === "contact"
                ? scenery(stop.art || stop.id, j.character)
                    .replace(
                      'class="landscape"',
                      'class="landscape landscape-mobile"',
                    )
                    .replace(
                      'viewBox="0 0 1440 700"',
                      'viewBox="0 280 800 420"',
                    )
                    .replace("xMidYMax slice", "xMinYMax meet")
                : "")
        }</div><div class="scene-content">${bodyById[stop.id] || ""}</div><span class="destination-marker" aria-hidden="true">${String(i).padStart(2, "0")} / ${e(stop.label)}</span></section>`,
    )
    .join("");
  const mapId = dialog(
    "map-dialog",
    "Choose a destination.",
    `<p>The scenic route is optional. Step straight to what interests you.</p><ol class="map-list">${stops.map((stop, i) => `<li><a href="#${e(stop.id)}" data-map-link><span>${String(i).padStart(2, "0")}</span>${e(stop.label)}<span>↗</span></a></li>`).join("")}</ol>`,
    "Your journey map",
  );
  const palette = Object.entries(j.palette)
    .map(
      ([theme, colors]) =>
        `${theme === "light" ? ":root" : ":root[data-theme=dark]"}{${Object.entries(
          colors,
        )
          .map(([k, v]) => `--scene-${k}:${v}`)
          .join(";")}}`,
    )
    .join("");
  return `<!doctype html><html lang="en" data-theme="${e(s.defaultTheme)}" data-motion="${s.motion ? "on" : "off"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(s.displayName)} — Walk Through My Engineering Journey</title><meta name="description" content="${e(s.positioning)}"><meta name="theme-color" content="${j.palette.light.sky}"><link rel="canonical" href="${e(s.url)}"><meta property="og:type" content="website"><meta property="og:title" content="${e(s.displayName)} — An Engineering Journey"><meta property="og:description" content="${e(s.positioning)}"><meta property="og:image" content="${e(new URL(s.socialImage, s.url))}"><meta property="og:url" content="${e(s.url)}"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="assets/favicon.svg"><link rel="stylesheet" href="assets/portfolio.css"><style>${palette}</style><script>try{const t=localStorage.getItem('profile-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch{}</script><script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "Person", name: p.name, url: s.url, jobTitle: p.title, sameAs: [p.contact.linkedin, p.contact.github] }).replace(/</g, "\\u003c")}</script><script src="assets/app.js" defer></script></head><body><a class="skip" href="#main">Skip to journey</a><header class="travel-header"><a class="atlas-brand" href="#home"><span class="compass-mark" aria-hidden="true">✳</span><span>${e(p.shortName)}’s field notes<small>AN ENGINEERING JOURNEY</small></span></a><button id="quick-profile" class="profile-trigger" data-open="${profileId}" aria-haspopup="dialog">Quick Profile <span aria-hidden="true">↗</span></button></header><main id="main">${scenes}</main><div id="traveler" class="traveler" aria-hidden="true">${engineer(j.character)}<span class="traveler-shadow"></span></div><nav class="journey-controls" aria-label="Journey controls"><span id="current-stop">00 / Welcome</span><button data-open="${mapId}" aria-haspopup="dialog">Map <span aria-hidden="true">↗</span></button><button id="theme-toggle" aria-label="Switch to dark theme">Night ◐</button><button id="motion-toggle" aria-pressed="false">Pause motion</button></nav><div class="journey-progress" aria-hidden="true"><span></span></div><div class="dialog-library">${dialogs.join("")}</div><p id="feedback" role="status" class="toast"></p><noscript><style>dialog{display:block;position:static;margin:24px auto;max-height:none}dialog .close,[data-open],.journey-controls,.hero-character,.traveler{display:none!important}.dialog-library{padding:20px}body{overflow:auto}</style><p class="noscript-note">JavaScript is off. All journey notes are available below the illustrations.</p></noscript></body></html>`;
}
