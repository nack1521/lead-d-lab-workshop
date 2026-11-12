# WORKSHOP-BUILDER-02 R06 — Inline alignment and room-header parity

Latest user visual feedback after R05. Home/Rooms page USER_CONFIRMED visually acceptable; freeze its composition, gutters, room list and header appearance. This is not whole-product acceptance. DeepSeek user-operated sole coding writer; coordinator only documents/verifies. Local only; no push/deploy.

## Requested corrections (narrow scope)
- Ended room: breadcrumb `Rooms / R03 evidence room v2` must share a common visual horizontal centerline: text and slash vertically centered in their ROW. Preserve left alignment of the row; do NOT center the entire breadcrumb in the viewport.
- Ended Dashboard: `Results:` and Q01/Q02/Q03 buttons share the same row centerline.
- Non-ended room: same breadcrumb alignment; `Add question` and Score / Multiple choice / Text response controls share row centerline on desktop. Preserve 3-in-one-row or all-stacked responsive behavior, never 2+1. On narrow screens label may be a deliberate separate row; align stacked controls consistently.
- On entering room management remove the extra top-header `Rooms` BUTTON (currently Shell onHome conditional). Keep breadcrumb Rooms link and sidebar back-to-Rooms path usable. Do not remove every Rooms navigation path or the approved home heading.
- Room-management header must match accepted home header height, logo scale, brand typography, vertical padding/centerline at the same viewport. Keep right note if useful and unchanged branding. Remove button-driven height inflation, not compensate with negative offsets. Apply parity to Questions and Dashboard, ended and non-ended, and shared HR shell as applicable. Home remains unchanged.

## Observed screenshot/source evidence
- User home screenshot 21:57:57 approved; room screenshot 21:59:27 shows taller header with extra Rooms button; breadcrumb link sits lower than separator/current name and Results text higher than button labels. Missing non-ended screenshot is not a blocker: user explicitly identifies same issue there, verify actual branch.
- apps/web/src/builder.tsx Shell lines56–68: onHome adds ghost Rooms button in .topbar-actions.
- styles.css breadcrumb around543–545 already display:flex/align-items:center; question-types around486 and551 already align-items:center. Do NOT blindly add align-items:center and claim done. Inspect inherited button min-height, padding, line-height, font alignment, p/span default margins, content-box vs text-center and overrides. Global cascade and element margins can defeat visual alignment despite correct flex alignment.
- topbar styles around323/538/540 and media454/571: inspect computed styles, not just first rule.

## Acceptance and evidence
1. Actual same-viewport home vs room header rectangle and brand/logo centerline parity (proposed tolerance <=1 CSS px). Home source/composition preserved; shared change must not regress it.
2. Breadcrumb segments/slash, Results text/buttons and Add question text/control boxes have common row centerline after resetting inappropriate margins/padding/line-height. Inspect text line boxes as well as element bounds; use real screenshots to assess optical alignment. Do not horizontally center the whole page.
3. Desktop 1440 or user's equivalent viewport plus1280; mobile390 no overflow and sensible intentional stacking. Both ended and draft/open rooms; Questions/Dashboard routes and back navigation. No lifecycle mutation needed for reading existing rooms; don't end/reopen reviewer rooms.
4. Run regression suite/typecheck/build, maintain English UI + code error mapping, latest-three/all responses, readonly HR, real DB/WS and end guards. Avoid unrelated redesign/duplicate ended-message cleanup or new features in this pass.
5. SSR assertions alone cannot verify this issue. Actual screenshots/computed geometry required for alignment PASS; if unable state NOT RUN, no invented measurements. Report source fix separately from visual evidence.
6. Inspect git dirty work, preserve coordinator handoffs/reports/protected logs/unrelated evidence. Immutable docs/results/WORKSHOP-BUILDER-02/R06/result.md and result.json, update INDEX last. Meaningful owned commit only; no push/deploy.
