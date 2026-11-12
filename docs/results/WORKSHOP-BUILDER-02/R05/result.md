# WORKSHOP-BUILDER-02 / R05 — English API error propagation and skip reconciliation

- **Task/run:** WORKSHOP-BUILDER-02 / R05 (`main`, HEAD `b12b993`, not pushed/deployed)
- **Producer:** DeepSeek Harness (sole coding writer); **Reported:** 2026-11-12T21:48:32+07:00
- **Trigger:** Coordinator R04 retest — WB2-R04-EN-01: actual browser `/join` with an unknown code showed Thai `ไม่พบห้องนี้`; newly skipped HR/legacy tests needed reconciliation.
- **Status:** **FIXED_LOCAL / READY_FOR_REVIEW.** Actual authenticated browser screenshots/geometry and engine click-flow remain **NOT RUN**; no visual PASS claimed.

## Fix — English API error propagation
- New shared `apps/web/src/api-messages.ts`: protocol **codes** map to English copy (SESSION_NOT_FOUND → “Room not found. Check the room code and try again.”, ROOM_NOT_FOUND, ROOM_NOT_OPEN, SESSION_ENDED, INVALID_RATING/OPTION, TYPE_MISMATCH, PAYLOAD_TOO_LARGE, CONFLICT/IDEMPOTENCY_CONFLICT, UNAUTHORIZED/FORBIDDEN, RATE_LIMITED, INVALID_JSON, QUESTION_* etc.). Non-English service messages are never passed into the English UI; already-English messages may pass through. Protocol codes are preserved for logic/tests.
- `containers.tsx` now uses this map for join failures, answer/conflict/unknown outcomes and operation errors; remaining Thai/mixed fallbacks removed. Historical user-authored DB names/questions/answers are untouched and may remain any language.
- Builder admin/HR was already English; this closes the participant/container path that the browser actually hit.

## Mounted-container regressions (not source regex)
`tests/findings-client.test.tsx` mounts the real React containers in happy-dom with the real fetch edge:
1. **Unknown room:** POST join → 404 `SESSION_NOT_FOUND` + Thai service message → rendered UI contains “Room not found. Check the room code and try again.” and **not** `ไม่พบห้องนี้`.
2. **Invalid answer:** submission 422 `INVALID_RATING` + Thai message → UI shows “Choose a score within the allowed range.” and no Thai.
3. **Conflict:** submission 409 `IDEMPOTENCY_CONFLICT` + Thai message → UI shows “already saved and cannot be overwritten” and no Thai.
These are mounted-container assertion tests; they are not browser automation or visual evidence.

## Skip reconciliation (no skips used to hide failures)
- Removed **all 8 test.skips**; full seed has **0 skips**.
- Participant/legacy copy tests updated to the current **English** product behavior (join/rating/terminal/unknown/closed, stored Thai DB labels preserved) and unskipped.
- Retired Thai-copy assertions replaced with explicit **current-route** coverage: `/facilitator` renders the English demo login (no retired token form); `/hr` routes to `BuilderApp mode="hr"` (English, read-only report source); no Thai stale-copy claim in the current builder. Legacy unreachable components remain in source but are not routed.
- Full suite: **166 pass / 0 skip / 0 fail** (166 tests, 21 files; 890 expects).

## Verification (actual)
- `bun test tests` → **166 pass / 0 fail**, **0 skips**.
- `bun test tests/findings-client.test.tsx` → 11 pass (includes the three mounted English-error cases).
- `bun test tests/builder.test.ts tests/web-views.test.tsx tests/hr-views.test.tsx` → all pass (builder authoring/WS/HR, participant English copy, current-route HR).
- `bun x tsc --noEmit` 0; `bun run build:web` 0; `bun run build:web:lan` 0.
- R04 layout/shared shell/no technical microcaptions/latest-three + full-all responses/lifecycle guards untouched.

## NOT RUN / open
- **Actual authenticated browser screenshots/geometry and browser click-flow remain NOT RUN** (no browser automation/headless browser available in this environment). The unknown-room error was fixed at the container/API-message seam and verified in mounted containers; it is not a claim of browser visual PASS.
- Mode B/Docker, cloud/LAN deployment, mobile/phone visual checks, keyboard/reduced-motion and independent QA are NOT RUN. No push/deploy/data reset; protected dirty/untracked files preserved.

## Changed paths
`apps/web/src/api-messages.ts` (new), `apps/web/src/containers.tsx`, `tests/findings-client.test.tsx`, `tests/web-views.test.tsx`, `tests/hr-views.test.tsx`, `docs/results/WORKSHOP-BUILDER-02/R05/**`, `docs/results/INDEX.md`.

## Next gate
User-assisted browser check of `/join` unknown-room and submission errors, plus authenticated create/answer/HR screenshots; independent QA. Unslop R02/R04 layout preserved.
