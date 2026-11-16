# Walk Through My Engineering Journey

An illustrated, configuration-driven engineering portfolio. Visitors travel through an original SVG landscape: a cabin, lookout, career town, cloud highlands, observatory, makers’ village, workshop, and meeting place. Scrolling animates a small engineer; landmarks open professional field notes. Quick Profile makes the whole journey optional.

Live: https://vsp6692.github.io/profile-builder/

## Build and run

Node.js 22+ and npm. No API keys, backend, runtime libraries, external fonts, tracking, or cookies.

```sh
npm ci
npm run check
npm run build
npm run test:browser
```

Open `index.html` directly, or deploy `dist/`. The checked-in HTML is generated; edit configuration/source and rebuild. Browser tests use installed Google Chrome through Playwright. They do not require a local server.

## Make the journey yours

- `data/profile.json`: personal information, verified achievements, career history, projects, architecture, skills, original briefs and contact links. `data/profile.example.json` provides a minimal starting point. Remove the example's sample data before publishing.
- `data/site.json`: name, public URL, metadata, portrait, resume, social image and default theme/motion.
- `site.journey.heroLine`, `invitation`, `aboutLine`, `contactLine`: the opening and narrative copy.
- `site.journey.homeIllustration`: optional local asset replacing the opening landscape.
- `site.journey.stops`: reorder or omit destinations; edit `label`, `title` and `art`. Supported IDs: `about`, `career`, `impact`, `world`, `projects`, `skills`, `contact`. Home and Quick Profile remain available. `illustration: "assets/my-scene.svg"` replaces a destination landscape with your own local artwork. The build includes configured illustration assets.
- `site.journey.character`: hexadecimal colors for `skin`, `hair`, `shirt`, `backpack`, and `pants`. No identity is embedded in the animation component.
- `site.journey.palette.light` and `.dark`: scene colors for `sky`, `far`, `hill`, `ground`, `road`, `ink`, `red`, `blue`, and `paper`.
- `site.journey.careerBuildings`, `projectArt`, `defaultProjectArt`: choose original illustration types for career/project landmarks. Types include `factory`, `studio`, `tower`, `cloud`, `vault`, `compass`, `map`, `chart`, `library`, `school`, `terminal`, `lab`, `tools`, and `mail`.
- `site.journey.worlds`: technical destinations, their illustrations and associated skill-category names.

Replace `assets/portrait.jpg`, the resume PDF, and social preview with your own assets. The resume is independently authored: changing JSON does not update the PDF. Run `node scripts/social.mjs` after changes to generate an illustrated social card (requires Chrome). Asset and link paths are validated. All professional claims must come from your own records.

`PROFILE_CONFIG` and `SITE_CONFIG` optionally select alternative JSON files at build time. No secrets or environment variables are required. Earlier `sections` and `defaultView` fields are retained for compatibility in source data; the journey is now controlled by `journey.stops`, with no separate recruiter/engineering pages.

## How it works

- `scripts/build.mjs`: validation, build assembly, sitemap/robots output.
- `scripts/journey.mjs`: semantic scene and field-note renderers using one shared data model.
- `scripts/art.mjs`: original SVG scenery, landmarks, and engineer; no borrowed reference artwork.
- `assets/portfolio.css`: illustrated world, responsive compositions, theme tokens, character gait and native-dialog presentation.
- `assets/app.js`: native scroll tracking, short scroll-only character gait, subtle parallax, map navigation, dialogs, theme/motion controls and clipboard feedback.
- `data/schema.ts`, `data/validate-types.ts`: configuration contracts. Frontend code remains JavaScript; configuration is TypeScript checked.
- `tests/config.test.mjs`, `tests/journey.mjs`: configuration and real-browser regression tests.

Native scrolling is deliberately retained on desktop and mobile. Unlike the reference's horizontal camera, this world follows a vertical trail; no wheel interception or touch-scroll hijacking. The environment is continuous, while each destination has a distinct illustrative identity. Native dialogs trap focus, close with Escape, and return focus to the triggering landmark. All professional notes are in the generated HTML; with JavaScript off they become readable inline after the scenes.

Quick Profile is always available, including headline, experience, achievements, expertise, career details, resume and verified contact links. The site has no secure submission backend: contact uses direct email and social links, with no pretend form submission. Motion can be paused and respects the operating system preference. Offscreen scenery pauses.

## GitHub Pages

In Settings → Pages select **GitHub Actions**. Set `site.url` to your full Pages URL with repository path and trailing slash. Push to `main`. The workflow runs lint, configuration type checks, unit tests and build, then publishes only `dist/`. Relative URLs support repository subpaths. For a custom domain update the canonical URL and Pages settings. Repository-level `robots.txt` is supplied, though robots policy is only authoritative at a domain root.

## Validation and visual evidence

`npm run check` runs ESLint, TypeScript configuration checks, unit tests and production build. `npm run test:browser` checks landmarks, modal accessibility in both themes, keyboard behavior, responsive layouts, motion, map, no-JavaScript content and runtime errors. It saves desktop/mobile screenshots under ignored `artifacts/`.

See `docs/JOURNEY-COMPARISON.md` for the actual browser comparison with the inspiration, and `docs/VALIDATION.md` for current results. Historical Lighthouse results in `docs/lighthouse-summary.json` describe the previous editorial design, not this illustrated redesign. No performance score is assumed to transfer between versions.

Technology icons: Devicon MIT, with license in `assets/icons/LICENSE`. All journey artwork was created for this repository. No repository-wide licensing rights have been inferred; choose an explicit project license if you wish to grant reuse rights beyond forking/customization on GitHub.

The published illustrated redesign has its own fresh mobile audit in `docs/journey-lighthouse-summary.json`; see the validation report for measured results and limitations.
