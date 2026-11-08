# C1 R05 + LAN R02 — Consolidated targeted review

**C1-FU-01: RESOLVED_TARGETED. LAN: CHANGES_REQUESTED.** No human acceptance/publication. Source `df4b52352786784cd71a62d4b5a3d92fac571d35`, producer report HEAD `1eb31f48101dcf34198177e64ae1127778ad60d3`; Coordinator runtime archive `f0310f154044f26abf752739558a81d9b38baf82`.

## Evidence ownership
- [Senior QA](../qa/C1-R05-LAN-R02-INDEPENDENT-RETEST.md): safe C1 subset 92/0/460 expects; selected LAN loopback/address cases 8/0 with 3 filtered; typecheck 0. Full host suite and certificate generation filtered to honor no-verifier/no-known-fixture-write scope. These are not the full-suite counts.
- [Coordinator](C1-R05-LAN-R02-COORDINATOR-RETEST.md): full native 103/0/493; Docker-only 99/0/4 skipped/478; typecheck/builds 0; real current participant browsers/DB, default-strict Python TLS, certificate lifecycle and verifier failure checks. The full native suite can mint a synthetic fixture grant through its CLI subprocess; this side effect is disclosed.

## Retained successful work
C1 controlled concurrency observed three already-admitted frames, corrected the unsupported single-frame maximum and kept later denial/4401; existing equality/revoke/snapshot cases pass. No new auth policy, zero-race promise or demonstrated disclosure. Do not reopen C1 for LAN-only work.

Coordinator additionally closes the original strict-client/reuse failures: default-strict Python/OpenSSL now verifies the live entry, CA fingerprint unchanged; actual non-forced same-SAN script rerun reused leaf/key, and changed-SAN replacement retained its isolated CA. This supplies evidence absent from QA's filtered certificate tests without rewriting that report. Likewise actual invalid selected-SAN CLI rejection supplies the listener-startup evidence that QA's helper-only test did not establish.

## Four remaining LAN groups
| Group | Priority | Remaining scope and evidence class |
|---|---|---|
| LAN-FU-01 / R02-QA-LAN-01 | High | OPEN-side upstream/downstream buffering/backpressure is not explicitly bounded/handled. Pre-upstream queue/frame/deadline cases pass. Static availability risk; no exploit/resource-exhaustion or leak demonstrated. |
| LAN-FU-02 / QA-LAN-03 | Medium | Explicit issuer LAN_IP bypasses shared address selection. Runtime listener rejection is already verified; do not conflate issuer validation with current public exposure. |
| LAN-FU-03 / R02-QA-LAN-02 | Medium | Restore the actual prior controlled state (or refuse unsupported state before mutation), correlate frame with the exact committed control revision/payload and DB rows. Fix raw-WebSocket/wrapper cleanup mismatch and include standalone CLI types in typecheck. Original false green/exit failure paths already retest correctly. Static residuals, not proven voting failure. |
| LAN-FU-04 / R02-QA-LAN-03 | Medium | A partial existing CA pair must fail closed rather than silently replacing identity. Strict TLS/real leaf reuse are already verified; preserve those fixes and existing device trust. Static recovery-path risk, no active CA replacement observed. |

[Machine dispositions](evidence/C1-R05-LAN-R02-20261108/consolidated-triage.json) retain original IDs and distinguish passed subpaths from remaining contracts. LAN-DOC-01 remains RESOLVED_CURRENT_DOCS. Static concerns are not inflated into exploit/Safari failure claims.

## Next bounded action
Use [LAN-only residual contract](../handoffs/LAN-R02-RESIDUALS.md) and [English prompt](../handoffs/LAN-R02-RESIDUAL-EN.txt). Next unused LAN-IPHONE-01 run is expected R03; recheck at start. Do not create another C1 fix run unless an actual C1 code change is justified. Preserve successful evidence and immutable reports; no bootstrap/reset or broadened release criteria.

Physical iPhone remains NOT RUN/PENDING_USER_ACTION from available evidence. Fix remaining LAN safeguards before further device testing; user alone authorizes public-CA installation/trust/removal. The Coordinator has not stopped the LAN listener or changed OS/network trust. Future real-device evidence must identify the actual source, device/iOS, network/trust and observed flows; desktop/API automation is not Safari proof.

Progress: read and archive the independent retest unchanged; consolidate it with Coordinator runtime proof rather than relabeling filtered work as PASS; narrow the next task to LAN only. No new app/test/config edit, deployment, public tunnel, push or automatic coding dispatch.
