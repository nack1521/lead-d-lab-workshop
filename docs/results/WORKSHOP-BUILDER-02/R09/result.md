# WORKSHOP-BUILDER-02 / R09 — Real WS participant state, bounded report refresh, delete reconciliation

- **Task/run:** WORKSHOP-BUILDER-02 / R09 (`main`, HEAD `e895a38`, not pushed/deployed)
- **Producer:** DeepSeek Harness (sole coding writer); **Reported:** 2026-11-12T23:29:52+07:00
- **Trigger:** R08 coordinator review CHANGES_REQUESTED (WB2-R08-WS-01 HIGH, WB2-R08-REPORT-02 HIGH, WB2-R08-DELETE-03 MEDIUM). R08 self-paced answering, accepted UI and R07 CORS preserved.
- **Status:** **FIXED / TESTS PASS — mobile/browser visual and physical iPhone NOT RUN.**

## Fixes
1. **HIGH WB2-R08-WS-01 — real WS wire fields:** `ws.ts stateFor` now serializes `answer_mode` and `progress` alongside revision/status/question/own_response for participant **auth, broadcast and resync**. Self-paced `question.receiving=false` no longer disables participant controls. End/expiry/session guards and receipt replay unchanged.
   - Real-server boundary test: HTTP `/api/me` vs real WS auth frame for the same self-paced participant → same `answer_mode`, `progress`, question and revision.
   - Mounted container test consumes that exact frame at **equal revision**: radio/Submit remain enabled, progress renders; final completion frame renders “All questions completed”.
2. **HIGH WB2-R08-REPORT-02 — bounded live report refresh:** snapshot frames now drive immediate chart aggregates through `mergeReportWithSnapshot` (strictly newer snapshot only; asks/mean/poll shares from the authoritative frame), while text/detail report reads are **coalesced to at most one read per 150ms quiet window** via `createCoalescedTask` (replacing the removed per-frame fanout). In-flight/quiet-window coalescing prevents unbounded requests; older/equal snapshots never overwrite; text waits for the real report instead of inventing data.
   - Tests: coalescer 10 scheduled WS frames → **1 report read**, next burst → 1 more; merge ignores equal/older revisions, updates rating mean/counts and poll counts/shares on a newer revision, leaves text untouched; full workspace/source reference check.
3. **MEDIUM WB2-R08-DELETE-03 — DELETE reconciliation:** `mutate` now consumes `{deleted:id}`, removes the question from local state, clears the stale editor target and selects a safe remaining question (no reload). `reconcileDeletedQuestion` covers selected/other/only-question cases.
   - Mounted builder flow: login → room → editor → click Delete → real DELETE request → question removed from UI; backend R07 GET/DB delete readback remains covered.

## Verification (actual)
- `bun test tests/self-paced.test.ts` → 7 pass / 0 fail (adds real WS wire parity).
- `bun test tests/findings-client.test.tsx` → 14 pass / 0 fail (mounted equal-revision WS, completion, mounted DELETE).
- `bun test tests/r09-regressions.test.ts` → 3 pass / 0 fail (coalesced request bound, revision-aware merge, delete reducer).
- Full suite `bun test tests` → **190 pass / 0 skip / 0 fail** (190 tests, 25 files; 1035 expects). One pre-existing LAN proxy timing test needed a longer (10s inner / 15s test) timeout under full-suite load; not skipped and not changed functionally.
- `bun x tsc --noEmit` 0; default web build 0; cloud-configured build 0.
- Bounded refresh request count: previous per-frame path could issue up to N report reads for N frames; new path issues **≤1 per quiet window** (tested 10→1); honest local/RPC scope only.

## NOT RUN / limits
- **Mobile screenshots/geometry at 320/375/390/430 for Score/Choice/Text and physical iPhone are NOT RUN** (no browser/iPhone automation available in this environment); desktop emulation is not claimed as iPhone PASS. R08 CSS remains source-level only pending real rendering.
- Browser WS live-report click/paint, cloud deployment and independent QA remain NOT RUN. Local coalescing tests are not cloud latency/paint evidence; no push/deploy/data reset.

## Changed paths
`apps/api/src/ws.ts`, `apps/web/src/{builder.tsx,coalesce.ts,report-merge.ts}`, `tests/{self-paced.test.ts,findings-client.test.tsx,r09-regressions.test.ts,lan-guards.test.ts}`, `docs/results/WORKSHOP-BUILDER-02/R09/**`, `docs/results/INDEX.md`.

## Next gate
Coordinator retest of real WS/report/delete regressions, then user-assisted mobile rendering and cloud verification. No publication before independent review passes.
