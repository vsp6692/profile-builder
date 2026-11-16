import { buildProfileIndex, searchProfile } from "../assets/guide.js";

const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );

export function renderGuide(profile, site) {
  if (!site.assistant?.enabled) return "";
  const index = buildProfileIndex(profile);
  const questions = [
    ["Cloud savings", "cloud savings"],
    ["Career journey", "career"],
    ["Security & governance", "security"],
    ["Cloud architecture", "cloud architecture"],
  ].filter(([, query]) => searchProfile(index, query).status === "found");
  const records = JSON.stringify(index).replace(/</g, "\\u003c");
  return `<dialog id="guide-dialog" aria-labelledby="guide-dialog-title"><div class="dialog-head"><span class="eyebrow">A guide to the field notes</span><button class="close" data-close aria-label="Close profile guide">Close ×</button></div><h2 id="guide-dialog-title">Ask about my work.</h2><p class="guide-intro">Search my published profile. Read exact excerpts with source links. Your questions stay in this browser.</p><form class="guide-form" role="search"><label for="profile-question">What would you like to explore?</label><div><input id="profile-question" name="question" type="search" maxlength="240" autocomplete="off" placeholder="Try cloud savings or Kubernetes" aria-describedby="guide-hint"><button class="primary" type="submit">Find notes →</button></div><p id="guide-hint" class="small">Try a project, employer or technology. No generated answers.</p></form><div class="guide-suggestions" aria-label="Suggested topics">${questions.map(([label, query]) => `<button type="button" class="text-button" data-question="${escape(query)}">${escape(label)} ↗</button>`).join("")}</div><p class="guide-status" role="status" aria-live="polite" aria-atomic="true">Choose a topic or enter a question to begin.</p><div class="guide-results" role="region" aria-label="Profile source excerpts"></div><script id="guide-records" type="application/json">${records}</script></dialog>`;
}
