# HR-SUMMARY-01 R02 — Independent targeted retest

**Verdict: PARTIAL / EVIDENCE GAPS.** The original zero-base defect is resolved in the independently tested SSR path and the new singleton rating test passes. The producer's 30-participant result is a useful **paced 10-in-flight** overlap run, but the specified singleton poll and some overlap-harness acceptance/cleanup assertions remain unproven. A cleanup false-green path is a static diagnostic-harness finding, not an observed application failure. No human acceptance, closure or deployment approval; positive n remains visible without a minimum-five gate.

Observed 2026-11-11 15:51 +0700: report HEAD `c707d6b84fed07c044e368a8bb090c5e491f7246`; source `96a1365e5f9a653956e6517564e8fab1505f8cda`. The scoped diff for `apps tests scripts db package.json bun.lock tsconfig.json` was empty; this does not certify other paths. Protected dirty/untracked work and prior immutable reports were not changed.

## Independent execution

| Command | Exit | Actual |
|---|---:|---|
| `bun run typecheck` | 0 | Project typecheck completed. |
| `bun test tests/hr-summary.test.ts tests/hr-views.test.tsx` | 0 | Bun 1.4.4: **11 pass, 0 fail, 146 expect calls, 2 files**; no skips or filters in this invocation. |

`tests/helpers.ts:48–84,102–105` uses uniquely named `c1_test_*` databases, seed and normal cleanup. Both targeted test files were inspected before execution. No full suite, overlap script, fixture CLI, LAN verifier, known-fixture mutation, browser auth or service/Docker restart was performed. Coordinator owns independent overlap-script execution. Tool stdout above is this review's evidence; producer logs are attributed separately.

## Original findings

| ID | Verdict | Evidence / bounded limitation |
|---|---|---|
| HR-QA-01 | **RESOLVED_TARGETED** | `apps/web/src/ui.tsx:329–343` distinguishes known base 0 from unavailable; `tests/hr-views.test.tsx:180–185` asserts zero text and absence of the old unknown text. Independent targeted run passed. Actual browser/mobile remains NOT RUN. |
| HR-QA-02 | **PARTIAL — singleton rating resolved; singleton poll NOT RUN** | `tests/hr-summary.test.ts:176–223` uses one actual participant and accepted rating 4, verifies n/base/coverage/mean/blank comment, unanswered poll and DB counts. `tests/hr-views.test.tsx:187–209` renders the singleton rating and 100% share; independently passed. The requested singleton **poll count/share** is not exercised: the poll in this test has n=0. The SSR test title mentions a caveat but its constructed caveats contain only self-report and the test does not assert a small-sample caveat; the API singleton test does assert it. No claim of a singleton poll defect. |
| HR-QA-03 | **PARTIAL — producer overlap evidence, independent rerun pending** | Producer `docs/results/HR-SUMMARY-01/R02/evidence/hr-overlap-30.log` reports 30 unique participants, join 30/30, rating 30/30, poll 27/27, 0 failures; client-side max in-flight **10** per phase with **60 ms between waves**, baseline 0 and committed revision 89. Source `scripts/hr-smoke-overlap.ts:88–141,199–271` uses `Promise.all` waves and counts launched client operations; `:273–298` matches a facilitator frame to committed revision and active poll question; `:301–365` compares HR buckets and shares with DB. It does not inspect the frame's own bucket/count payload against DB, and opens only a facilitator WS (`:146–169`), not 30 participant WS connections. Coordinator owns a fresh rerun; no 30 simultaneous requests, 30 phones, SLA or full load-certification claim. See R02-HR-QA-03-A. |

### R02-HR-QA-03-A — Medium, static evidence-harness cleanup false-green risk

`scripts/hr-smoke-overlap.ts:377–405` prints `ok` and sets exit status **before** `finally`; `:417–425` then appends an `all_sockets_settled` failure if the close deadline expires, but never sets `process.exitCode` to nonzero for that newly added failure. Thus a run with successful earlier checks but an unsettled socket can print `ok:true`, emit a cleanup error on stderr, and still exit 0. The producer success JSON contains no `all_sockets_settled` result because it is printed before cleanup. This is source inspection, not an independently reproduced cleanup failure or a claim that the producer's socket failed to settle. Require the harness owner to derive final output and exit from post-cleanup checks; use a controlled unsettled socket to verify nonzero and successful cleanup to verify zero. Also assert the correlated fresh frame's expected aggregate against independent DB buckets, and retain separate client-launched vs server-admitted semantics: `runPhase` increments `admitted` before sending (`:99–108`), so that field is not an independent server admission observation.

## Evidence and preserved boundaries

Producer reports native 124/0 and Mode B with **9 declared skips** (`docs/results/HR-SUMMARY-01/R02/result.md:19–25`); neither was independently rerun here, and skips are not passes. The producer overlap log is real producer evidence, not this review's execution; its useful n/base, counts, timings and revision are retained within the stated 10-request pacing. The user's any-positive-n decision remains authoritative; no new suppression threshold or production policy is proposed. C1/CA/LAN dispositions and the unrelated LAN lost-ack issue remain unchanged. Authenticated browser, mobile/keyboard/physical Safari, real-device concurrency, production load and SLA remain NOT RUN. `independent-runtime-qa` was read and applied. Coordinator consolidates; the user decides acceptance.
