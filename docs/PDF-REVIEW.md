# Resume and brochure review

Reviewed on 16 November 2026. Scope: downloadable documents and their generation/packaging only. The website's layout, illustrations, components, navigation and interactions were not redesigned.

## Original implementation

- `assets/resume.pdf` was a four-page Google Docs export. `data/site.json` selected it, `scripts/journey.mjs` produced the download anchor, and `scripts/build.mjs` copied the file into the production output. There was no local resume generator.
- No brochure PDF, brochure download configuration or brochure generator was found in the repository or reachable Git history. The new brochure therefore has no genuine "before" version to compare.
- The original resume was downloaded from the live site's actual resume link and compared with the repository asset. Its SHA-256 was `2e407d4eeb7a1e1792941fef3c7b020e7a46877c301c56fa7bdcb02be2a02fba`. The original remains recoverable as `e7f4643:assets/resume.pdf` in Git.

The original already had selectable text, embedded fonts with Unicode mappings, PDF tags and valid email/LinkedIn annotations. Those capabilities were retained rather than described as missing.

## Before and after

Every original resume page (four), every revised resume page (three), and both new brochure pages were rendered to PNG and visually inspected. The review included headings, text wrapping, spacing, alignment, margins, page boundaries, footer placement and consistent visual treatment.

| Area | Original | Revised |
| --- | --- | --- |
| Resume pagination | Four pages; pages 2 and 3 began with Lyric bullet continuations, and page 4 began with a Thoughtworks continuation. | Three pages: summary/skills/selected work/education; complete Lyric responsibilities; earlier employment. |
| Education | School name and date appeared to touch. | School has its own heading; degree, month dates and location have a separate readable line. |
| Page balance | The final page was less than half filled. | Content is grouped by purpose and role, with consistent page furniture. |
| Typography | Readable export, but inconsistent continuation context. | Embedded sans-serif family, distinct section hierarchy and consistent spacing; resume body is 10.4 pt with 13 pt leading. |
| Resume links | Two annotations: email and LinkedIn. | Five annotations: email, LinkedIn, GitHub profile, portfolio and SecretMesh. |
| Metadata | Title was `Satheesh_Prabhakaran.docx`; author, subject, keywords and document language were absent. | Descriptive title, author, professional subject, keywords, UTC timestamps, `en-US` language and section bookmarks. |
| Brochure | No existing document located. | Two-page editorial engineering profile using restrained blue/coral accents, verified impact, career chronology and vector architecture illustrations. |

No measured clipping or text-block overlap was found in the original. The revised layout fixes pagination and visible spacing problems without claiming the old document had defects that were not observed. A draft brochure header collision was corrected before final rendering.

## Content accuracy and completeness

The detailed original resume and existing `data/profile.json` are the professional evidence sources. `data/documents.json` records provenance and preserves the original's additional responsibilities, client dates and education month dates. Content was lightly condensed without inventing employment, certifications or metrics.

The retained details include Lyric's SRE/on-call responsibilities, SLIs/SLOs, runbooks/RCA, Crossplane XRDs, Kamaji/Gardener and CI/CD migration; KLA's IBM RTC, Nutanix, Morpheus and Puppet work; Thoughtworks client assignments and Blackbox; and TCS's SDN orchestration, OpenStack/Ceph and monitoring stack. SecretMesh and LitOverLap details come from the existing portfolio records. LitOverLap is explicitly presented as friendly help.

The `$1M+` figure remains total annual cloud savings; the brochure does not assign the whole amount to ARM64 alone. Organizational growth stages are not presented as employee counts, and compliance leadership is not converted into a claim of personal certification. Verification here means consistency with the supplied professional records, not independent confirmation with employers.

## Implemented source and packaging

- `scripts/generate_documents.py`: standalone ReportLab/pypdf generation, A4 layout, embedded fonts, links, metadata, section bookmarks and a PDF structure tree.
- `data/documents.json`: document-only source details and references into shared profile records.
- `scripts/check_documents.py`: independent text, geometry, metadata, font, link and structure validation.
- `scripts/requirements-documents.txt`: pinned Python dependencies.
- `data/site.json`, `data/schema.ts`, `scripts/build.mjs`: optional brochure asset path and packaging support. The existing resume path is retained.
- `.gitattributes`: treats PDF assets as binary so Git does not interpret PDF cross-reference data as a text diff.

The generator uses the default configuration files. It does not consume the website build's alternative-config environment variables. The website build continues to copy reviewed PDF assets rather than generating them during Pages deployment. Setup and regeneration commands are in the README.

## Executed validation

The document checker completed successfully. The detailed local report is `artifacts/pdf-review/validation.json`.

| Check | Resume | Brochure |
| --- | --- | --- |
| Page count | 3 | 2 |
| Page size | A4, 595.276 × 841.890 pt | A4, 595.276 × 841.890 pt |
| Text extraction | pypdf and Poppler passed | pypdf and Poppler passed |
| Source checks per text extractor | 122, none missing | 25, none missing |
| Embedded used fonts with Unicode maps | 2, passed | 2, passed |
| Link annotations | 5 valid destinations and bounds | 7 valid destinations and bounds |
| Metadata and UTC dates | Passed | Passed |
| PDF tag/parent-tree/link relationships | Passed | Passed |
| Significant text overlap and print bounds | None found; passed | None found; passed |

Resume content follows a single-column reading order, uses ordinary text for contacts and skills, and avoids icon-only labels or rasterized text. Figure descriptions and artifact tags distinguish brochure diagrams and running page decoration from main content. These are ATS/accessibility improvements, not universal ATS compatibility or PDF/UA certification.

`npm run check` also passed: lint, configuration type checking, 21 unit tests and the production build. PDF checks are separate from that Node command and must be run explicitly when documents change.

## Browser validation and evidence

Both generated PDFs were downloaded through real browser download anchors. Their bytes matched the generated deliverables, installed assets and production `dist/` copies. Both documents were also opened in Chrome's native PDF viewer at a 390 × 844 CSS-pixel viewport. Fixed-A4 fit-to-width text is small on that viewport and requires zoom for comfortable body-text reading.

Two PDF hyperlinks were followed in the browser: the brochure's portfolio link opened the live portfolio, and the resume's GitHub link opened `github.com/vsp6692`. All 12 PDF link annotations passed the configured-destination and rectangle checks. Email links were inspected but not activated; no email was sent. This review did not claim to open every external destination interactively.

Local evidence is intentionally kept outside source control:

- `artifacts/pdf-review/before/resume.pdf` and `resume-1.png` through `resume-4.png`: original file and every rendered page.
- `artifacts/pdf-review/after/resume-1.png` through `resume-3.png`: revised resume pages.
- `artifacts/pdf-review/after/brochure-1.png` and `brochure-2.png`: new brochure pages.
- `artifacts/pdf-review/education-before.png` and `education-after.png`: focused spacing comparison.
- [Before/after gallery](../output/pdf/review.html): self-contained local review with every page and document download links.
- [Resume at phone width](../artifacts/pdf-review/resume-phone-width.png) and [brochure at phone width](../artifacts/pdf-review/brochure-phone-width.png): native Chrome PDF viewer screenshots.
- `artifacts/pdf-review/downloaded-final-resume.pdf` and `downloaded-final-brochure.pdf`: browser-downloaded final files, verified byte-for-byte.
- `output/pdf/Satheesh_Prabhakaran_Resume.pdf` and `output/pdf/Satheesh_Prabhakaran_Brochure.pdf`: reviewed deliverables.

The visual audit was completed before publication. After the Pages workflow finishes, verify the deployed `assets/resume.pdf` and `assets/brochure.pdf` against the reviewed files. The release reference SHA-256 values are:

- Resume: `d8a7e39ea36f25096d6d2ac7de5aa552efc287424093fbb50835a53dc668ff07`.
- Brochure: `2f7977a0efde407304bdd1ceda2b61262e410a4910576a56c34435e067a7762c`.

Both PDFs have fixed A4 layouts. Small-phone reading may require zoom; no reflowing mobile PDF format is claimed. No physical printer, physical mobile device, external ATS service or formal PDF/UA validator was used. The brochure's background is decorative, with important content inside the print margins; printer borderless behavior is not assumed.
