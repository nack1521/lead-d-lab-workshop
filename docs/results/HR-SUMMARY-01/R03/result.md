# HR-SUMMARY-01 / R03 — Singleton poll/share, rendered caveat and cleanup-aware overlap evidence

- **Task/run:** HR-SUMMARY-01 / R03 (`main`, HEAD `9a909bf`, not pushed)
- **Producer:** DeepSeek Harness (single writer); baseline R02 report `c707d6b`
- **Reported:** 2026-11-12T08:09:23+07:00
- **Status:** **READY_FOR_REVIEW** — three R02 QA items closed; authenticated browser/physical Safari remain NOT RUN.

## Finding dispositions
| ID | Status | Actual |
|---|---|---|
| HR-QA-02 singleton poll/share + rendered caveat | **FIXED** | New API/DB case: one participant answers poll `time` only (blank comment), rating unanswered → poll n=1/base 1/unanswered 0/coverage 1/counts `{time:1}`, blocker share 1, comment_count 0; rating n=0/base 1/unanswered 1/coverage 0/mean null/counts `{}`; DB confirms 1 poll row/0 comments/0 rating rows; small-sample caveat present. New rendered view case asserts the singleton poll 100% share, explicit n=1 and the **caveat text itself** (not only a title). Existing rating singleton retained; positive n visible with no five-person gate. |
| HR-QA-03 fresh-frame buckets | **FIXED** | Overlap smoke now compares the correlated facilitator frame's **own rating and poll buckets and totals** with independent DB buckets at committed revision 89/poll question (not only revision equality): rating `{1:6,2:6,3:6,4:6,5:6}`, poll `{time:7,skill:7,safety:7,clarity:6}`, totals 30/27 all match. Baseline revision 0 is used only as a baseline. Phases report **client_launched vs server_responded vs succeeded** separately (30/30/30 joins, 30/30/30 ratings, 27/27/27 polls; max in-flight 10; 842 ms; disclosed 60 ms waves). |
| R02-HR-QA-03-A cleanup false-green | **FIXED** | `finalizeRun` derives `ok`/`failures`/exit **after** cleanup; the smoke prints its final JSON (including `cleanup.settled` and close codes) only after socket settlement, and exits nonzero if any earlier check or cleanup failed. Controlled tests: normal cleanup → ok; unsettled socket → `all_sockets_settled` failure/nonzero; earlier failure + clean close retained. RED captured on the missing helper, GREEN after implementation. |

## Verification
- `bun test tests/hr-summary.test.ts tests/hr-views.test.tsx tests/hr-smoke-support.test.ts` → 16 pass / 0 fail (188 expects); RED log for the cleanup helper and GREEN log saved.
- `bun scripts/hr-smoke-overlap.ts 30 30 27` → **exit 0**, `ok:true`, `failures:[]`, `cleanup.settled:true`, full frame-bucket/total checks true.
- Native `bun test tests` → **137 pass / 0 fail** (745 expects, 17 files). Mode B Docker-only runner → **137 tests, 0 fail**, 9 declared skips. Typecheck 0; default/LAN builds 0.
- Fixture side effect: one fresh owned `HR-DEMO-*` session via the local fixture CLI; no known ROOM/prior demo mutation; private grant file in ignored `.local/hr-grants` (path only).
## Limits / NOT RUN
Authenticated browser, mobile/keyboard/accessibility and physical Safari NOT RUN (user-confirmed local HR usability retained; no credential re-entry gate). 30-participant result is single-machine synthetic paced 10-in-flight traffic — not 30 phones/SLA. No policy/threshold change.

Evidence: `evidence/` (hr-red/support-red, green logs, hr-overlap-30.log, regressions/builds, README).
