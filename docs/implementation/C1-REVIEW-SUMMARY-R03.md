# C1 local build — Consolidated independent retest R03

**Current status: PARTIAL / EVIDENCE_GATES_OPEN. No new confirmed residual defect within the targeted scope.** Local user exploration is reasonable with the limits below, but C1 is not accepted and no release/deployment is authorized. Missing controlled evidence is not relabeled as a new code failure or silently waived.

## Sources and current build
- Application `cce8db1ac194f2ea6d9d23b707c0c05a5841b6d0`; producer report `730ca02ff68b6bb6bcc00040c8c0740fcc58c8d9`.
- [Canonical Senior QA R03](../qa/C1-LOCAL-BUILD-QA-RETEST-R03.md), [Coordinator runtime/browser R03](C1-BROWSER-RETEST-R03.md), [machine triage](evidence/C1-RETEST-R03-20261108/triage.json). Read source reports for their distinct executed scopes; do not rewrite their verdicts.
- Coordinator independently ran 84/0 in both modes, typecheck and production build (exit 0), and verified normal runner cleanup. Canonical QA independently ran Mode A 84/0 and typecheck. Coordinator owns actual Mode B, live API, browser and direct DB proof. [Coordinator execution](evidence/C1-RETEST-R03-20261108/coordinator-regression.json).

## Targeted dispositions
| Original ID | Consolidated disposition | Basis |
|---|---|---|
| R02-QA-01 | RESOLVED_TARGETED | Stored rejected receipt GET and replay work; live API/DB in A/B plus QA end-grace/revoke tests. |
| R02-QA-02 | RESOLVED_TARGETED | Dedup key binding, stable replay, changed-payload conflict, one answer and multiple correctly bound receipts; live A/B and QA. |
| R02-QA-03 | RESOLVED_TARGETED | In-transaction grant recheck/locking reviewed by QA and timed blocked-write vs revoke/expiry tests passed. This is not all possible scheduler interleavings. |
| R02-QA-04 | RESOLVED_TARGETED | QA client-seam coverage supplemented by Coordinator real-browser and DB proof in both modes: immutable retry payload and authoritative stored label. |
| R02-QA-05 | STRUCTURAL_FIX_VERIFIED / C1-EG-01 OPEN | Participant fields share one repeatable-read transaction; concurrent stress/equal-revision tests pass, but a controlled commit between individual reads was not executed. |
| C1-RV-02 | TESTED_PATHS_PASS / C1-EG-02 OPEN | Resync/broadcast, idle sweep and revoke/lifetime tests pass; the exact concurrent authorization/send boundary and equality cases lack controlled proof. No post-revoke disclosure was reproduced. |
| C1-RV-05 | PRIOR_TARGETED_RESOLUTION_RETAINED | Do not reopen the saved-to-next-question defect without evidence. R03 existing transition regressions pass; prior browser proof remains explicitly historical. |

The original IDs remain traceable through [R02 summary](C1-REVIEW-SUMMARY-R02.md) and [R01 mapping](C1-REVIEW-SUMMARY-R01.md). No new High/Critical code defect is assigned by this consolidation.

## Two narrowly scoped evidence gates

### C1-EG-01 — controlled participant-snapshot interleave
Create a real PostgreSQL read/commit barrier at an existing query/transport/test seam. Establish that a commit occurs after the reader starts its snapshot but before later component reads; inspect a complete old view and a complete new view from a later read. Assert revision, active question, own response and participant identity agree within each view. Random stress and arbitrary sleeps alone do not prove that exact schedule. Prefer test-boundary orchestration over new production behavior; do not mock the persistence result.

### C1-EG-02 — documented WS authorization/send boundary
Control revoke/expiry around revalidation and send, inspect actual frames/close outcomes, and evaluate against the existing approved lifetime policy. Cover valid/invalid sides and precise hard-TTL/grace equality, not just a delay beyond the interval. Recognize explicit participant disconnect and the stated possibility of an already-in-flight frame; do not invent a zero-race guarantee or stricter retention policy. If the exact policy interpretation is genuinely undecided, report that narrow decision rather than asserting a leak or silently changing access behavior.

These are verification tasks, not instructions to redesign the application. If controlled tests reveal a concrete defect, report it under the existing source ID and make only the necessary approved local fix through the coding tool.

## Local user trial and acceptance boundary
- Mode A participant entry: `http://127.0.0.1:5173/join`; Mode B: `http://127.0.0.1:5174/join`; local synthetic code ROOM-01. Services were checked in the Coordinator review; availability must be rechecked after stops or host changes.
- These are loopback-only URLs on this computer, not a public live deliverable or a phone-accessible workshop deployment. No facilitator grant is included here; keep credentials private.
- The user may explore the current prototype while evidence work remains open. Exploration does not accept the two gaps or close C1; full C1-01–C1-16 acceptance is not inferred from this targeted review. Physical mobile, load/30-client SLA, full accessibility/security and real crash-before-broadcast remain unproven as previously disclosed.
- Use the [verification-only English prompt](../handoffs/C1-VERIFY-R03-EN.txt) if continuing evidence work. Continue the same task with the next unused producer run; preserve R01–R03 and all case/finding IDs. A further run may contain test/evidence changes without application changes.

## Progress and authority
Canonical QA has been read and combined with current direct execution rather than its summary alone. Protected dirty progress/handoff, old R02 log append and pre-existing untracked R03 evidence remain preserved and excluded. This consolidation edits documentation only, makes no acceptance claim and does not dispatch a tool, switch writers, restart services, publish, deploy or authorize cost. DeepSeek remains user-operated primary; Antigravity still requires an explicit stopped-writer handover.
