# HR-SUMMARY-01 / R02 — Known-zero copy, singleton n=1 and overlapping 30-participant evidence

- **Task/run:** HR-SUMMARY-01 / R02 (`main`, source HEAD `96a1365`, not pushed)
- **Producer:** DeepSeek Harness (single active coding writer)
- **Reported:** 2026-11-11T15:10:05+07:00 (Asia/Bangkok)
- **Baseline:** R01 report `e092cc7`, source `41c8557`
- **Status:** **READY_FOR_REVIEW** — three QA branches closed with TDD/controlled evidence; authenticated browser/physical Safari remain **NOT RUN**.

## Finding dispositions
| ID | Status | Actual |
|---|---|---|
| **HR-QA-01** (Low, known-zero denominator copy) | **FIXED** | A known `joined_base=0` now renders “ผู้เข้าร่วม 0 คน · ยังไม่มีคำตอบ · ไม่สามารถคำนวณความครอบคลุมหรือค่าเฉลี่ย” and the empty state says there are no participants or answers; the phrase “ยังไม่ทราบจำนวนผู้เข้าร่วม” is no longer used for a known zero. A genuinely unavailable denominator keeps a separate label. TDD RED captured on the old copy (1 fail), GREEN after the fix. API zero/null semantics unchanged (no division by zero). |
| **HR-QA-02** (Medium, n=1 evidence gap) | **FIXED** | Added an actual singleton API/DB case: one accepted rating (rating 4, whitespace-only comment), poll unanswered → rating n=1, base 1, unanswered 0, coverage 1, counts {4:1}, mean 4, comment_count 0; poll n=0, base 1, unanswered 1, coverage 0, mean null; confidence text contains `n=1`, small-sample caveat present, no blocker list; DB independently confirms one rating row, mean 4, zero comments and zero poll rows. Added an n=1 rendered view case (mean, 100% share, explicit n/base). The old misleading “n=1” test title now states it is the **partial n=2-of-3** fixture. Positive n remains visible with explicit counts; **no five-person gate**. |
| **HR-QA-03** (Medium, 30-concurrent evidence gap) | **FIXED** | New `scripts/hr-smoke-overlap.ts` runs a **fresh owned `HR-DEMO-*` session** (verifies 0 participants/active before use) and issues HTTP joins/ratings/polls through a **bounded 10-request concurrency pool**, not await-in-loop (60 ms wave pacing disclosed). Actual: joins attempted 30 / admitted 30 / succeeded 30 / failed 0; ratings 30/30/0; polls 27/27/0; unique participant ids 30; **observed max in-flight 10 per phase** (overlap observed); phase durations 237/228/209 ms, total 815 ms. Per-bucket DB equality asserted for rating buckets {1:6,2:6,3:6,4:6,5:6}, poll options {time:7,skill:7,safety:7,clarity:6} and comment counts (rating 10, poll 6), not only totals. Facilitator WS baseline revision 0 (an empty-room initial snapshot is only a baseline), final committed revision **89**, and the accepted fresh frame matches revision 89 and the poll active question — freshness is correlated, not “revision>0”. HR summary asserted equal: joined base 30, rating n=30 mean 3, poll n=27, unanswered 3, option shares recomputed from DB; no comment text in the summary. All sockets settled; any failed check or exception exits nonzero (all checks true here). |

## Preserved
Real HR functionality, read-only role/session/expiry/privacy, positive-n visibility with explicit counts, no minimum-five gate, caveats, API zero/null semantics, migration/CA/strict-TLS/LAN resolutions and all immutable reports are unchanged. The known LAN verifier lost-control-ack issue remains separate and was **not** run on existing fixtures.

## Verification (actual commands/exits)
- Targeted RED: `bun test tests/hr-summary.test.ts tests/hr-views.test.tsx` → **exit 1** (known-zero copy assertion failed; logged in `evidence/hr-red.log`).
- Targeted GREEN: same files → **exit 0**, 11 pass, 146 expects (`evidence/hr-green.log`).
- Full native `bun test tests` → **exit 0**, **124 pass / 0 fail**, 676 expects, 14 files.
- Mode B Docker-only runner → **exit 0**, **0 fail**, 9 declared skips (host-tooling/raw-socket/LAN-fixture cases; skips are not passes).
- `bun x tsc --noEmit -p tsconfig.json` → 0; `bun run build:web` → 0; `bun run build:web:lan` → 0.
- Overlap smoke `bun scripts/hr-smoke-overlap.ts 30 30 27` → **exit 0**, `ok:true`, `failures:[]` (`evidence/hr-overlap-30.log`).
- Fixture side effect: the smoke creates one **fresh owned** HR-DEMO session via the local fixture CLI; no known ROOM/previous demo session is reused, mutated for restoration, or deleted. A private HR grant file for later trial is written under ignored `.local/hr-grants/` (path only, no token printed).
- Services were already running on existing PostgreSQL/volumes; no reset, `down -v`, or migration rewrite.

## Remaining limits / NOT RUN
- **Authenticated browser, physical Safari, mobile/keyboard/accessibility checks: NOT RUN.** The HR password field was not automated/bypassed. Desktop SSR/HTTP and API checks are not browser proof.
- 30-participant result is a single-machine synthetic bounded run (10 in-flight, paced); it is **not 30 phones, not a load test, not an SLA**. Localhost synthetic traffic does not prove real-device concurrency.
- Independent QA/human acceptance and deployment approval remain open; no 30-real-user or production privacy/retention claim.
- C1/LAN remain outside this run; the LAN verifier residual is untouched.

## Evidence
`evidence/hr-red.log`, `evidence/hr-green.log`, `evidence/hr-overlap-30.log`, `evidence/mode-a-regression.log`, `evidence/mode-b-regression.log`, `evidence/typecheck.log`, `evidence/build-web.log`, `evidence/build-web-lan.log`; index: `evidence/README.md`.
