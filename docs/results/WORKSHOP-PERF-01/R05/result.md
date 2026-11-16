# WORKSHOP-PERF-01 / R05 — Focused test-strengthening for PERF-R04-QA-01

- **Task/run:** WORKSHOP-PERF-01 / R05 (docs baseline `fda8a26`, tests `45c7f89`, app `8f5ed0f`; observed tests-only HEAD `de5fd90`; not pushed/deployed)
- **Producer:** DeepSeek Harness (sole user-operated coding writer); **Reported:** 2026-11-16T16:03:33+07:00
- **Scope:** TEST-ONLY strengthening of PERF-R04-QA-01 and Product coverage qualifications. No application/API/coalescer/migration/configuration/dependency/UI changes. Existing reports remain immutable.
- **Status:** **FOCUSED LOCAL TESTS PASS WITHIN EXECUTED SCOPE — no whole-app PASS, no speedup, no independent QA.** R04 reviewer gaps addressed as below; remaining NOT RUN cases listed.

## Gap mapping and changes
1. **Assertions inside swallowed callbacks** — in `tests/r04-coalesce-lifecycle.test.ts` the A-success/latched-B test now captures the version observed at each run start and asserts `[1, 2]` in the outer awaited test runner after settlement. Errors thrown by the run callback can no longer hide the final-value check. Concurrency/busy event assertions retained.
   - **Controlled negative check actually performed:** a temporary external test asserted a deliberately wrong captured value in the outer runner; Bun exited **1** with 0 pass/1 fail (assertion failure observed, not invented). The temporary file was removed and not committed.
2. **Mislabeled single-read "B failure"** — renamed the valid single-read rejection test accurately (swallowed rejection, one busy idle transition, bounded post-settlement interval, one run). Added a deterministic real trailing sequence: hold A, latch dirty B, settle A successfully, prove B starts only then with at most one active read, hold B, reject B; outer assertions verify events `[true,false]`, runs=2, no idle flicker, bounded 100ms post-settlement observation with no extra runs.
3. **Mounted cached A failure with B latched** — strengthened `tests/findings-client.test.tsx`: A is held, B latched by a second WS frame, A rejects; B starts and is held. While B is pending the rendered UI shows the report error + **Retry results**, cached text remains, and “Refreshing results...”/“Results may be out of date.” do **not** override failure. B then rejects; error remains; manual Retry recovers with a bounded request count (4 reads) and a 200ms post-settlement observation showing no extra retry loop. Actual rendered controls/request counts are used, not source regex.
4. **Deterministic final-text ordering** — the R10 mounted final-text test replaces the fixed 80ms response delay with a test-controlled deferred gate. It asserts initial text, pending “Refreshing results...” while A is in flight, sends the dirty frame, releases A, waits conditionally for final text, excludes stale text, and keeps the request bound. Fixed sleeps were replaced by bounded condition waits; bounded idle-observation windows are used only where a negative/absence assertion requires them.

## Exact commands / exits / counts (focused LOCAL isolated)
DB: project `.env` points to loopback `127.0.0.1:5433`; commands set `API_HOST=127.0.0.1`; existing helpers create/migrate/close only unique `c1_test_*` DBs. No production/known DB call or reset; no host override; original DB container/volume left running. Debug/response output stayed in process; evidence contains sanitized aggregates only.
| Command | Exit | Counts |
|---|---:|---|
| `API_HOST=127.0.0.1 bun test tests/r04-coalesce-lifecycle.test.ts tests/r10-coalesce.test.ts tests/r09-regressions.test.ts` | **0** | **11 pass / 0 fail / 0 skip**, 42 expects, 3 files |
| `API_HOST=127.0.0.1 bun test tests/findings-client.test.tsx` | **0** | **19 pass / 0 fail / 0 skip**, 80 expects, 1 file |
| `API_HOST=127.0.0.1 bun test tests/builder.test.ts tests/self-paced.test.ts tests/builder-views-r03.test.tsx` | **0** | **23 pass / 0 fail / 0 skip**, 167 expects, 3 files |
| `bun run typecheck` | **0** | compile/typecheck only, not runtime evidence |
| negative control (temporary, not committed) | **1** | 0 pass / 1 fail; outer awaited assertion caught deliberately wrong captured value |
Total focused executed: **53 pass / 0 fail / 0 skip**. No skips or filters in the recorded focused groups.

## Coverage limits / NOT RUN
- HR and ended-surface variants, mounted room-switch/unmount cancellation, queued-before-B UI interval beyond the exercised cached entry, initial no-cache accessibility/zero-card assertions, full suite, browser/physical device, load/benchmarks/action timing and cloud/deploy remain **NOT RUN**. Existing cross-session Text batching/tie/query-count and unlocked-Save serializer limits remain.
- Draft navigation, initial workspace recovery and actor/role breadth remain deferred and were not added.
- No application defect was established by these gaps; if a future assertion exposes one, it must be reported for a separately agreed application fix. No performance/speedup or whole-product acceptance claim.
- Cleanup: existing helpers own API/server/SQL/socket cleanup and normally drop their unique test DBs; individual DB absence was not independently catalog-verified, and the base DB container/volume was not stopped or reset.

## Changed paths / commit
- **`de5fd90`** (tests-only): `tests/r04-coalesce-lifecycle.test.ts`, `tests/findings-client.test.tsx`; docs `docs/results/WORKSHOP-PERF-01/R05/**`, `docs/results/INDEX.md`.
- No app/API/schema/migration/config edits. Protected dirty docs/logs/presentation/Coordinator evidence not staged. No push/deploy/cloud/dependency/paid-resource change.

## Provenance / next gate
Read consolidation and both R04 independent reports before editing; used existing controlled seams and owned loopback test DBs. Producer/model: DeepSeek Harness / `deepseek-v4.1-flash-1017` (runtime-reported, unverified). Coordinator asks QA for an independent fresh rerun and Product for static coverage review on the same revision; no acceptance closure by producer.
