# WORKSHOP-PERF-01 / R02 — Cached-report refresh failure and pending/stale states

- **Task/run:** WORKSHOP-PERF-01 / R02 (baseline `dda4f4f`, observed HEAD `f887449`, not pushed/deployed)
- **Producer:** DeepSeek Harness (sole user-operated coding writer); **Reported:** 2026-11-16T13:40:53+07:00
- **Scope:** only **PERF-R01-UI-01** (single finding independently corroborated by Product and QA). The three R01 performance slices are not redone.
- **Status:** **SOURCE FIX / COMPILE CHECKS PASS — RUNTIME NOT RUN.** No tests, browser scenarios, probes, benchmarks or synthetic data were run under the user's active no-tests instruction. No runtime PASS or speedup claim.

## Finding fixed
R01 source showed report failure/Retry only when `!report && !reportLoading`. If a report was already cached, a later refresh failure was hidden; with a newer snapshot, `reportLoading` also stayed true because it conflated revision lag with an actual pending request. Cached charts could update from WS while cached Text stayed stale with no failure indication.

## Correction (apps/web/src/builder.tsx only)
- Split the old combined signal into **`reportFetching`** (queued/in-flight request) and **`reportStale`** (cached report older than the latest snapshot revision); these are now distinct states.
- `scheduleReport` sets the request state to loading even when a report is already cached, so a queued/in-flight refresh shows truthful pending feedback **including at an equal snapshot revision**.
- Dashboard status precedence:
  1. **failed** — accessible error + manual **Retry results**, always shown even with a cached report; message states that the last loaded results are shown and cached charts/Text remain visible;
  2. **initial loading** — “Loading results...” when no cached report;
  3. **fetching** — “Refreshing results...” when a cached report is shown and a request is queued/in-flight (regardless of equal revision);
  4. **stale, not fetching, no error** — “Results may be out of date.” with a manual **Refresh results** action;
  5. otherwise no status copy.
- Error takes precedence over updating/stale copy; cards render whenever a cached report exists, so cached results remain available on failure. Initial no-cache error remains recoverable via Retry.
- No automatic retry loop added: retries are explicit (button) or event-driven through the existing bounded coalescer; R10 max-one-in-flight/dirty-trailing/cancellation is unchanged. Lazy report visibility, Dashboard/HR/ended surfaces, English copy, self-paced behavior and accepted layout are unchanged.
- No backend refactor, schema/index migration, redesign, or deferred **PERF-PRODUCT-02** draft-navigation / inherited initial-workspace recovery work was added.

## Compile checks (actual; not runtime verification)
| Command | Exit | Scope |
|---|---:|---|
| `bun x tsc --noEmit -p tsconfig.json` | **0** | project typecheck |
| `bun run build:web` | **0** | Vite web compile/build |

## NOT RUN
- No automated tests/regressions, browser scenarios/screenshots, probes, benchmarks/load, synthetic data, authenticated API/DB/WS calls or cloud checks. Runtime behavior of cached-error/Retry, equal-revision pending, stale-vs-fetching, HR/ended surfaces and coalescer interaction is **NOT RUN**. Manual source review is not runtime verification and does not verify performance benefit.
- No speedup/latency claim; R01 endpoint baselines remain user-provided context only.
- No push/deploy, data reset, cloud/paid-service/dependency/provider change. Protected dirty files (`docs/AI-PROGRESS.md`, `docs/handoffs/ANTIGRAVITY-C1.md`, `mode-a-api.log`) and presentation/Coordinator evidence were not staged.

## Changed paths / commit
- Code commit: `f887449` — `apps/web/src/builder.tsx` only.
- Docs: `docs/results/WORKSHOP-PERF-01/R02/**`, `docs/results/INDEX.md`.
- Preserved delivery commits: `ad76c8d` (RETURNING writes), `a90b2db` (batched latest text), `d618e54` (editor-first/lazy report).

## Proposed focused checks for later explicit authorization
1. Mounted Dashboard/HR/ended: cached report + failed refresh → error+Retry visible, cached cards stay, no false loading; error precedence over stale/pending.
2. Equal-snapshot-revision cached report + queued fetch → “Refreshing results...”; stale-only (no fetch) → stale copy+Refresh; initial no-cache loading/error/Retry.
3. Coalescer interaction: retry during in-flight/queued retains max-one-in-flight and trailing latch; no retry loop; cancel/unmount prevents trailing writes.
4. Permissioned browser/manual verification only after authorization; no runtime PASS before then.

## Provenance
Read consolidation, both independent Product/QA reviews and the Coordinator static review before editing; only PERF-R01-UI-01 implemented. Producer/model: DeepSeek Harness / `deepseek-v4.1-flash-1017` (runtime-reported, unverified). Producer self-report; independent QA/release decisions remain separate.
