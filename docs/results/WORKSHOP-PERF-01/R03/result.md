# WORKSHOP-PERF-01 / R03 — Coalescer-lifecycle pending feedback

- **Task/run:** WORKSHOP-PERF-01 / R03 (reviewed baseline HEAD `2f28c6a`, source `f887449`; observed implementation HEAD `8f5ed0f`; not pushed/deployed)
- **Producer:** DeepSeek Harness (sole user-operated coding writer); **Reported:** 2026-11-16T13:58:59+07:00
- **Scope:** only residual **PERF-R02-QA-01** (the queued/trailing pending branch of PERF-R01-UI-01; not a duplicate defect). R01 three performance slices and R02 cached-report fix are preserved.
- **Status:** **SOURCE FIX / COMPILE CHECKS PASS — RUNTIME NOT RUN.** No tests/browser/probes/benchmarks/API/DB/cloud calls/synthetic data under the active no-tests authorization. No runtime PASS and no speedup claim.

## Finding and static sequence
R02 made a cached report show pending while `scheduleReport` ran, but the coalescer can start a follow-up read B itself from its dirty latch. After read A succeeded it set the UI outcome to ready; if A had latched B, B could be queued/running without `scheduleReport` being called, leaving fetching false during B. At equal revision the UI showed no pending; with a newer snapshot it could show stale-only. Static source sequence only; no browser/runtime reproduction.

## Correction
- `createCoalescedTask` now accepts an optional **`onBusyChange`** observer (third argument; existing two-argument callers remain compatible). It emits only on idle↔busy transitions of the **actual** lifecycle: queued timer, in-flight read, dirty latch, and the automatically started trailing follow-up.
- Busy is true from the first `schedule()` (covers the queued interval before a read starts), stays true while A runs and while B is latched/queued/running, and becomes false only after final settlement with no pending work. No polling and no revision-derived fetching.
- Builder now keeps **outcome/error independent from pending**:
  - `reportState` is only idle/ready/error;
  - `reportPending` comes from the coalescer observer, so “Refreshing results...” covers the equal-revision queued/trailing interval and continues through B without another `scheduleReport()`;
  - initial no-cache pending shows “Loading results...”.
- Error remains independent and **takes precedence** even while trailing work is busy: cached or uncached failure shows error + manual Retry, cached cards stay. Manual Retry clears the previous error and starts a bounded read; automatic coalesced follow-ups never clear an error by themselves. No error-driven retry loop was added.
- Preserved: max-one-in-flight, bounded dirty/trailing latch, cancellation/unmount and no-previous-room application guards, swallowed rejections, lazy editor report visibility, cached/uncached recovery, HR/ended/self-paced/English UI, R01 RETURNING/batched-Text contracts. No backend/schema/design/dependency changes; deferred draft-navigation/initial-workspace recovery not reopened.

## Compile checks (actual; not runtime verification)
| Command | Exit | Scope |
|---|---:|---|
| `bun x tsc --noEmit -p tsconfig.json` | **0** | project typecheck |
| `bun run build:web` | **0** | Vite web compile/build |

## NOT RUN — proposed controlled cases for later explicit authorization
1. A queued/running → dirty B latched → A succeeds → B queued before its timer fires → UI pending stays true at equal revision; B running → pending true; B settles → final ready/not pending.
2. A fails → dirty B queued/runs → error precedence while B busy → B success clears error/updates report; B failure keeps error and Retry.
3. Same sequences with newer snapshot (pending vs stale distinction) and with cached cards/Text retained; initial no-cache loading/error/Retry.
4. cancel/unmount during A and during B: no trailing read, no old-room/unmounted result application, pending clears after settlement.
5. HR/ended surfaces, manual Retry during trailing/busy, and no automatic retry loop.
All are **NOT RUN**; the source sequence is statically reviewed only. No runtime/browser PASS or performance/latency evidence is claimed.

## Commit / changed paths
- Implementation commit: `8f5ed0f` — `apps/web/src/coalesce.ts`, `apps/web/src/builder.tsx`.
- Docs: `docs/results/WORKSHOP-PERF-01/R03/**`, `docs/results/INDEX.md`.
- Preserved: R01 delivery commits `ad76c8d`/`a90b2db`/`d618e54`, R02 fix `f887449`, docs `2f28c6a`.
- Protected dirty docs/logs (`AI-PROGRESS.md`, ANTIGRAVITY-C1 handoff, mode-a-api.log), presentation and Coordinator evidence were not staged/altered. No push/deploy, reset, cloud/paid-service/dependency/provider change.

## Provenance
Read consolidation and both independent Product/QA R02 reports before editing; only PERF-R02-QA-01 implemented. Producer/model: DeepSeek Harness / `deepseek-v4.1-flash-1017` (runtime-reported, unverified). Producer self-report; Product/QA recheck the same delivered revision; no acceptance closure by producer.
