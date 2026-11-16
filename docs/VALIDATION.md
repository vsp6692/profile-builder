# Illustrated journey validation

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
