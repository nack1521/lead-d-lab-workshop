# WORKSHOP-BUILDER-02 / R08 — Self-paced rooms, iPhone participant CSS and measured mutation RPC reduction

- **Task/run:** WORKSHOP-BUILDER-02 / R08 (`main`, HEAD `09da87a`, not pushed/deployed)
- **Producer:** DeepSeek Harness (sole coding writer); **Reported:** 2026-11-12T23:14:22+07:00
- **Status:** **IMPLEMENTED / TESTS PASS — MOBILE & BROWSER VISUAL NOT RUN.** No iPhone/browser visual PASS claimed; physical Safari remains user verification.
- Preserves facilitator home/header/dashboard, R07 CORS, English errors, latest-three/full-all text and guards.

## A. iPhone participant UI (source fix; visual NOT RUN)
- Isolated radios/checkboxes from text-like inputs: radio has fixed **20×20px** non-shrinking box, zero padding/margin; text inputs/textareas are full-width, 16px font, 48px+ controls to avoid iOS zoom.
- Score scale is a responsive grid (1–5 and 1–10 wrap deliberately; labels are full tappable 48px+ cells with wrapping text, no confidence wording on arbitrary scales); choice rows are full-width with fixed radio region + flexible wrapping text; text responses use a full-width 16px textarea; comments on score/choice use the same safe field.
- Safe-area bottom padding, visible submit/min-48px actions, count footer now English characters (was Thai unit). Selected/focus/disabled/native radio semantics preserved.
- **Not verified visually**: no browser automation/iPhone tooling available. 320/375/390/430 screenshots and computed native rendering are **NOT RUN**; physical Safari remains USER_VERIFICATION. Desktop-emulation is not claimed as iPhone PASS.

## B. Room-level self-paced answering (implemented end-to-end)
- Additive migration `0005_self_paced.sql`: `sessions.answer_mode` default **`facilitator`** for all existing rooms (explicit legacy compatibility), builder-created rooms use **`self_paced`**. No historical rows/answers/ended rooms reinterpreted or reset.
- Publish = room-level Open for all authored questions (empty room refused `ROOM_EMPTY`); per-question open/close is rejected for self-paced rooms (`ROOM_LEVEL_OPEN_ONLY`) and no longer exposed in the normal builder UI. Room structure (add/delete/reorder/type/range/options) locks while open; wording/help edits remain.
- Participant view resolves **their own first unanswered question by stable seq** from persisted responses, independent of `active_question_id`/`receiving`; progress/answered/total/completed returned by `/api/me` and WS. Submission enforces the expected next question server-side (`OUT_OF_SEQUENCE`), ignores per-question flags in self-paced mode, keeps receipt replay before sequence checks, preserves idempotency, role/session/end guards. Accepted save returns `participant_state` (authoritative next question/progress) so React advances immediately without another round trip; never advances on unknown/failure. Concurrent tabs/replays cannot double-save or skip; completion shows after final accepted answer.
- Facilitator/HR reports keep per-question graphs/text; ending is room-wide and read-only.

## C. Mutation latency (measured, local synthetic)
- Removed the serial post-mutation `workspace` reload (which also issued a new realtime grant + snapshot) and the WS-driven report fetch; initial workspace+report now load in parallel; mutations use returned entities and fetch report only on Dashboard. Added immediate `Saving…` pending state and a busy guard against double-click duplicates.
- Warm 5-sample curl RPC sequence on a fresh owned synthetic room (`evidence/latency-rpc-sequence.json`): Add question old **3 requests 16.1–24.3 ms** → new **1 request 2.7–3.6 ms**; Save changes old **3 requests 14.1–16.3 ms** → new **1 request 3.1–3.8 ms**; first mutation/save sampled separately. Samples exclude browser paint/OPTIONS/WS frames; no percentile or platform claim. **UI click→paint timing is NOT RUN** (no browser automation); pending state is frontend-implemented but not browser-measured.

## Verification (actual)
- `bun test tests/self-paced.test.ts` → **6 pass / 0 fail**: two participants on different questions; invalid/out-of-seq don't count; lost-ack retry replays once then advances; all three types complete; room end blocks; legacy facilitator room unchanged.
- `tests/findings-client.test.tsx` → **12 pass / 0 fail**, including mounted React transition Q1→Q2→“All questions completed”.
- Full suite `bun test tests` → **184 pass / 0 skip / 0 fail** (184 tests, 24 files; 1004 expects). Builder suite revised for self-paced room-level flow; obsolete per-question open assertions replaced (RED observed in earlier run before implementation).
- `bun x tsc --noEmit` 0; default web build 0; **cloud-configured build 0**; `DOCKER_BUILDKIT=0 docker build -f Dockerfile.api` 0 (tagged).
- No DB reset; no reviewer content mutated; evidence uses fresh synthetic rooms.

## NOT RUN / limits
- Actual iPhone/Safari screenshots, computed native radio/label geometry, keyboard/safe-area behavior, 320/375/390/430 visual checks and browser click→paint timing are **NOT RUN**. Physical iPhone user verification remains separate.
- Cloud deployment/browser end-to-end and independent QA remain NOT RUN. No push/deploy; unrelated dirty/untracked work preserved.

## Changed paths
`db/migrations/0005_self_paced.sql`, `apps/api/src/{app.ts,snapshot.ts,builder-routes.ts}`, `apps/web/src/{builder.tsx,containers.tsx,ui.tsx,state.ts,styles.css,api-messages.ts,api.ts}`, `tests/{builder.test.ts,self-paced.test.ts,findings-client.test.tsx}`, `docs/results/WORKSHOP-BUILDER-02/R08/**`, `docs/results/INDEX.md`.

## Next gate
User-assisted iPhone screenshots/keyboard/safe-area review and desktop browser verification of room-level Open + self-paced progress, then independent QA. No deployment/push.
