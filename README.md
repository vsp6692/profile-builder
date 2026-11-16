# Engineering profile

A configuration-driven, static portfolio with recruiter and engineering perspectives, light/dark themes, career disclosures, contextual achievements, filterable projects, interactive architecture, tool details, and accessible motion controls.

Live: https://vsp6692.github.io/profile-builder/

## Run and build

Requires Node.js 22+ and npm. No API keys, backend, or runtime dependencies.

```sh
npm ci
npm run check
npm run build
```

Open `index.html` directly for a local review. Deploy `dist/`. The checked-in `index.html` is generated: edit configuration and source files, then rebuild. Native links, all career content, and disclosure controls work without JavaScript. JavaScript adds perspective selection, filtering, copying, animation and email draft preparation.

## Customize your fork

1. Edit `data/profile.json`: name, contact, about, education, career records and technologies, achievements, project summaries, product detail, architecture nodes, skill categories and tool descriptions, and original briefs. `data/profile.example.json` is an intentionally minimal starting point, not production data.
2. Edit `data/site.json`: public URL (including repository path and trailing slash), display name, headline, positioning, portrait, resume, social image, theme colors, default perspective, motion preference, and visible section IDs.
3. Replace the portrait, PDF, and social card with your own files under `assets/`. Update their configuration paths. The PDF is a separate source: website edits do not update it.
4. Set `profile.achievements` to verified results only. Numeric cards accept `number`, `prefix`, `suffix`, `value`, `label`, `text`, and a section `anchor`. Use `journey[].technologies` for career tags. Projects match detailed product or architecture records by name.
5. Run the checks and rebuild. Review both themes and perspectives before pushing.

Available section IDs: `about`, `impact`, `experience`, `projects`, `architecture`, `skills`, `briefs`, `contact`. Technical sections are initially collapsed from the recruiter presentation, but rendered in the same HTML. Direct links to technical sections automatically reveal Engineering view. No duplicate biographies are maintained.

Optional build environment variables: `PROFILE_CONFIG` and `SITE_CONFIG` select alternative JSON files. There are no secret environment variables. `data/schema.ts` documents theme/view options; `data/validate-types.ts` checks the production data shape, and the renderer validates URLs, modes, asset paths, and colors at runtime.

## Source architecture

- `scripts/build.mjs`: reusable HTML renderers, static metadata, sitemap, robots file and deployment asset assembly.
- `assets/portfolio.css`: responsive layouts and semantic design tokens. Core tokens include `--bg`, `--surface`, `--wash`, `--text`, `--muted`, `--line`, `--blue`, and `--red`.
- `assets/app.js`: progressive enhancement; no framework or animation dependency.
- `data/`: shared content and site settings.
- `tests/`: configuration and browser regression checks.
- `docs/AUDIT.md`: source audit, design rationale and content boundaries.

Application code remains JavaScript to preserve the original lightweight stack. TypeScript checks the configuration contract; this is not a fully typed frontend application.

## GitHub Pages

In Settings → Pages, select **GitHub Actions**. Set `site.url` to your own Pages URL. Push to `main`. The workflow installs locked dependencies, runs lint/type/configuration checks, generates `dist/`, and uploads only that directory to Pages. Relative asset URLs work for both repository paths and custom domains. For a custom domain, configure it in Pages settings and update the canonical URL. `robots.txt` is effective as a robots policy only at a domain root; repository-path sites still publish a sitemap URL.

## Verification

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run test:browser
```

Browser tests require installed Google Chrome (`channel: 'chrome'`). They run headlessly against local static files and cover both themes with axe, perspective switching, disclosures, filters, theme persistence, 320–1440 px layouts, mobile menu keyboard handling, reduced motion, deep links, no-JavaScript content and runtime errors. Browser tests are local; the deployment workflow runs lint, type checks, unit tests and build.

System fonts avoid external font requests. The optimized portrait is ~90 KB; PDF and icons are separate assets. No analytics, tracking, cookies or external scripts. Theme choice uses local storage. The contact form opens the visitor's email application and does not submit data to a server. Clipboard features need a secure context and show fallback instructions if unavailable.

Lighthouse 95+ is a target, not a guarantee. Automated axe checks do not replace human screen-reader testing. See `docs/VALIDATION.md` for executed checks and limitations.

Technology icons retain the Devicon MIT attribution: https://github.com/devicons/devicon/blob/master/LICENSE. Replace personal content before reusing; no repository-wide license has been inferred or added.
