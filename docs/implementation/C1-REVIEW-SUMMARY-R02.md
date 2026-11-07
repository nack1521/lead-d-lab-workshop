# C1 local build — Consolidated independent retest R02

**Current verdict: CHANGES_REQUESTED.** The original unchanged-join and next-question browser defects no longer reproduce in tested paths. That progress stands; R02 is not fully accepted because residual receipt, authorization, payload and snapshot paths remain open.

## Sources and scope
- App/build `da30003a805cc6b0e133bdc9ac94ae001419e488`; submitted report `97a47605bc827c6b8f0a860fbfa8a8c5df6ebc39`.
- [Canonical QA retest](../qa/C1-LOCAL-BUILD-QA-RETEST-R02.md), [Coordinator browser retest](C1-BROWSER-RETEST-R02.md), [R01 mapping](C1-REVIEW-SUMMARY-R01.md), [machine triage](evidence/C1-RETEST-R02/triage.json). Preserve each report and source ID; they describe different executed scopes.
- Coordinator checked the cited receipt, grant, snapshot, client and runner code before triage, then reproduced additional residuals below. Existing current-build regression remains **71 pass / 0 fail in each mode**, typecheck exit 0; [direct execution output](evidence/C1-RETEST-R02/coordinator-regression.json). No new test code or app/config changes were written by Hermes.

## Named residuals
| ID | Group | Coordinator priority | Evidence | Required result |
|---|---|---|---|---|
| R02-QA-01 | C1-RV-01 | High | API + DB, both modes | Authenticated GET of a rejected receipt returns its stable stored rejection, not an internal error or accepted serialization. Cover lost rejection ack, replay, grace and revoke. |
| R02-QA-02 | C1-RV-01 | High | API + DB, both modes | Bind every handled key to a stable outcome/fingerprint, including deduplication against an existing answer. Preserve one accepted answer and reject a changed payload for a previously handled key as required. |
| R02-QA-03 | C1-RV-01 | High | Static code path | Define a common write/revoke serialization order and recheck current authorization at the mutation decision. Add controlled waiting-submit vs revoke/expiry tests; no successful exploit is claimed here. |
| R02-QA-04 | C1-RV-03 | Medium | Browser + DB, Mode A | Preserve the complete uncertain join payload and show the authoritative stored label. Do not silently reinterpret nickname edits as an update to an already committed join. |
| R02-QA-05 | C1-RV-04 | High | Static code path | Read participant session/question/own response as one coherent snapshot, including WS own-response construction. Test concurrent commit/read and equal-revision reconciliation, not only strictly older HTTP. |

Source QA labels all five High. Coordinator calibrates R02-QA-04 to **Medium**: the reproduced impact is optional nickname/payload-display consistency, not authentication identity takeover, duplicate participant count or accepted-answer loss. This does not waive the requirement. The source QA report is retained unchanged.

## Newly executed residual reproductions
- [Receipt repro and direct DB readback](evidence/C1-RETEST-R02/residual-receipt-repro.jsonl): in **both** modes a 501-character comment returns POST 422 with a terminal rejected receipt, then GET of that same receipt returns **500 INTERNAL_ERROR**. DB confirms a rejected receipt with null response reference.
- In both modes, accept rating 3 under key A; use new key B with rating 4 and receive old rating 3 as deduplicated; reuse key B with rating 5 and receive **200/deduplicated** again instead of the expected key/payload conflict. DB still has one response and one accepted receipt; no answer overwrite or duplicate accepted row is asserted.
- [Nickname repro and DB readback](evidence/C1-RETEST-R02/residual-nickname-repro.jsonl), [browser screenshot](evidence/C1-RETEST-R02/A-edited-join-label.png): lose a real join response after commit with nickname `Synthetic R02 original label`, edit nickname and retry. The key remains the same, but payload/UI use `Synthetic R02 edited label` while DB retains the original. No credential or raw grant is exposed in the evidence.

## Original-group disposition and security gate
- C1-RV-01 OPEN: rejected POST replay improved, but the three named receipt/authorization residuals remain.
- C1-RV-02 PARTIAL / OPEN VERIFICATION GATE: expiry/grace checks on resync/broadcast pass the current suite. QA raises check-then-send timing and untested exact TTL/grace/idle sweep. This is a static risk/test gap, **not a reproduced post-revocation disclosure**. Account for the existing immediate participant-socket disconnect mitigation; define the authorization/send linearization boundary under the approved policy and prove it with controlled tests. Do not invent a stricter retention policy or claim zero network race windows from another uncoordinated check.
- C1-RV-03 PARTIAL: unchanged lost-ack join count/identity is fixed in tested A/B flows; edited nickname payload/label is still open.
- C1-RV-04 PARTIAL: real-browser older-HTTP suppression passed, but coherent server snapshot construction is a different unresolved requirement.
- C1-RV-05 RESOLVED_TARGETED_BROWSER for the tested question transitions. Preserve its regressions; do not redo it merely because other groups remain open.

## Delivery hygiene observations
- The runner's `exec docker run` follows a shell EXIT cleanup trap, and `-e NAME=value` exposes its expanded DB configuration to local process arguments. Static observation only; no actual leak or orphaned directory is asserted. The Coordinator did not execute that runner; its verified alternative uses tracked source in container tmpfs and privately inherited environment.
- The running Mode A API writes to a tracked producer evidence log. Leave that live append unstaged; do not erase it or rewrite archived reports. The active coding tool should move live output to private/untracked storage and archive sanitized immutable snapshots safely.

## Next fix/retest contract
Continue the same authorized local C1 slice with the next unused producer run (R03 only if free), not a new bootstrap or stack. Reproduce the static scenarios before fixing and provide genuine RED-to-GREEN evidence through the active coding tool, plus both-mode current-build regression and targeted browser checks. Add tests for rejected GET, key-B dedup/replay/conflict, blocked write vs revoke/expiry, edited join payload, and coherent server snapshot interleavings. Complete or explicitly justify the WS lifetime gate; a green old suite is not enough.

Use the [current English fix prompt](../handoffs/C1-FIX-R02-EN.txt). Preserve prior results, protected dirty work, Thai product copy and single-writer handover rules. No automatic dispatch, application edit by Hermes, service restart, destructive reset, push/deploy, paid service or global configuration change occurred during this consolidation. Extra synthetic verification rows remain for traceability. User acceptance is still required after independent retest.
