# Validation

Executed locally in headless Google Chrome, November 16, 2026:

- ESLint: passed.
- TypeScript: configuration shape checks passed. Frontend JavaScript is syntax/lint checked, not fully type checked.
- Node tests: 3 passed — preserved professional records, configuration customization, invalid paths/colors.
- Production build: passed, static output in `dist/` with only deployable assets.
- Browser regression: passed — recruiter/engineering view, architecture disclosures, saved theme, project filtering, mobile menu and Escape, deep links, reduced motion, content without JavaScript, and no runtime errors.
- Horizontal overflow: none at widths 320, 390, 768, 1024 and 1440 pixels.
- axe-core: zero violations in light and dark engineering views. Initial contrast findings were corrected and checks repeated.
- Desktop screenshots inspected; responsive behavior tested automatically.
- Assets: optimized portrait approximately 90 KB, extracted PDF approximately 130 KB. Generated HTML approximately 34 KB; no external runtime or font downloads.

Limitations: no manual screen-reader audit, real iOS/Android device tests, field Core Web Vitals, or Lighthouse score guarantees. External social/project links retain the original verified account URLs; account availability may change. Email drafting requires a configured mail app. Clipboard support depends on browser permissions. Some projects have limited source information; no additional achievements or technical results were invented. The original resume PDF may differ from current website wording and must be edited separately.

## Published-site verification

GitHub Actions deployment of commit `949cdc8` succeeded. The HTML, stylesheet, JavaScript, portrait, original PDF, social image, sitemap and robots file all returned HTTP 200 from the live Pages URL.

Mobile Lighthouse on the published site: **Performance 100, Accessibility 100, Best Practices 100, SEO 100**. FCP 1.0 s, LCP 1.6 s, total blocking time 20 ms, CLS 0. Machine-readable run metadata is in `lighthouse-summary.json`. These are results from one simulated mobile lab run, not field Core Web Vitals or guaranteed scores. Remaining opportunities include image sizing, render-blocking CSS, and Pages-controlled cache lifetimes.
