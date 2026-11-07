# C1 local build — Coordinator targeted browser retest R02

**Targeted outcome:** C1-RV-03 and C1-RV-05 no longer reproduce in the tested real-browser flows. This is not C1 acceptance, a full security review, or closure of the other review groups; canonical Senior QA retest is separate.

- Submitted report HEAD: `97a47605bc827c6b8f0a860fbfa8a8c5df6ebc39`; application/build: `da30003a805cc6b0e133bdc9ac94ae001419e488`.
- Mode B worktree is at the same application commit; report-only changes do not change that source baseline.
- Actor: lead-d-setup, non-coding Coordinator. Targets: Mode A web/API `127.0.0.1:5173/3000`; Mode B `127.0.0.1:5174/3001`. All four endpoints returned 200.
- Evidence directory: [C1-RETEST-R02](evidence/C1-RETEST-R02/). Existing R01 evidence remains separate.

## Targeted finding results

| Group | This review's result | Actual evidence |
|---|---|---|
| C1-RV-03 / QA-C1-03 / C1-UI-02 | RESOLVED_BROWSER_DB in both modes | Drop the join response after actual server acceptance, retry the unchanged form: request payload/key and participant identity stay the same. Direct DB count goes from 5 to 6 in each mode, not 5 to 7; exactly one synthetic participant per logical join. |
| C1-RV-05 / C1-UI-01 | RESOLVED_BROWSER for tested transitions | In A and B, save rating, open poll through the authorized fixture API, observe no false saved banner and usable poll controls, then save poll. In B, return to the answered rating: score 3, saved state and read-only fields are restored. |
| C1-RV-04 / QA-C1-04 | PARTIAL_BROWSER supplement | In B, close the owned socket, hold a real `/api/me` response at revision 8, reconnect and receive authoritative rating state at revision 9, then release the older HTTP response. The UI stays on question 01 with the correct saved rating; two real socket instances observed. Facilitator browser Live/join-count rendering was not tested here. |
| C1-RV-01 / QA-C1-01 | PARTIAL_BROWSER supplement | A 501-character comment is rejected without truncation. Explicit fresh attempt permits correction. After actual HTTP 201, drop the submission acknowledgement and incoming participant state frames: UI shows unknown, no fresh-attempt action, and keeps the multiline draft. Reconcile with the same key yields saved and one accepted rating row/receipt. This does not prove all delayed-original interleavings. |
| C1-RV-02 / QA-C1-02 | Existing real-DB/WS regressions executed; await canonical QA verdict | The new expiry/grace/broadcast regression cases are part of both 71-test runs. No independent timing-boundary/idle-sweep certification is claimed by this browser review. |

## Independent current-build execution

[Coordinator regression output](evidence/C1-RETEST-R02/coordinator-regression.json):
- `bun test tests` (Mode A): **71 pass / 0 fail**, exit 0, nine files.
- `bun run typecheck`: exit 0.
- Mode B: tracked source at `da30003` streamed through `git archive` into tmpfs in the pinned Bun base image; frozen install and existing tests inside Docker on the Mode B DB network: **71 pass / 0 fail**, exit 0, nine files. No host Bun/node_modules, credential-directory mounts, production-image edits or published ports.
- Existing test helpers create/drop only their own unique `c1_test_*` databases; no application DB reset or service restart was performed by this reviewer.

## Browser and DB evidence

- [Browser ledger](evidence/C1-RETEST-R02/browser-ledger.jsonl), [control snapshots](evidence/C1-RETEST-R02/control-ledger.jsonl), [DB readbacks](evidence/C1-RETEST-R02/db-ledger.jsonl).
- Both synthetic participants have exactly two accepted responses and two accepted receipts (rating and poll). Mode B additionally has one durable rejected receipt from the over-limit attempt. Stored rating comments contain a newline in both modes.
- Native Enter inserts a newline, HTML-like synthetic text renders literally, saved answers become read-only, and a blank optional poll comment is accepted. Captured error hooks reported no participant errors during the recorded successful flows; this is not a complete console audit.
- Screenshots: [A saved rating](evidence/C1-RETEST-R02/A-rating-saved.png), [A saved poll](evidence/C1-RETEST-R02/A-poll-saved.png), [B reconciled rating](evidence/C1-RETEST-R02/B-reconcile-saved.png), [B return after stale HTTP](evidence/C1-RETEST-R02/B-return-rating-stale-HTTP-rejected.png).

## Limitations, cleanup and progress

- Fault instrumentation discarded or delayed real responses/frames; it never fabricated server success. Browser fetch wrappers and state-drop flags were restored. No credential was typed into a browser form; authorized fixture grants were read privately for local API control and never recorded in evidence.
- The attempted return-to-rating observation in the old Mode A browser context had no expected DOM and is **INCONCLUSIVE**, not PASS or an application failure. The corresponding return transition and controlled stale-HTTP/reconnect case were successfully observed in Mode B.
- Both ROOM-01 fixtures finish with rating question 01 open. Synthetic records remain for traceability; no rows or volumes were deleted. Application source/tests/config were not modified by Hermes.
- Facilitator authenticated browser interaction, physical mobile, full accessibility, load/30-client SLA, actual crash-before-broadcast, deterministic close/submit order and the complete lifetime boundary matrix remain outside this executed browser subset.
- A running Mode A API process appended three TimeoutNegativeWarning lines to its already-tracked producer `R02/evidence/mode-a-api.log`. The original two-line prefix is intact. This live-log append is left unstaged, not overwritten or presented as a deliberate edit to producer history; future deliveries should snapshot logs rather than keep a tracked evidence file as a live sink.
- Protected AI-PROGRESS/original C1 handoff are preserved; progress is recorded here. No tool dispatch, push/deploy, paid service or global configuration change occurred. Canonical QA's separate retest has not yet been consumed when this report is authored.

Next gate: consolidate canonical QA with these targeted observations; preserve unresolved IDs and limits, then request user trial/acceptance only when justified. No old PASS or producer FIXED label automatically closes a finding.
