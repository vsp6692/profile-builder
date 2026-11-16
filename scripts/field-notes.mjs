const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

// The drawings explain only the components and relationships recorded in profile data.
export function renderArchitecture(build, id) {
  const flow = build.diagramKind === "flow";
  return `<div class="architecture-explorer" data-architecture>
    <p class="eyebrow">${flow ? "Delivery flow" : "Component map"} / select a part to explore</p>
    <div class="system-map ${flow ? "system-flow" : ""}" role="group" aria-label="${esc(build.name)} components">
      ${flow ? '<svg class="system-wire" viewBox="0 0 600 20" preserveAspectRatio="none" aria-hidden="true"><path d="M0 10H600"/></svg>' : ""}
      ${build.diagram.map(([name], i) => `<button class="system-node" id="${id}-node-${i}" data-node-target="${id}-part-${i}" aria-controls="${id}-part-${i}" aria-expanded="true"><svg viewBox="0 0 64 48" aria-hidden="true"><rect x="10" y="6" width="44" height="32" rx="6"/><path d="M18 16h17m-17 7h27M25 38v5m14-5v5M20 43h24"/><circle cx="45" cy="16" r="2"/></svg><span class="node-number">${String(i + 1).padStart(2, "0")}</span><strong>${esc(name)}</strong></button>`).join("")}
    </div>
    <div class="system-explanations">${build.diagram.map(([name, description], i) => `<section class="system-explanation" id="${id}-part-${i}" aria-labelledby="${id}-node-${i}"><h3>${esc(name)}</h3><p class="node-tools">${esc(description)}</p>${build.nodeDetails?.[i] ? `<p>${esc(build.nodeDetails[i])}</p>` : ""}</section>`).join("")}</div>
    <p class="architecture-caption">${flow ? "A high-level sequence from the documented platform work." : "Documented responsibilities, grouped by component. This is not a production network topology."}</p>
    <details class="architecture-context"><summary>Read the engineering context</summary><p>${esc(build.text)}</p></details>
  </div>`;
}

export function renderCaseStudy(achievement, sources) {
  const story = achievement.caseStudy;
  if (!story) return "";
  return `<ol class="evidence-trail">${[
    ["The context", story.context],
    ["The engineering decision", story.decision],
    ["The result", story.result],
  ]
    .map(
      ([label, text], i) =>
        `<li><span class="evidence-number" aria-hidden="true">0${i + 1}</span><div><h3>${label}</h3><p>${esc(text)}</p></div></li>`,
    )
    .join(
      "",
    )}</ol>${story.note ? `<p class="evidence-note">${esc(story.note)}</p>` : ""}<div class="source-trail"><span class="eyebrow">From the professional record</span>${story.sourceIds
    .map((id) => sources.get(id))
    .filter(Boolean)
    .map(
      (source) =>
        `<button class="ink-link" data-open="${source.target}" aria-haspopup="dialog">${esc(source.label)} ↗</button>`,
    )
    .join("")}</div>`;
}
