# HR-SUMMARY-01 R01 — Independent targeted QA review

**Verdict: PARTIAL / EVIDENCE GAPS.** No confirmed High/Critical application defect was found in the executed scope. One low-severity zero-base display defect and two test/evidence gaps are recorded below. No human acceptance, ticket closure or release approval. The user's approved policy is aggregates for **any positive n**, not a minimum-five gate; synthetic demo data only.

Observed 2026-11-11 14:49 +0700: report HEAD `e092cc79fc3c0cde2c7289fb8daea9a177528b71`; source `41c8557abacb353869f8df7c8a00b1637dcacc0d`. `git diff --stat 41c8557 HEAD -- apps tests db package.json bun.lock tsconfig.json` was empty for those paths. Protected dirty/untracked files and historical reports were preserved. Prior LAN lost-control-ack issue is separate and was not retested.

## Independent execution

| Command | Exit | Actual |
|---|---:|---|
| `bun run typecheck` | 0 | TypeScript project check completed. |
| `bun test tests/hr-summary.test.ts tests/hr-views.test.tsx` | 0 | Bun 1.4.4: **8 pass, 0 fail, 113 expect calls, 2 files**. Five DB-backed API cases and three server-rendered view cases. |

Safety inspection: `tests/helpers.ts:48–84,102–105` creates and normally drops unique `c1_test_*` databases and seeds the test session inside them; HR API tests use `setupCtx` and their own test sessions (`tests/hr-summary.test.ts:12–16,82–298`). No known ROOM fixture, full suite, bootstrap, LAN verifier, service restart or Docker changes by this reviewer. Tool stdout is the independent execution evidence. Actual browser and live existing-fixture GET are Coordinator-owned; no browser or phone run by QA.

## Coverage and findings

| ID | Status in this review | Evidence / limits |
|---|---|---|
| HR-01 | **PARTIAL** | Independent DB/API tests compare n, joined base, rating/poll distribution and repeat GET (`tests/hr-summary.test.ts:176–234`); actual UI and process-restart persistence NOT RUN. Producer's own live output/reload evidence is `docs/results/HR-SUMMARY-01/R01/evidence/hr-summary-live.json` and `hr-reload-check.log`, not QA execution. |
| HR-02 | **PARTIAL** | Zero-response/null mean and 2/3 partial answers, blank comment, ties and n=2 rendered with counts passed (`tests/hr-summary.test.ts:82–173`, `tests/hr-views.test.tsx:89–139`). Positive n is not suppressed in source. The test called n=1 actually constructs n=2 for both questions; n=1 acceptance is NOT RUN independently and not asserted in the inspected producer test (HR-QA-02). Zero-base copy issue HR-QA-01. |
| HR-03 | **PARTIAL — tested role matrix passes** | Test denies HR controls/submissions/private reader and WS; rejects participant/facilitator HR access, cross-session, expiry and revoke (`tests/hr-summary.test.ts:237–298`). Route checks at `apps/api/src/app.ts:568–594`; HR WS deny `apps/api/src/ws.ts:184–187`; aggregate-only query shape `apps/api/src/hr-summary.ts:75–105`, with no raw names/comments/participant IDs in tested response. This is targeted coverage, not exhaustive adversarial/security certification or a controlled revoke-during-read test. |
| HR-04 | **PARTIAL** | API not-ended and unauthorized paths and SSR loading/not-ended/error/empty labels passed; real browser, actual network interruption and interactive state transitions NOT RUN here. |
| HR-05 | **NOT RUN** | No real-browser/mobile/keyboard/physical Safari verification by this reviewer; SSR text/table markup is not accessibility or usability certification. |
| HR-06 | **PARTIAL** | Independent typecheck and two targeted files passed; full native, Docker mode, web builds and regression NOT RUN here. Producer full-suite and Mode B reports are separate; nine Mode B skips are skips. |
| HR-07 | **PARTIAL / 30-concurrent NOT RUN** | Producer's `docs/results/HR-SUMMARY-01/R01/evidence/hr-smoke-30.log` records 30 joined, 30 rating and 27 poll, with five DB count comparisons and observed duration. Source awaits each join and submission sequentially (`scripts/hr-smoke.ts:78–91,96–112,121–138`); it does not establish 30 concurrent clients/requests. It checks count reconciliation rather than independent per-bucket equality and its WS wait accepts any snapshot revision > 0 (`:142–153,166–192`). No independent 30-participant run by QA. |

### HR-QA-01 — Low: known zero joined base displayed as unknown
`apps/api/src/hr-summary.ts:75–77,107–111` knows the database joined count is zero and correctly returns null coverage. Yet `apps/web/src/ui.tsx:329–334` renders all `joined_base <= 0` as `ยังไม่ทราบจำนวนผู้เข้าร่วม`. For a real ended session with zero joined, the UI states the known number is unknown even though the session header separately shows 0. Repro from inspected server-rendered code and existing zero test input (`tests/hr-views.test.tsx:115–139`); the current test does not assert this text. Correctly distinguish known zero from genuinely unknown without dividing by zero. No runtime browser reproduction claimed.

### HR-QA-02 — Medium evidence gap: n=1 is not covered by the named test
`tests/hr-summary.test.ts:111–164` joins three participants and asserts rating n=2 and poll n=2 despite its n=1 title. SSR test data also has n=2 (`tests/hr-views.test.tsx:25,45`). The source handles positive n without a five-person suppression (`apps/api/src/hr-summary.ts:107–116,140–157`, `apps/web/src/ui.tsx:430–468`), but an independently executed n=1 end-to-end example is absent from these tests. Request an existing coding tool to add one accepted respondent, question-specific n/N, counts, mean/option shares and low-sample caveat assertions on current build. Do not impose a minimum sample policy.

### HR-QA-03 — Medium evidence gap: sequential smoke is not 30-concurrent verification
The producer's observed 30 synthetic participants and counts are useful, but `scripts/hr-smoke.ts:80–91,98–112,124–138` awaits each request in a loop; 30 distinct participants is not a 30-concurrent-participant test. `:192` also bases success on summary/count matches, not an explicit assertion that all target joins/submissions succeeded. The logged successful counts are retained as producer-reported results, not independently rerun or invalidated. Obtain a separately authorized bounded real-app concurrency test with explicit attempted/admitted/success/fail/unique participant and per-question aggregate reconciliation, plus timing; no production load test without approval and no 30-real-phone or SLA claim.

## Limits and provenance

Actual authenticated browser navigation/reload, partial-state visual behavior, mobile Thai layout, keyboard and physical Safari remain NOT RUN by QA. Test counts are not full C1/LAN regression, full privacy certification or production authorization/retention policy. User-approved low-n aggregate visibility is retained; the small-sample caveat is not a suppression threshold. `independent-runtime-qa` was read and applied. Coordinator aggregates results; user is the final approver.
