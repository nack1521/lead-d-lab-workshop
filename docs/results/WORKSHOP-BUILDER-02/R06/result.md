# WORKSHOP-BUILDER-02 / R06 — Inline alignment and room-header parity (narrow)

- **Task/run:** WORKSHOP-BUILDER-02 / R06 (`main`, HEAD `87de855`, not pushed/deployed)
- **Producer:** DeepSeek Harness (sole coding writer); **Reported:** 2026-11-12T22:11:11+07:00
- **Status:** **SOURCE FIX APPLIED / READY_FOR_REVIEW — VISUAL ALIGNMENT NOT RUN (no browser automation).** Home accepted appearance is frozen; no visual PASS claimed.
- R05 English errors, latest-three/full-all text, shared shell, lifecycle guards, DB/realtime preserved.

## Narrow source fixes
1. **Breadcrumb centerline:** kept left-aligned row; `.breadcrumb` children (`.link`, separator, current room name) are `inline-flex; align-items:center; line-height:1; margin:0; padding-block:0; min-height:24px` so text line boxes and slash share the row centerline. No `justify-content:center` added; page is not horizontally centered.
2. **Results row:** `Results:` and Q01/Q02/Q03 buttons are inline-flex centered with `line-height:1`, `min-height:32px`, zero vertical margins/padding-block — aligned on the same centerline without relying only on the pre-existing flex `align-items:center`.
3. **Add question row:** `Add question` label and Score/Multiple choice/Text response buttons are inline-flex centered with `line-height:1`; label `min-height:44px` on desktop matching control height; 3-in-one-row on desktop and all-stacked narrow behavior preserved (never 2+1; mobile label may sit on its own row).
4. **Room header parity:** removed the extra top-bar `Rooms` **button** (`Shell onHome` path) from room management, eliminating button-driven header height inflation; breadcrumb Rooms link and sidebar `‹ Rooms` back path remain. Room Questions/Dashboard/HR use the same unchanged Shell markup as Home (logo/brand/padding/centerline), so no compensating offsets or Home edits were made.
5. **Home frozen:** no changes to Home composition, gutters, room list or topbar rules; R06 CSS only targets breadcrumb/report-nav/question-types children and removes the topbar action button.

## Verification (actual)
- `bun test tests/builder-r06.test.tsx` → **5 pass / 0 fail** (no top-header Rooms button; breadcrumb alignment rules/left alignment; Results label/button alignment; Add-question/control alignment; unchanged Home Shell).
- Full suite `bun test tests` → **171 pass / 0 skip / 0 fail** (171 tests, 22 files; 912 expects). R05 English-error mounted tests and full-all responses still pass; no new skips.
- `bun x tsc --noEmit` 0; `bun run build:web` 0; `bun run build:web:lan` 0.

## NOT RUN — visual alignment acceptance remains open
- **No actual browser screenshots or computed geometry.** Safari 27's `safaridriver` is present but a WebDriver session could not be established (Safari Remote Automation is not enabled; enabling it would be a system/trust change not authorized), and no Chrome/Chromium/Playwright is available without new dependencies. Therefore 1440/1280/390 screenshots, header rectangle/logo centerline tolerance measurement, ended vs draft/open visual checks, mobile overflow and optical line-box assessment are **NOT RUN**. SSR/CSS assertions alone are not visual PASS.
- Authenticated browser click-flow, mobile/phone, keyboard/reduced-motion, Mode B/Docker, cloud/LAN and independent QA remain NOT RUN. No push/deploy/data reset; protected dirty/untracked files untouched.

## Changed paths
`apps/web/src/builder.tsx` (remove topbar onHome Rooms button wiring), `apps/web/src/styles.css` (R06 alignment/header action rules), `tests/builder-r06.test.tsx` (new), `tests/builder-r04.test.tsx` (updated shared-shell assertion), `docs/results/WORKSHOP-BUILDER-02/R06/**`, `docs/results/INDEX.md`.

## Next gate
User-assisted screenshots/computed geometry at 1440/1280/390 for Home vs room header, breadcrumb, Results and Add-question rows (ended + draft/open), then independent QA. Home remains frozen; no deployment.
