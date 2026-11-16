// A local index of published profile records. No model, network requests or chat history.
const clean = (value) => String(value ?? "").trim();
const words = (value) =>
  clean(value)
    .toLowerCase()
    .normalize("NFKC")
    .match(/[a-z0-9]+/g) || [];
const stopWords = new Set(
  "a an and are as at be been building built by can could did do does for from give had has have he her him his how i in into is it me my of on or our please profile show tell that the their them there these they this to us use uses used using was were what when where which who why will with work works would you your about describe explain experience engineering engineer details examples technical practical years information much many".split(
    " ",
  ),
);
const aliases = {
  saves: "saving",
  saved: "saving",
  save: "saving",
  savings: "saving",
  costs: "cost",
  optimization: "cost",
  optimizations: "cost",
  finops: "cost",
  careers: "career",
  jobs: "career",
  job: "career",
  employers: "career",
  employer: "career",
  projects: "project",
  architectures: "architecture",
  platforms: "platform",
  clouds: "cloud",
  pipelines: "pipeline",
  deployments: "deployment",
  secrets: "secret",
  controls: "control",
  skills: "skill",
  technologies: "technology",
};
const terms = (value) => [
  ...new Set(
    words(value)
      .filter((word) => !stopWords.has(word))
      .map((word) => aliases[word] || word),
  ),
];

/** Only deliberate public professional fields enter the guide. */
export function buildProfileIndex(profile) {
  const records = [];
  const add = (id, title, parts, dialogId, kind, hints = "") => {
    const snippets = parts.map(clean).filter(Boolean);
    if (!snippets.length) return;
    records.push({ id, title: clean(title), snippets, dialogId, kind, hints });
  };
  add(
    "introduction",
    profile.title,
    [profile.intro],
    "profile-dialog",
    "Profile",
    "summary career",
  );
  (profile.about || []).forEach((paragraph, index) =>
    add(
      `about-${index}`,
      "About me",
      [paragraph],
      "about-notes",
      "About",
      "background",
    ),
  );
  (profile.journey || []).forEach((job, index) => {
    const id = job.id || String(index);
    add(
      `career-${id}`,
      job.company,
      [job.role, job.dates, ...(job.bullets || [])],
      `career-${id}`,
      "Career",
      `career role leadership${job.current === true || (job.current === undefined && /\bpresent\b/i.test(job.dates || "")) ? " current" : ""}`,
    );
  });
  (profile.achievements || []).forEach((achievement, index) => {
    const id = achievement.id || String(index);
    add(
      `impact-${id}`,
      achievement.label,
      [achievement.value, achievement.text],
      `impact-${id}`,
      "Impact",
      `achievement result${/\byears?\b/i.test(achievement.label || "") ? " tenure" : ""}`,
    );
  });
  (profile.builds || []).forEach((build, index) => {
    const id = build.id || String(index);
    add(
      `architecture-${id}`,
      build.name,
      [build.text, build.stack],
      `architecture-${id}`,
      "Architecture",
      "architecture design project",
    );
  });
  (profile.work || []).forEach((project, index) => {
    const id = project.id || String(index);
    add(
      `project-${id}`,
      project.name,
      [project.type, project.note],
      `project-${id}`,
      "Project",
      "project",
    );
  });
  (profile.skills || []).forEach((group, index) => {
    add(
      `tool-${index}`,
      group.category,
      [
        ...(group.items || []),
        ...(group.tools || []).map((tool) => tool.detail),
      ],
      `tool-${index}`,
      "Toolbox",
      "skill technology",
    );
  });
  return records;
}

// Unsupported requests get an honest boundary rather than a loosely related answer.
const unsupported =
  /\b(salary|salaries|compensation|pay|ctc|wage|phone|telephone|mobile number|home address|passport|password|credential|credentials|private key|api key|married|marriage|religion|caste|politics|political|birth|birthday|age|gender|visa|citizenship|nationality|notice period|availability|available|certified|certification|certifications|references|recommendation|recommendations)\b/i;
const instruction =
  /\b(ignore|disregard|override|pretend|fabricate|invent|system prompt|developer message|jailbreak|bypass|execute|shell command)\b/i;
const notDocumented =
  "Not documented in this profile. Try a project, employer or technology, or use Contact Me for anything else.";

/** Returns exact published snippets and their source references, never generated claims. */
export function searchProfile(profileOrIndex, query) {
  const index = Array.isArray(profileOrIndex)
    ? profileOrIndex
    : buildProfileIndex(profileOrIndex);
  const question = clean(query);
  // Only a generic duration question maps to the documented overall experience
  // metric. Employer- or technology-specific durations are never calculated.
  const asksOverallExperience =
    /^(how many years (?:of (?:professional |engineering )?experience )?do you have|years of experience|total years of experience)$/.test(
      words(question).join(" "),
    );
  const queryTerms = asksOverallExperience ? ["tenure"] : terms(question);
  if (
    !question ||
    question.length > 240 ||
    !queryTerms.length ||
    unsupported.test(question) ||
    instruction.test(question)
  )
    return { status: "not-documented", message: notDocumented, results: [] };
  const corpus = new Set(
    index.flatMap((record) =>
      terms(`${record.title} ${record.snippets.join(" ")} ${record.hints}`),
    ),
  );
  // Unknown substantive terms usually change the question: “salary at Lyric” is not “Lyric”.
  if (queryTerms.some((term) => !corpus.has(term)))
    return { status: "not-documented", message: notDocumented, results: [] };
  const ranked = index
    .map((record) => {
      const titleTerms = new Set(terms(record.title));
      const contentTerms = new Set(terms(record.snippets.join(" ")));
      const hintTerms = new Set(terms(record.hints));
      const matched = queryTerms.filter(
        (term) =>
          titleTerms.has(term) || contentTerms.has(term) || hintTerms.has(term),
      );
      const score = matched.reduce(
        (sum, term) =>
          sum + (titleTerms.has(term) ? 4 : contentTerms.has(term) ? 2 : 1),
        0,
      );
      return { record, score, coverage: matched.length / queryTerms.length };
    })
    .filter((entry) => entry.coverage === 1)
    .sort((a, b) => b.score - a.score);
  if (!ranked.length)
    return { status: "not-documented", message: notDocumented, results: [] };
  return {
    status: "found",
    message:
      "Published profile excerpts. Open a source to explore the full story.",
    results: ranked.slice(0, 3).map(({ record }) => record),
  };
}

function bindGuide() {
  const dialog = document.getElementById("guide-dialog");
  if (!dialog) return;
  const form = dialog.querySelector("form");
  const input = dialog.querySelector("input");
  const output = dialog.querySelector(".guide-results");
  const status = dialog.querySelector(".guide-status");
  let index;
  try {
    index = JSON.parse(document.getElementById("guide-records").textContent);
  } catch {
    status.textContent =
      "The profile guide is unavailable. Quick Profile and the journey notes are still available.";
    form.hidden = true;
    return;
  }
  const search = () => {
    const answer = searchProfile(index, input.value);
    output.replaceChildren();
    status.textContent = answer.message;
    status.scrollIntoView({ block: "nearest", behavior: "instant" });
    answer.results.forEach((record) => {
      const article = document.createElement("article");
      article.className = "guide-result";
      const heading = document.createElement("h3");
      heading.textContent = record.title;
      article.append(heading);
      record.snippets.forEach((snippet) => {
        const paragraph = document.createElement("p");
        paragraph.textContent = snippet;
        article.append(paragraph);
      });
      const source = document.createElement("button");
      source.className = "ink-link guide-source";
      source.type = "button";
      source.dataset.open = record.dialogId;
      source.setAttribute("aria-haspopup", "dialog");
      source.textContent = `Open source: ${record.kind} · ${record.title} ↗`;
      article.append(source);
      output.append(article);
    });
  };
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    search();
  });
  dialog.querySelectorAll("[data-question]").forEach((button) => {
    button.addEventListener("click", () => {
      input.value = button.dataset.question;
      search();
    });
  });
}

if (typeof document !== "undefined") bindGuide();
