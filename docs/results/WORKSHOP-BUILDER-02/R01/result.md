# WORKSHOP-BUILDER-02 / R01 — Admin authoring, live charts, text pagination, HR read-only

- **Task/run:** WORKSHOP-BUILDER-02 / R01 (`main`, HEAD `537d700`, not pushed)
- **Producer:** DeepSeek Harness (sole coding writer); **Reported:** 2026-11-12T17:35:45+07:00
- **Approved direction:** Unslop R02 board (APPROVED); R01 rejected and not reused.
- **Status:** **LOCAL_IMPLEMENTATION / READY_FOR_REVIEW with declared gaps.** Browser screenshots, real-device visual/mobile checks and independent QA are **NOT RUN**.

## Implemented
- **Admin demo entry (no token form):** literal passphrase `admin` issues an opaque short-lived server capability; scope `admin` or `hr` (HR read-only enforced server-side). No signup; documented as intentionally weak demo auth.
- **Rooms CRUD in PostgreSQL:** persistent room list, Create room, draft questions with score (default 1–5), single-choice (2–10), and standalone text; edit wording/help, reorder (two-phase respecting unique seq), delete while unanswered; publish/open room, open/close question, end room. Additive migration `0004_wsp_builder.sql`; no resets.
- **Answering:** participant joins by code + optional nickname, one active question, existing idempotency/receipt/reconnect retained; score/poll/standalone text answers persist in PostgreSQL; retries/dedup do not duplicate; one response per participant/question.
- **Live dashboard:** internal room-scoped facilitator grant fetched by the admin workspace (never shown/URL) feeds the existing WS; one primary active-question chart (score mean/distribution with n/base; choice ranked horizontal bars counts/shares/explicit denominator; text latest five), neutral last-updated timestamp and reconnect note (no red stale copy, no false Live label).
- **Text listing:** latest five in report, View all with stable `created_at,id` cursor pagination (limit/cursor/has_more/next_cursor), verified >5 rows without duplicates (cursor precision fixed).
- **Editing constraints:** once answers exist, type/range/options/deletion/reorder are locked (409 QUESTION_LOCKED); non-destructive wording/help edits remain.
- **HR:** same room-list/workspace pattern, read-only (server 403 for mutations), graph-first report on the same persisted data; no narrative insights.
- **UI:** approved structural direction implemented in new `builder.tsx`/CSS — compact room rows, numbered rail, wide editor with adjacent participant preview, single active chart, neutral chrome, sparse teal, original logo asset copied into `apps/web/src/assets/logo.png` (single wordmark), responsive grid at 980/640px, 44px controls, visible focus, reduced-motion media query. Old manual facilitator-token page and stale warning UI are no longer routed.
- **Separate HR path preserved:** existing `/api/hr/summary` remains for compatibility; new HR demo uses read-only admin scope.

## Evidence (actual)
- `tests/builder.test.ts` — **9 pass / 0 fail**: admin/HR login scopes, persistent room + 3 question types, invalid input, reorder, participant join/answer/replay/conflict, WS facilitator snapshot vs DB, answer-after-close (new participant 409), editing locks, choice/text counts, latest five + cursor page without duplicates, HR mutation 403, end persistence/mutation block.
- Fresh real API/DB flow (`evidence/builder-live-flow.json`): draft room → published open → participant joined rating → accepted rating 4 → report n=1 mean=4 → fresh admin login sees persisted room/report → HR read 200 / write 403 → ended.
- Full native suite: **145 pass, 1 fail? no — 145 pass, 1 skip, 0 fail** (146 tests, 18 files). Mode B/builds not rerun for this slice; typecheck 0; default/LAN web builds 0.
- Migration `0004_wsp_builder.sql` applied additively to the local PostgreSQL.
- Producer skill use: Unslop skill/approval/direction read and structural rules applied; TDD used for the builder API; no third-party snapshot helpers executed. Attribution retained: Unslop by Damir Sokolovsky, CC BY 4.0.

## Declared gaps / NOT RUN
- **No browser screenshots and no real browser run** in this environment (no browser automation; this model has no image input, so the approved PNG board could not be visually inspected). Visual fidelity against the board, mobile touch behavior, keyboard traversal and reduced-motion were implemented by CSS/contract but are **not independently exercised or screenshot-verified**.
- The builder/HR frontend has **no dedicated automated UI test**; the legacy facilitator-UI test was intentionally retired and is counted as **1 skip, not a pass**. Participant text UI support is coded but only API-tested.
- Choice/text/HR UI and pagination "View all" were API/DB-verified; their browser behavior is NOT RUN.
- No full Docker/Mode B regression, cloud/Pages/Railway deployment, push, or 30-device/load claim. Independent QA and human acceptance remain required.
- Existing protected dirty files and untracked Coordinator evidence were preserved; no unrelated staging; grants/passwords/DB URLs are not committed.

## Commands / exits
`bun run migrate` 0 (0004 applied); `bun test tests/builder.test.ts` 0 (9/9); `bun test tests` 0 (145 pass/1 skip/0 fail); `bun x tsc --noEmit` 0; `bun run build:web` 0; `bun run build:web:lan` 0; live curl flow completed with the counts above.

## Changed paths
`db/migrations/0004_wsp_builder.sql`, `apps/api/src/builder-routes.ts`, `apps/api/src/app.ts`, `apps/api/src/snapshot.ts`, `apps/web/src/builder.tsx`, `apps/web/src/{api.ts,ui.tsx,containers.tsx,state.ts,styles.css}`, `apps/web/src/assets/logo.png`, `tests/builder.test.ts`, `tests/findings-client.test.tsx` (one legacy facilitator-UI test retired), docs results.

## Next gate
Human visual/browser review on desktop and phone widths against the approved board; independent QA of auth boundaries, lifecycle and text privacy; then remaining deployment verification. No deployment/push in this run.
