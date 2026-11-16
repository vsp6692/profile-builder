# Visual comparison: from portfolio document to illustrated journey

This comparison was completed in a real browser before implementation, using the live reference at `https://walkwithmaryam.vercel.app/` and the existing profile at `https://vsp6692.github.io/profile-builder/`. Desktop captures used 1280 × 800 CSS pixels. Mobile captures used 390 × 844 CSS pixels. The reference was inspected at the landing, approximately 2,000 and 7,000 pixels of scroll, and after activating its primary journey action on mobile.

## What the reference actually does

The reference is a horizontally traveling illustrated world, driven by vertical scrolling. The viewport remains a scene: content, scenery, and milestones move through it while a character remains near the ground. It is not merely a conventional page with animated cards.

- **Landing:** a pink/lilac sky, layered green hills, clouds, flowers, and a large clay-like illustrated hut. The character begins near the hut. Large rounded Fredoka headings, colored word highlights, and a wooden directional signpost establish a coherent playful identity.
- **Travel:** scrolling translates a very wide world. At approximately 2,000 pixels, the introductory scene presents a heading, a speech-bubble biography, and achievement labels while the walking character remains near the lower left. At approximately 7,000 pixels, career stories and the next engineering destination pass through the same continuous landscape.
- **Animation:** the character walks with travel; clouds and other environmental details provide ambient motion. Observed cloud animation durations are roughly 15–25 seconds. Ground, hills, character, and foreground details communicate a shared place and depth.
- **Navigation:** the wooden signpost belongs to the illustration rather than sitting above it as a corporate navigation bar. The primary CTA starts the journey. A scroll prompt reinforces the travel metaphor.
- **Mobile:** the headline and CTA occupy the upper part of the opening screen; the hut and character occupy the lower part. Activating the CTA advances the scene to the introductory destination with the character still near the ground. The illustrated identity remains visible even on a narrow screen.

## Why the existing profile missed the expectation

The existing site was polished as a professional document, but its interaction model was fundamentally different.

| Area             | Reference                                       | Previous profile                                                     |
| ---------------- | ----------------------------------------------- | -------------------------------------------------------------------- |
| First impression | Entering an illustrated world                   | Reading a professional landing page                                  |
| Main visual      | Hut, landscape, and character                   | Portrait with small decorative rings                                 |
| Scroll           | Traveling through connected scenery             | Moving down independent page sections                                |
| Career           | Milestones encountered along a route            | Dates and responsibilities in a vertical list                        |
| Projects         | Discoveries within a wider illustrated world    | Repeated cards in a gallery                                          |
| Navigation       | Illustrated signposts                           | Sticky menu and anchor links                                         |
| Typography       | Rounded, expressive, scene-integrated           | Restrained editorial sans serif                                      |
| Motion           | Character movement and environmental continuity | Brief entry/hover effects; no ambient animations observed mid-scroll |
| Mobile           | World and character remain central              | Long stack of text and conventional cards                            |

The missing quality was **spatial continuity and personality**, not another animation library or a different card treatment. Additional hover effects alone would not resolve it.

## New direction: Walk Through My Engineering Journey

The implementation uses original SVG illustrations rather than copying any reference artwork. The direction is an engineering travel atlas: warm paper skies, layered blue mountains, coral-roofed buildings, a winding road, and an engineer traveling between destinations. Color and illustration choices deliberately preserve the requested red/blue identity rather than importing the reference's pink/green palette.

The journey has seven destinations after the opening: About Me, Career Journey, Engineering Achievements, My Engineering World, Things I've Built, My Toolbox, and Let's Connect. Buildings, observatories, workshops, and other landmarks are interaction targets with meaningful professional details. The journey uses the existing verified profile data.

The intended tradeoff is native vertical scrolling and accessible, responsive destinations rather than duplicating the reference's exact horizontal camera system. An unobtrusive Quick Profile makes the journey optional for recruiters. Resume, contact, and LinkedIn remain immediately reachable. Reduced motion and a pause control preserve the complete content without requiring animation.

## Evidence and validation boundaries

Desktop and mobile screenshots of the reference and previous profile were saved by the browser tooling before implementation. Local capture evidence (browser artifacts are machine-specific and are not distributed with the template):

- Reference desktop landing: `browser-screenshot-walkwithmaryam-vercel-app-mwirbfxk-677b60cc.png`
- Reference desktop travel: `browser-screenshot-walkwithmaryam-vercel-app-mwirbueg-344f9e11.png`
- Reference mobile landing: `browser-screenshot-walkwithmaryam-vercel-app-mwircs3x-5c06d8b2.png`
- Reference mobile after CTA: `browser-screenshot-walkwithmaryam-vercel-app-mwird3ho-3e8f32d0.png`
- Previous profile desktop landing: `browser-screenshot-vsp6692-github-io-mwirburh-9228c17d.png`
- Previous profile mobile landing: `browser-screenshot-vsp6692-github-io-mwircs8n-7a1268ca.png`

These files were saved under the local T3 `browser-artifacts/` directory. New implementation screenshots are generated by `node tests/journey.mjs` into `artifacts/`.

Automated checks cover desktop/mobile layouts, keyboard-accessible landmark dialogs, focus restoration, theme switching, reduced motion, Quick Profile, and axe accessibility results. Screenshots require human visual inspection; passing automated tests is not a claim of visual parity with the reference or a substitute for a manual screen-reader audit. The original artwork is a different visual style, not a reproduction of the reference's illustrations.
