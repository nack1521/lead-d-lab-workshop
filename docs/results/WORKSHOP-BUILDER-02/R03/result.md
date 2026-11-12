# WORKSHOP-BUILDER-02 / R03 — Create dialog, type spacing, per-question reports, latest-three text

- **Task/run:** WORKSHOP-BUILDER-02 / R03 (`main`, HEAD `c8c8eb7`, not pushed/deployed)
- **Producer:** DeepSeek Harness (sole coding writer); **Reported:** 2026-11-12T20:28:49+07:00
- **Trigger:** R03-FIX user correction; supersedes R01/R02 latest-five and active-only report assumptions. Approved Unslop R02 composition and shared API-base fix preserved (R01/R02 reports unchanged).

## Required changes — disposition
1. **Create flow — FIXED:** room list has one  button and no pre-entry title field. It opens a modal dialog (room title, cancel, ); only confirm sends one POST, the confirm button is disabled while pending (duplicate-submit guard), cancel posts nothing, and a successful create enters the new room's Questions workspace. Backend title validation retained. UI seam tests cover dialog presence/actions; API create persists one room.
2. **Spacing — IMPLEMENTED (source/CSS), visual measurement NOT RUN:** 4px rhythm variables; desktop main padding 32px, column gaps 24px, editor padding 24px, label→field 8px; mobile main/editor 16px. Create/room rows render as compact rectangular list rows (16–24px inner padding, no pill radius), single-line  (nowrap + full-width on mobile), aligned title/metadata/status, sidebar title wraps with line clamp/overflow-wrap instead of clipping, controls ≥44px. Browser-measured screenshots at 1440/1280/390px are **NOT RUN** (no browser automation in this environment).
3. **Question types — FIXED:** three equal-width controls  /  /  live in one distinct group separated from the rail/editor. CSS uses a 3-column grid; below 760px it stacks **all three vertically**; never 2+1. Focus/active states kept via existing button focus and hover/active styling. UI seam test asserts exactly three controls in one group.
4. **Reporting per question — FIXED:** Dashboard renders a report card with a real score/choice chart for **every question**, independent of receiving/phase; a compact  navigator scrolls to cards, while lifecycle actions are separately labelled /. Closed, draft and ended rooms all render persisted report data; ended rooms show a neutral status and no lifecycle controls. Empty results show a labelled zero plot (, base) and never a fabricated mean/answer.
5. **Text latest THREE + distinct pagination — FIXED:** report returns exactly the latest **3** answers (newest-first, stable timestamp/id). If more exist,  opens a separate dialog listing only older answers via a real cursor/has_more feed — first three are not duplicated. API/DB test covers 7 answers: latest 3, older feed 2+2 with no duplicate/omission; live run with 4 answers shows latest 3 + one additional. HR uses the same report contract.
6. **End-state UX — ADDRESSED:** fresh draft/open rooms publish/open successfully (evidence: publish 200, open 200 — no ROOM_ENDED). Server guard still rejects opening an actually ended room (409) and is **not bypassed**. The UI now hides all mutation controls when the authoritative workspace room is ended, shows neutral ended copy, and requires an explicit  confirmation dialog for the irreversible End action. Viewing reports never mutates lifecycle (revision unchanged 14→14 in the live check).

## Verification (actual)
- `bun test tests/builder-views-r03.test.tsx` — **7 pass / 0 fail**: create dialog (one confirm/cancel, no inline field), exactly three type controls in one group, ended score chart with no Open control, latest-three text + additional action, additional dialog excludes latest three, labelled empty chart, End confirmation.
- `bun test tests/builder.test.ts` — **9 pass / 0 fail** (auth, rooms, lifecycle, idempotency, locks, WS snapshot, choice/text, latest 3 + older cursor feed without duplicates, HR read-only).
- `bun test tests` — **157 pass / 1 skip / 0 fail** (158 tests, 20 files; skip is the previously retired legacy facilitator-UI test — skip is not a pass).
- `bun x tsc --noEmit` 0; `bun run build:web` 0; `bun run build:web:lan` 0.
- Live API/DB evidence (`evidence/report-after-end.json`): fresh room publish/open 200; 4 text answers accepted; report latest 3 (newest first) + older feed returns only answer 1 (no overlap); report reads revision unchanged; close text 200; end→ended; ended report still returns score n=1/mean=5, choice n=1, text n=4 with latest 3; ended  attempt 409 (guard intact); HR report 200 / mutation 403.

## NOT RUN / honest limits
- **No browser screenshots and no real browser/desktop/phone visual run** (no browser automation in this environment). Spacing/mobile/keyboard/reduced-motion and the Create/Open browser flows were not visually measured; source/CSS + UI seam tests only. No claim of visual PASS.
- Browser-driven create→answer→live→close→end→HR roundtrip, phone viewport and text/pagination UI interactions remain user-assisted/QA work.
- Full-suite Docker/Mode B, cloud/LAN deployed regression, independent QA and public publication are NOT RUN. No push/deploy.
- Protected dirty files/untracked Coordinator+design artifacts preserved; no secrets committed.

## Changed paths
`apps/web/src/builder.tsx`, `apps/web/src/styles.css`, `apps/api/src/builder-routes.ts` (latest-three report + older-page text feed), `tests/builder.test.ts`, `tests/builder-views-r03.test.tsx` (new), `docs/results/WORKSHOP-BUILDER-02/R03/**`, `docs/results/INDEX.md`.

## Next gate
User-assisted browser review at desktop/phone widths against R03 corrections, then closed/open/ended report and text-UI roundtrip; independent QA. Unslop R02 visual direction unchanged.
