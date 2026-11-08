# C1 R04 + LAN R01 — Consolidated independent review

Status: **CHANGES_REQUESTED**, not acceptance. Source app `f7b2006db0e9e161278c5080129f8409d6c8d1bf`, C1 seam/test base `62bfa8d54c4f01a54a2d08648032637c16f6e850`; reviews observed report HEAD `d2d09c29ef8a020d06348407a8e8493085394604`. Coordinator docs correction is `23aff9ba098e9ad19bd1e9c700b00138d401d4f8`. Model identity remains producer-reported, not independently attested.

## Preserved successful evidence
- [Senior QA](../qa/C1-R04-LAN-R01-INDEPENDENT-REVIEW.md): independent Mode A `bun test tests` exit 0, 91 pass / 0 fail / 455 expects; `bun run typecheck` exit 0. Reviewer ran no Docker/browser/LAN verifier or known ROOM fixture mutations.
- [Coordinator runtime/browser](C1-R04-LAN-R01-COORDINATOR-REVIEW.md): independent Mode B 91/0/455, production/LAN builds exit 0, participant browser A/B, real DB readback, LAN HTTPS/API and a strictly fresh facilitator WSS frame after commit.
- C1-EG-01 controlled HTTP/WS coherent old/new views PASS. C1-EG-02 specified single-send/revoke/expiry/equality cases PASS. Neither is an exhaustive scheduler proof. The general one-in-flight-frame statement remains unestablished under concurrent sends (C1-FU-01); do not erase passing schedules or claim a reproduced post-revoke leak.

## Consolidated work
Seven source IDs map to six groups: five active follow-up groups cover six source IDs (one High / four Medium groups); one current-documentation group is resolved. These are not five runtime-proven product defects. Exact grouping is in the [machine triage](evidence/C1-R04-LAN-R01-20261108/consolidated-triage.json).

| Group | Sources | State / priority | Required outcome |
|---|---|---|---|
| LAN-FU-01 | QA-LAN-01 | OPEN / High, static availability risk | Explicit bounded pre-upstream frames/queues/bytes/deadlines/backpressure and correct deny/close cleanup, with bounded delayed/unavailable-upstream tests. No exploit/load claimed. |
| C1-FU-01 | QA-R04-01 | OPEN / Medium, contract/evidence | Controlled concurrent resync/broadcast sends; accurately delimit the in-flight assurance under the existing auth decision point. No zero-race or new policy by implication. |
| LAN-FU-02 | QA-LAN-03 | OPEN / Medium, static exposure risk | Fail closed on public/wildcard/VPN/ambiguous/missing selection; selected private interface/address and certificate SAN agree. No current public exposure claimed. |
| LAN-FU-03 | LAN-COORD-01 | OPEN / Medium, reproduced verifier defect | Required failure statuses and exceptions cannot produce success/exit 0; fresh-push predicate excludes the cached initial frame. |
| LAN-FU-04 | LAN-COORD-02/03 | OPEN / Medium (source Low portability also retained) | Standards-compatible strict TLS and portable exact-SAN reuse/renewal; retain CA identity. Strict Python rejects current leaf, normal curl/Bun pass; Safari impact unknown. |
| LAN-DOC-01 | QA-LAN-02 | RESOLVED_CURRENT_DOCS | README now uses trusted out-of-band PUBLIC CA transfer with no warning bypass. Historical producer R01 is immutable and its conflicting suggestion is superseded. |

## Scope and next gate
Use [narrow follow-up contract](../handoffs/C1-R04-LAN-R01-FOLLOWUP.md) and [English prompt](../handoffs/C1-R04-LAN-R01-FIX-EN.txt). Start with LAN proxy guards, not a generic rewrite. Preserve all finding/case IDs, receipt/join/UI resolutions and the approved lifetime semantics. If a stronger in-flight policy is needed, obtain a decision instead of changing it silently.

Physical iPhone remains NOT RUN / PENDING_USER_ACTION: model/iOS/network/trust and real Safari results are unknown from retained evidence. This gate is distinct from source fixes. Recommend fixing the LAN High guard before further device testing; Coordinator has not stopped/reconfigured the listener, installed a CA or changed firewall/router/trust. No deployment, public tunnel, push or acceptance.

Progress: archived the canonical Senior QA report verbatim, merged only findings supported by their stated evidence, preserved immutable producer/Coordinator reports and protected dirty shared progress, and prepared a user-operated copy prompt. No application/test/config changes. A final Coordinator rerun also confirmed the existing Mode A suite and typecheck; actual commands/exits are in [confirmation](evidence/C1-R04-LAN-R01-20261108/coordinator-final-confirmation.json).
