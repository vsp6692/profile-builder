# Walk Through My Engineering Journey

An illustrated, configuration-driven engineering portfolio. Visitors travel through an original SVG landscape: a cabin, lookout, career town, cloud highlands, observatory, makers’ village, workshop, and meeting place. Scrolling animates a small engineer; landmarks open professional field notes. Quick Profile makes the whole journey optional.

Live: https://vsp6692.github.io/profile-builder/

## Build and run

Node.js 22+ and npm. The portfolio needs no API keys, backend, runtime libraries, external fonts, tracking, or cookies.

```sh
npm ci
npm run check
npm run test:browser
```

`check` runs lint, configuration type checks, unit tests and the production build. `npm run build` rebuilds by itself. Open `index.html` directly for the core journey, or serve `dist/` over HTTP. The optional profile guide uses a JavaScript module and requires HTTP hosting rather than `file://`. For a local preview:

```sh
python3 -m http.server 4173 --directory dist
```

Visit `http://localhost:4173`. The checked-in HTML is generated; edit configuration/source and rebuild. Browser tests use installed Google Chrome through Playwright.

The builder replaces `dist/` on every build so removed assets do not remain in the published output. Custom output directories passed to the exported `build()` function must be empty or carry the builder's `.profile-build-output` marker. Nonempty unowned directories and symlink outputs are rejected. Keep hand-authored files outside generated output directories.

## Make the journey yours

- `data/profile.json`: personal information, verified achievements, career history, projects, architecture, skills, original briefs and contact links. `data/profile.example.json` and its matching `data/site.example.json` provide a minimal starting point without the live profile's achievements, contact details or personal assets. Replace their example text before publishing.
- `data/site.json`: name, public URL, metadata, portrait, resume, social image, default theme/motion and optional features.
- `site.journey.heroLine`, `invitation`, `aboutLine`, `contactLine`: the opening and narrative copy.
- `site.journey.homeIllustration`: optional local asset replacing the opening landscape.
- `site.journey.stops`: reorder or omit destinations; edit `label`, `title` and `art`. Supported IDs: `about`, `career`, `impact`, `world`, `projects`, `skills`, `contact`. Home and Quick Profile remain available. `illustration: "assets/my-scene.svg"` replaces a destination landscape with your own local artwork. The build includes configured illustration assets.
- `site.journey.character`: hexadecimal colors for `skin`, `hair`, `shirt`, `backpack`, and `pants`. No identity is embedded in the animation component.
- `site.journey.palette.light` and `.dark`: scene colors for `sky`, `far`, `hill`, `ground`, `road`, `ink`, `red`, `blue`, and `paper`.
- `site.journey.careerBuildings`, `projectArt`, `defaultProjectArt`: choose original illustration types for career/project landmarks. Key `projectArt` by a project's stable `id`; legacy project-name keys remain a fallback. Types include `factory`, `studio`, `tower`, `cloud`, `vault`, `compass`, `map`, `chart`, `library`, `school`, `terminal`, `lab`, `tools`, and `mail`.
- `site.journey.worlds`: technical destinations, artwork, associated skill categories and `architectureIds` for the systems visitors can explore there.

Replace the example SVG portrait and social image with your own portrait and a shareable social card before publishing. The paired example deliberately omits `site.resume`, so no resume link or personal PDF is copied. When your resume is ready, add `"resume": "assets/my-resume.pdf"` to the site configuration and set `profile.resume.filename` to its download name. Changing JSON does not update the PDF automatically; use the document workflow below or supply your own PDF. After updating the default `data/profile.json` and `data/site.json`, `node scripts/social.mjs` generates an illustrated social card (requires Chrome; use a PNG path for `socialImage`). Asset and link paths are validated. All professional claims must come from your own records.

`PROFILE_CONFIG` and `SITE_CONFIG` optionally select alternative JSON files at build time. Use the examples as a **pair** so their IDs, metadata and assets match:

```sh
PROFILE_CONFIG=data/profile.example.json SITE_CONFIG=data/site.example.json npm run build
python3 -m http.server 4173 --directory dist
```

This builds the example into `dist/` and regenerates the root `index.html`; `npm run build` restores the default profile. For your fork, copy and customize both example configurations, then replace both default JSON files or supply both paths during deployment. Change the public URL, name, hero, contact, metadata, portrait and social card before publishing. No environment variables are required when using the default paths.

## Resume and engineering brochure

`scripts/generate_documents.py` creates two standalone A4 PDFs without rendering or changing the website UI. It joins identity, contacts, career headings, achievements and projects from `data/profile.json` with the detailed document content in `data/documents.json`. The latter preserves responsibilities and education dates from the original resume and controls the brochure's selected architecture stories. Update both files for your fork; never publish the supplied professional records as your own.

Install Python dependencies in an isolated environment. Poppler is also required for validation and page rendering (`brew install poppler` on macOS, or `sudo apt-get install poppler-utils` on Debian/Ubuntu):

```sh
python3 -m venv .venv-documents
source .venv-documents/bin/activate
python3 -m pip install -r scripts/requirements-documents.txt
npm run pdf:generate
npm run pdf:check -- --output artifacts/pdf-review/validation.json
```

The generator writes `output/pdf/<resume-filename-stem>_Resume.pdf` and `output/pdf/<resume-filename-stem>_Brochure.pdf`. It reads the default `data/profile.json`, `data/site.json` and `data/documents.json`; the website's `PROFILE_CONFIG` and `SITE_CONFIG` overrides do not apply to this standalone generator. `--output` selects another output directory.

Render **every page** and visually inspect the PNGs after changing content or layout. The checker verifies metadata, embedded fonts, selectable text, source coverage, A4 bounds, links and tag relationships; it cannot replace visual review or guarantee compatibility with every ATS or PDF reader. For the supplied profile:

```sh
mkdir -p artifacts/pdf-review/rendered
pdftoppm -scale-to 1600 -png output/pdf/Satheesh_Prabhakaran_Resume.pdf artifacts/pdf-review/rendered/resume
pdftoppm -scale-to 1600 -png output/pdf/Satheesh_Prabhakaran_Brochure.pdf artifacts/pdf-review/rendered/brochure
```

To install reviewed files into the website assets and validate the production build:

```sh
npm run pdf:generate -- --install
npm run pdf:check
npm run check
```

`--install` copies the resume to `site.resume` and the brochure to `site.brochure` (falling back to `assets/brochure.pdf` when omitted). Configure the optional `"brochure": "assets/brochure.pdf"` field to include that file in the Pages build. This copies a downloadable asset; it does not add or change website controls. The existing resume CTA continues using `site.resume`. With the supplied configuration, the deployed files are `assets/resume.pdf` and `assets/brochure.pdf` relative to the site's root.

The normal Node build and Pages workflow copy checked-in PDFs; they do not install Python or regenerate documents. Commit reviewed asset changes before deploying. See [the PDF review](docs/PDF-REVIEW.md) for the executed audit, before/after evidence and remaining validation limits.

## Structured stories and relationships

Use unique lowercase slug IDs such as `platform-role` or `secrets-project` for career, project, product, architecture and achievement records. IDs stay stable when display names change. The exported contracts are in `data/schema.ts`.

- Career records use `kind: "employment"` or `"independent"`, numeric `order` for ascending career chronology, and `current: true` for an ongoing role. The career town shows employment milestones; all records remain available from Quick Profile.
- Projects in `work[]` can reference `products[].id` through `productId` and `builds[].id` through `architectureIds`. A world's `architectureIds` selects its relevant systems. Reordering worlds no longer changes these associations.
- Architecture records retain `diagram`, an ordered list of `[component, summary]` pairs. `nodeDetails` supplies one explanation per component. Use `diagramKind: "flow"` only for a documented sequence; `"components"` groups responsibilities without claiming a network topology. Visitors can select nodes by pointer or keyboard. Full explanations remain in the generated HTML.
- An achievement's optional `caseStudy` contains `context`, `decision`, `result`, `sourceIds`, and an optional qualification `note`. `sourceIds` references supporting career, project or architecture records. Keep the result and attribution within the evidence: an optimization initiative is not automatically responsible for an entire savings figure.
- A project's optional `status` describes its actual stage. Separate `repoUrl` from `demoUrl`; omit either when no verified public destination exists. Legacy `link` is still accepted as a repository URL. The live configuration adds a demo only for this portfolio; it does not invent demos for the other projects.

Renaming a label is safe when relationships use IDs. Update references when changing an ID. The build rejects invalid references. Older records without IDs use positional dialog IDs; add explicit IDs before linking them from other records.

Earlier `sections`, `defaultView`, `headline` and `colors` fields are retained for source compatibility. Use `journey.stops`, Quick Profile, `journey.heroLine` and `journey.palette` for the current experience. There are no separate duplicated recruiter/engineering pages.

## Optional profile guide

The guide is **disabled by default**. Enable it in `data/site.json`:

```json
"assistant": { "enabled": true }
```

Rebuild and serve over HTTP. “Ask about my work” opens a local search over published professional records. Suggested topics and questions return exact excerpts with buttons opening their source notes. It is a deterministic profile guide, not an LLM or general-purpose chatbot. It does not send questions anywhere or keep chat history.

Unsupported, private, ambiguous or undocumented requests receive a “Not documented in this profile” response. The guide does not index the phone number or use GitHub metadata as evidence of professional achievements. Disabling it removes the guide dialog and its script from the production output.

## Cached public GitHub information

GitHub information is fetched at build time, never on a visitor's page load. Configure an explicit public-repository allowlist:

```json
"github": {
  "enabled": true,
  "repositories": ["your-account/your-project"],
  "ttlHours": 24
}
```

A repository must also appear in a configured project/product URL. Only those matching entries can be fetched or rendered. Project notes show the available language, license, last-push date and snapshot date. These describe the repository, not the engineer's business impact.

To refresh locally:

```sh
node scripts/refresh-github.mjs
npm run build
```

The optional `GITHUB_TOKEN` environment variable improves API rate limits. It is read only by the refresh process, never embedded in HTML or sent by the browser. The Pages workflow uses its built-in token; no personal token is required.

The default TTL is 24 hours. A fresh cached entry avoids another API request. The daily Pages workflow restores the latest Actions cache, refreshes eligible entries and saves the result. The checked-in `data/github-cache.json` is the initial fallback. Network errors, rate limits and malformed responses retain the last valid snapshot; missing metadata never blocks the portfolio build. A repository confirmed removed, inaccessible with 404/410, or nonpublic loses its cached entry. Each rendered snapshot retains its fetch date and is marked stale when the build sees it beyond the TTL.

Set `github.enabled` to `false` to omit metadata and skip refresh requests. A normal `npm run build` is network-independent and uses the available cache. Fork owners must replace the allowlist and project links, and enable GitHub Actions if scheduled refreshes are desired.

## How it works

- `scripts/build.mjs`: configuration validation, safe build assembly, sitemap/robots output.
- `scripts/journey.mjs`: scene and field-note renderers using one shared data model.
- `scripts/field-notes.mjs`: source-linked impact stories and selectable architecture components.
- `scripts/art.mjs`: original SVG scenery, landmarks, and engineer; no borrowed reference artwork.
- `scripts/github.mjs`, `scripts/refresh-github.mjs`: allowlisted public metadata, refresh and last-good cache handling.
- `scripts/guide.mjs`, `assets/guide.js`: optional local profile index, grounded search and source navigation.
- `assets/portfolio.css`: illustrated world, responsive compositions, theme tokens, character gait and native-dialog presentation.
- `assets/app.js`: native scroll tracking, scroll-only character gait, subtle parallax, map navigation, dialogs, architecture controls, theme/motion controls and clipboard feedback.
- `data/schema.ts`, `data/validate-types.ts`: configuration contracts. Frontend code remains JavaScript; configuration is TypeScript checked.
- `tests/`: configuration, cache, guide and real-browser regression coverage.

Native scrolling is retained on desktop and mobile; there is no wheel interception or touch-scroll hijacking. Native dialogs trap focus, close with Escape, and return focus to the triggering landmark or source link. Professional notes are in the generated HTML; with JavaScript off they become readable inline after the scenes.

Quick Profile gives direct access to the current role, achievements, expertise, resume, contact and career notes. The site has no secure submission backend: contact uses direct email and social links. Copy-email is also available at the final destination, with explicit feedback when clipboard access is unavailable. Motion can be paused, respects the operating system preference and pauses offscreen scenery.

## GitHub Pages

In Settings → Pages select **GitHub Actions**. Set `site.url` to your full Pages URL with repository path and trailing slash. Push to `main`. The workflow refreshes optional repository metadata, runs lint, configuration type checks, unit tests and build, then publishes only `dist/`. It also runs daily at 04:23 UTC and can be launched manually with `workflow_dispatch`; GitHub may delay scheduled jobs.

Relative URLs support repository subpaths. For a custom domain update the canonical URL and Pages settings. Repository-level `robots.txt` is supplied, though robots policy is only authoritative at a domain root.

## Validation and visual evidence

`npm run check` runs ESLint, TypeScript configuration checks, unit tests and production build. `npm run test:browser` exercises the deployed static artifact in Chrome and saves screenshots under ignored `artifacts/`. See `docs/VALIDATION.md` for executed checks, current results and limitations; commands and planned coverage are not a claim that a run passed.

See `docs/INCREMENTAL-IMPROVEMENTS.md` for the latest audit and improvement scope, and `docs/JOURNEY-COMPARISON.md` for the earlier browser comparison with the inspiration. `docs/lighthouse-summary.json` describes the previous editorial design, and `docs/journey-lighthouse-summary.json` describes the initial illustrated redesign. Neither report should be treated as a fresh measurement of later changes.

Technology icons: Devicon MIT, with license in `assets/icons/LICENSE`. All journey artwork was created for this repository. No repository-wide licensing rights have been inferred; choose an explicit project license if you wish to grant reuse rights beyond forking/customization on GitHub.

The incremental improvements are documented in `docs/INCREMENTAL-IMPROVEMENTS.md`. Current checks, browser coverage, screenshots and the fresh local Lighthouse run are in `docs/VALIDATION.md` and `docs/incremental-lighthouse-summary.json`. `npm run test:browser` now runs the journey, discovery and opt-in guide suites; the latter two start and stop their own local HTTP servers.
