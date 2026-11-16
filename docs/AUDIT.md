# Audit and redesign record

The original application was a single static HTML file with profile data, renderer, styles, embedded PDF and base64 technology logos. It had no build tool or application framework. GitHub Actions published the whole repository. Existing functions included project filters, theme and motion controls, a delivery demo, copyable briefs, interactive tool descriptions, email draft preparation, and resume download.

## Findings

- Multiple generations of CSS overrode each other, leaving walking-theme markup and dormant animations.
- Projects appeared in several sections, while important achievements competed with technical details.
- All professional content was client-rendered, with an empty main element before JavaScript.
- Approximately 550 KB of HTML included assets that every visitor downloaded. The active portrait was 2.1 MB.
- Navigation was dense on intermediate screens. There was no recruiter-oriented perspective.
- Architecture nodes did not reveal responsibilities interactively.
- No sitemap, canonical URL, social card, structured data, automated accessibility checks, or build validation.
- Skills and project claims were sourced from the existing profile, not independently verified. Preserve provenance and avoid additional claims.

## Design decisions

Keep static HTML, CSS and vanilla JavaScript. A small Node renderer produces HTML from JSON; no framework migration or client runtime dependency. Use an editorial layout, red/blue accents, system typography and light/dark tokens. Introduce shared recruiter/engineering perspectives, visible career highlights with expandable detail, metric context, consolidated projects, component disclosures, and ten technology categories.

The delivery toy and walking decorations were replaced by contextual interaction: architecture components, skill evidence, progressive disclosure, count-ups, brief copying, and navigation feedback. Original briefs remain available in Engineering view. No verified employment or project records were deleted. The original PDF is extracted byte-for-byte and remains independent of webpage content.

## Boundaries

No new availability, certification, client, scale, or business-result claims were added. Projects without detailed source records retain concise notes instead of invented case studies. LitOverLap remains friendly help. Security leadership for ISO 27001/SOC 2 is not represented as a personal certification. External accounts and project URLs are retained from the supplied repository.
