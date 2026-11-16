# Incremental portfolio improvements — validation

Validated on 16 November 2026. The existing illustrated world and static build were preserved.

## Executed checks for this update

- `npm run check`: ESLint, TypeScript configuration checks, all **21 unit tests**, and production build passed.
- `npm run test:browser`: all three suites passed in actual Google Chrome: journey regressions, new discovery interactions, and an HTTP-served fixture with the optional guide enabled.
- Quick Profile resume/contact actions and key metrics fit before scrolling at **390 × 844** and **320 × 700**. Current role is visible immediately.
- Nested Quick Profile → savings story → career notes support Escape and restore focus to each originating control. The guide can return to an already-open Quick Profile.
- Three architecture explorers support component selection, arrow/Home/End keys, source-linked context, and mobile layout. Architecture associations stay correct after record names/order change.
- axe found **zero violations** in tested journey/profile, all three architecture dialogs in light/dark themes, and the enabled guide at desktop/mobile widths in both themes.
- Copy-email and engineering-brief actions passed success and rejected-clipboard paths. An actual browser download matched the configured resume filename and PDF signature.
- Project repository/demo links match configuration; cached repository notes contain source/freshness timestamps. Four public repositories were checked against GitHub's API. Only the already published portfolio has a verified demo URL; other demos were not invented.
- GitHub unit tests cover allowlist restrictions, TTL, malformed data, network/rate-limit fallback, private/removed repositories, absent caches and HTML escaping.
- Guide tests verify exact profile excerpts, source navigation, common recruiter questions, and explicit fallback for unsupported/private requests. No external requests were made by the enabled-guide browser fixture. The guide is **disabled in production configuration**.
- Five responsive widths (320–1440 px), actual walking animation, pause/reduced-motion behavior, theme persistence, no-script content, unclipped interactive elements, and no runtime errors passed.
- A paired example configuration built without production identity, personal portrait/social assets, or a resume link. Output-cleaning tests confirmed stale assets are removed while unrelated directories are rejected.

## Visual review

Inspected the implementation in the shared browser at mobile and desktop sizes. The warm paper/blue/coral world is retained. Recruiter actions now precede longer notes; career landmarks show roles; impact opens a context/decision/result trail; project/world landmarks open relevant component maps. No additional floating dashboard or always-on chat panel was added.

Local screenshots are ignored build artifacts: `artifacts/discovery-{desktop,mobile}-{profile,architecture}.png`, `artifacts/guide-{desktop,mobile}-{light,dark}.png`, and `artifacts/journey-*.png`.

## Fresh performance measurement

One simulated-mobile Lighthouse 12.8.2 run against the local production build returned **Performance 98, Accessibility 100, Best Practices 100, SEO 100**. LCP **2.18 s**, total blocking time **0 ms**, CLS **0**. See `incremental-lighthouse-summary.json`. This local lab result is not a field Core Web Vitals measurement or a guarantee across devices. The local server has no production cache headers; remaining diagnostics include SVG DOM size and render-blocking CSS.

## Limits

No physical iOS/Android or manual screen-reader audit. Contact remains direct email/social links because no secure submission backend exists. GitHub metadata is a dated build-time snapshot with daily refresh scheduled and last-good fallback, not a live claim about professional accomplishments. The optional guide searches published records; it does not generate answers. Existing metrics remain source-backed; the ARM64 migration's contribution to the total savings is not separately quantified.

---

# Previous illustrated redesign validation

This report applies to the illustrated journey redesign. The prior editorial portfolio's Lighthouse results do not carry over.

## Executed checks

- `npm run lint`: passed.
- `npm run typecheck`: configuration contracts passed; JavaScript frontend remains lint/syntax checked.
- `npm test`: configuration, professional record preservation, changed identity/sections/theme, customizable character/scene artwork, and unsafe configuration rejection passed.
- `npm run build`: passed; deployable static output in `dist/`.
- `npm run test:browser`: passed in actual headless Google Chrome.
- Eight scene destinations, Quick Profile, career/project/world/tool landmark dialogs, Escape, focus containment/restoration, map navigation, saved theme and no runtime errors.
- Actual character movement and walking-limb animation while scrolling, then stopping; reduced-motion and pause behavior.
- axe: zero violations in light/dark journey and open Quick Profile. An initial theme-button accessible-name mismatch was fixed and retested.
- No horizontal overflow at 320, 390, 768, 1024 and 1440 CSS pixels.
- No-script professional content and resume/contact links remain available.
- Desktop/mobile screenshots captured in fresh browser contexts. Inspected landing, career town and project village. Mobile landing was revised to show the cabin and full character rather than cropped scenery below the fold.

## Visual comparison

Both live sites were inspected in a real browser before coding. See `JOURNEY-COMPARISON.md` for the observed differences and screenshot inventory. The redesign is an original vector travel atlas with warm paper, blue mountains and coral landmarks. It uses a native vertical trail rather than reproducing the reference's horizontal camera or clay-style artwork.

Current screenshots: `artifacts/journey-desktop.png`, `journey-mobile.png`, and desktop/mobile career/project captures. These are local ignored test artifacts, not website dependencies.

## Limits

No manual screen-reader audit or physical iOS/Android testing. Automated accessibility testing cannot establish complete accessibility. No field Core Web Vitals are available. Illustration art is SVG authored in the repository, not copied or AI-generated raster artwork. There is no secure form submission backend, so contact links open email or verified social profiles; no form pretends to send messages. Original professional information and the resume PDF remain independently sourced; no new employers, metrics, or availability claims were invented.

## Published illustrated journey

Deployment of `eeeeb4f` succeeded on GitHub Pages. A live Chrome check confirmed eight scenes, Quick Profile, the journey CTA, the walking companion, and no runtime errors.

Fresh mobile Lighthouse: **Performance 100, Accessibility 100, Best Practices 100, SEO 100**. LCP 1.0 s, total blocking time 0 ms, CLS 0. See `journey-lighthouse-summary.json` for the run metadata. This is one simulated mobile lab run, not a guarantee for all devices or networks. Remaining audit opportunities include cache lifetimes, render-blocking CSS, and a small forced layout measurement during scroll initialization.

An alternate production build with a different identity, omitted journey stops and replacement artwork also passed. Default personal portrait assets are not copied when a fork configures different files.
