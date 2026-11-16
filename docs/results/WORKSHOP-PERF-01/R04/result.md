# WORKSHOP-PERF-01 / R04 — Focused local runtime tests for R03 pending lifecycle

- **Task/run:** WORKSHOP-PERF-01 / R04 (reviewed HEAD `940a286`, source `8f5ed0f`; observed tests-only HEAD `45c7f89`; not pushed/deployed)
- **Producer:** DeepSeek Harness (sole user-operated coding writer); **Reported:** 2026-11-16T15:38:49+07:00
- **Scope:** TEST-ONLY follow-up under explicit focused LOCAL isolated-test approval. No application/API/coalescer/migration/config edit. R03 code remains as delivered.
- **Status:** **FOCUSED LOCAL TESTS PASS WITHIN EXECUTED SCOPE — NOT a whole-app PASS, not speedup evidence, no independent QA.** Runtime was exercised only via existing Bun/happy-dom seams; no browser/physical device/cloud/load measurement.

## Existing mounted regression synchronization
QA observed `tests/findings-client.test.tsx` previously failing before its intended assertions: after clicking Dashboard it expected “Initial text” after `tick(12)`, while lazy report scheduling was still showing “Loading results...”. This was a synchronization failure in the test, not proof of an app defect. Fix remains tests-only:
- added bounded condition-based `waitFor(condition, timeoutMs=3000, interval=10)` and replaced fixed-zero-turn waits in the mounted R10 final-text test (login → room → Dashboard → initial text → in-flight read → final text) with conditions/controlled request delay.
- retained the original final-text and stale-text assertions and added an assertion that **“Refreshing results...”** is visible while the delayed report read is in flight.
- The test now passes: **1 pass / 0 fail** (targeted run), and the whole findings file passes 19/19.

## New focused tests (tests only)
### Coalescer lifecycle (`tests/r04-coalesce-lifecycle.test.ts`)
- A success + dirty B latched: observer busy true from first schedule, stays true through A success, B queued and B running; only one idle→busy and one busy→idle transition; final settlement; max one run in flight.
- A failure + B: rejection swallowed, busy stays true through B, bounded (exactly two runs), no automatic retry loop.
- B failure at final settlement: busy clears once, no extra run.
- Cancel during A with latched B: B never starts, busy clears after A settles.
These map directly to `apps/web/src/coalesce.ts` schedule/fire/finally/cancel branches incl. the R03 `onBusyChange` observer. 4 pass / 0 fail.

### Mounted BuilderApp surfaces (`tests/findings-client.test.tsx`)
- **Cached equal-revision pending:** cached report, WS snapshot with equal revision, delayed in-flight read → “Refreshing results...” visible; final text applied; reads=2.
- **Cached failure + error precedence:** initial cached text retained, refresh failure → accessible error + Retry visible, no “Refreshing results...”/“Results may be out of date.”, then manual Retry recovers.
- **Uncached initial failure:** error + Retry with no cached results, manual retry recovers and request count=2.
- **Editor WS inactivity:** while Questions is active, no report request (0) even after a WS snapshot; clicking Dashboard loads exactly the coalesced report and text.
Maps to builder `refresh()` workspace-first/lazy report, `scheduleReport`, `reportPending` observer, `retryReport`, Dashboard error/pending branches. 4 pass / 0 fail in the new describe; all 19 findings tests pass.

## Exact commands / exits / counts (isolated local only)
DB environment: project `.env` DATABASE_URL points to loopback `127.0.0.1:5433`; commands set `API_HOST=127.0.0.1`; existing `setupCtx` helpers create/migrate/stop only unique `c1_test_*` DBs and normally drop them. No production/known database call or reset; no host override used.
| Command | Exit | Counts |
|---|---:|---|
| `API_HOST=127.0.0.1 bun test tests/r04-coalesce-lifecycle.test.ts tests/r10-coalesce.test.ts tests/r09-regressions.test.ts` | **0** | **10 pass / 0 fail / 0 skip**, 38 expects, 3 files |
| `API_HOST=127.0.0.1 bun test tests/findings-client.test.tsx` | **0** | **19 pass / 0 fail / 0 skip**, 76 expects, 1 file |
| `API_HOST=127.0.0.1 bun test tests/builder.test.ts tests/self-paced.test.ts tests/builder-views-r03.test.tsx` | **0** | **23 pass / 0 fail / 0 skip**, 167 expects, 3 files |
| `bun run typecheck` | **0** | compile/typecheck only, not runtime evidence |
Total focused executed: **52 pass / 0 fail / 0 skip**. All three test commands exited normally; no hook failures reported. Existing helpers own API/server/SQL/socket cleanup; DB absence per test database was not independently catalog-verified, and the original DB container/volume was left running. Builder debug output was kept in process/command logs only; no tokens/response credentials were written to evidence.

## RED/GREEN and limits
- **Observed RED:** QA’s independent run of the existing mounted test failed at the “Initial text” expectation while “Loading results...” was displayed, before trailing assertions; our first focused diagnostic reproduced that timing-sensitive failure. The corrected condition-based test is GREEN.
- **NOT RUN:** whole/full suite, browser/real-device screenshots, load/benchmarks/action timing, cloud, HR/ended surface variants, room-switch/unmount mounted cases, initial-workspace recovery and draft navigation. No performance/speedup or whole-product PASS claim.
- No application logic was changed to satisfy a failing test; no new product defect was observed in the executed scope. If later runs reveal one, it must be reported for a separately agreed fix.

## Changed paths / commit
- **`45c7f89`** (tests-only): `tests/findings-client.test.tsx`, `tests/r04-coalesce-lifecycle.test.ts`; docs under `docs/results/WORKSHOP-PERF-01/R04/**`, `docs/results/INDEX.md`.
- No app/API/schema/migration/config edits. Protected dirty docs/logs (`AI-PROGRESS.md`, ANTIGRAVITY-C1 handoff, mode-a-api.log), presentation and Coordinator evidence not staged. No push/deploy/cloud/dependency/paid-resource change.

## Provenance
Read QA R03 focused retest before editing and used existing seams/controlled requests. Producer/model: DeepSeek Harness / `deepseek-v4.1-flash-1017` (runtime-reported, unverified). Coordinator is asked to arrange an independent fresh rerun; no acceptance closure by producer.
