# Incremental portfolio improvements

## Audit and decision

The approved direction preserves the existing static illustrated world rather than replacing it. The live application was inspected at desktop 1280 × 800 and mobile 390 × 844, including the landing, Quick Profile, engineering and impact dialogs. Audit screenshots are kept locally under ignored `artifacts/audit-desktop.png`, `artifacts/audit-mobile.png` and `artifacts/audit-mobile-profile.png`.

| Capability | Audit finding | Approved improvement |
| --- | --- | --- |
| Career journey | Eight illustrated destinations, scroll-driven character, map, career buildings and reduced-motion behavior already existed. | Preserve the world and native scrolling; expose roles on buildings and give records explicit chronology/category. |
| Recruiter quick view | A persistent panel already contained achievements, expertise, resume, contact and career details. Its action row fell partly below the visible mobile panel. | Move contact/resume actions forward, show the current role and make deeper career notes directly accessible. |
| Engineering impact | Metric landmarks existed, but the savings dialog contained one sentence. | Add a concise context → decision → result story with source navigation and an attribution qualification. |
| Architecture | Three real architecture records existed as text/component lists, repeated in worlds selected by array index. | Associate systems through IDs and allow visitors to select documented components. |
| Projects | Eight illustrated landmarks existed. Three repository links were configured, with no separate demo field. | Add stable relationships, optional status, separate repository/demo actions and cached public repository notes. |
| Profile assistant | Absent. | Offer an optional local source-excerpt guide, disabled by default. |
| GitHub freshness | No fetch/cache pipeline. | Refresh allowlisted public metadata during scheduled builds with last-good fallback. |
| Contact | Direct email, social and resume links existed; copy-email was limited to Quick Profile. | Add copy-email at the final destination and action-specific clipboard feedback. |

The savings figure is a verified business outcome in the existing profile. Years of experience and the number of cloud platforms are experience facts, not additional savings or productivity claims. The ARM64 move is one documented optimization initiative; the source does not quantify its individual share of annual savings.

## Visual direction

Retain the warm light palette, blue/coral accents, dark theme, original SVG landscapes, walking engineer and destination map. Refine what opens inside each landmark: more useful field notes, clearer actions, source-linked stories and compact system illustrations. Avoid adding an always-open chatbot, more ambient animation, generic dashboard panels or a new grid of identical cards.

Architecture drawings distinguish an explicitly documented delivery sequence from component groupings. SecretMesh and LitOverLap group documented responsibilities; the drawings do not claim to reproduce their production network topology.

## Approved implementation phases

1. **Recruiter and contact clarity.** Prioritize the current role, resume and direct contact in Quick Profile; show career roles before clicking; improve copy feedback and access from the final scene.
2. **Credible engineering storytelling.** Add source-backed impact notes, explicit record relationships, selectable architecture components and project links/stages supported by existing records.
3. **Optional discovery and freshness.** Add a build-time GitHub cache with dates/fallback and an optional local profile guide returning exact source excerpts.
4. **Fork resilience and validation.** Strengthen configuration contracts, omit unavailable optional links, clean only owned build output, update documentation and validate the final build in desktop/mobile browsers.

## Configuration model

Professional content remains in `data/profile.json`; visual choices and optional features remain in `data/site.json`. IDs connect career, achievement, project, product and architecture records independently of labels or array positions. The source content is preserved: enhancements add structure and explanations rather than substituting invented professional details.

Career records have an explicit `kind`, chronological `order` and optional `current` indicator. Projects use optional `productId`, `architectureIds`, `status`, `repoUrl` and `demoUrl`. Worlds use `architectureIds` to show only relevant systems. `projectArt` is keyed by stable project ID, with legacy name-key fallback. Example configuration no longer carries the live profile's metrics, professional summary, named resume or social links.

A case study uses `context`, `decision`, `result`, `sourceIds` and optional `note`. Architecture `nodeDetails` aligns with the existing component list. Existing `diagram` data remains available in static HTML. Deprecated site fields remain documented for older source configurations; current presentation uses `journey.stops`, `journey.heroLine` and `journey.palette`.

## Optional guide boundaries

`site.assistant.enabled` defaults to `false`. When enabled, “Ask about my work” searches only selected public professional records and returns their exact excerpts with source buttons. There is no model, API call, chat storage or generated career claim. Unsupported or undocumented queries receive an explicit fallback. Private contact fields and live GitHub metadata are outside this answer corpus.

The guide is a discovery shortcut, not a substitute for the full notes or direct contact. It uses a JavaScript module, so local testing of this optional feature should use HTTP hosting. See the README for the configuration and preview commands.

## Repository freshness and contact boundaries

The GitHub cache requires both an explicit owner/repository allowlist and a matching configured project/product URL. It fetches public metadata only. Builds render a dated snapshot; visitors make no GitHub requests. The default TTL is 24 hours. Daily Pages builds restore the Actions cache and retain the last valid entry on transient failures, with a checked-in initial fallback. Confirmed nonpublic or removed repositories lose cached metadata. The optional token stays in the build environment.

Only this portfolio has a newly configured live-site action because that public destination is known. Other demos are not inferred from project names. Contact continues through direct email and existing social links; no submission backend or pretend contact form has been added.

## Validation record

This document records the audit, approved scope and implementation design. It does not assert final test or deployment results. The authoritative record of executed lint, type, unit, browser, accessibility and production-build checks is `docs/VALIDATION.md`. Previous Lighthouse reports remain historical measurements of their respective versions.
