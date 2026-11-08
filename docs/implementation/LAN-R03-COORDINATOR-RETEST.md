# LAN R03 — Coordinator independent targeted retest

- Date: 2026-11-08 (+07). Producer report HEAD `a3b3ed241c963116a58c5c7d83368e10629f0854`; source `fdba66a8a0e3c849c8fc645bab59774d2b6c0e99` (LAN implementation `48a3930178e3d59665ee7198143d0702559bd41e`). C1-FU-01 remains resolved targeted; no new C1 run requested.
- **Verdict: TARGETED_RUNTIME_PASS / PEER_REVIEW_PENDING / PHYSICAL_DEVICE_PENDING.** Executed prior residual paths now pass as bounded below. This does not close all criteria before canonical static review or claim physical Safari/human acceptance.

## Actual execution
| Check | Actual result | Evidence |
|---|---|---|
| Native full regression | Exit 0, 107 pass / 0 fail / 509 expects; includes host slow-upstream and slow-downstream bounded loopback cases and fixture-based CLI test. | [ledger](evidence/LAN-R03-20261108/regression.json), [native log](evidence/LAN-R03-20261108/mode-a.log) |
| Docker-only regression | Exit 0, 100 pass / 0 fail / 7 skip / 478 expects; temporary source cleaned. Host tools/cert/private fixtures and raw slow-client timing are declared skips, not PASS. This is not full container slow-downstream coverage. | [Docker log](evidence/LAN-R03-20261108/mode-b.log) |
| Typecheck/builds | Typecheck includes lan/**/*.ts and passes. Default and LAN builds pass in private separate output directories; live dist unchanged. | [ledger](evidence/LAN-R03-20261108/regression.json) |
| Strict TLS and CA | Python 3.14.9/OpenSSL 3.5.9 default strict verifies HTTPS /ready 200; original CA fingerprint unchanged; no trust bypass/install. | [TLS](evidence/LAN-R03-20261108/tls-and-source.json) |
| Running source | LAN PID project cwd/entry checked; no relevant source file modified after its start. Commit timestamp alone is not a stale-process proof. No restart needed; API/C1 untouched. | [freshness](evidence/LAN-R03-20261108/process-freshness.json) |
| Issuer unsafe choices | Actual explicit 8.8.8.8 and 0.0.0.0, no test override: exit 2 and no generated files. | [issuer/CA](evidence/LAN-R03-20261108/issuer-and-partial-CA.json) |
| Partial CA identity | Isolated cert-only and key-only existing material: exit 2, survivor byte-for-byte unchanged, no other file created. Active material untouched; isolated keys removed after proof. | [issuer/CA](evidence/LAN-R03-20261108/issuer-and-partial-CA.json) |
| Real positive verifier | Exit 0, ok=true, control revision 125 equals pushed revision 125, expected question and DB total match; actual opened socket close events received; prior lifecycle restored exactly. | [positive output](evidence/LAN-R03-20261108/positive-verifier.json) |
| Failure after mutation | Real WSS refusal after successful HTTP operations: exit 1, ok=false and exact prior-state restoration true. | [failure output](evidence/LAN-R03-20261108/failure-after-mutation.json) |
| Poll prior state | Real poll-first rating returns 409 and exit 1 (no false green); prior poll restored exactly rather than forcing rating. Coordinator then explicitly returned synthetic room to its initial rating state. | [poll state](evidence/LAN-R03-20261108/poll-prior-state-failure.json), [final control](evidence/LAN-R03-20261108/fixture-returned-to-initial-rating.json) |

## Scoped group assessment
- LAN-FU-01: existing bounded pre-open/OPEN-side tests pass on the host; bounded source buffers are now checked in both directions. Docker skips raw slow-client case due host buffering/timing. No resource-exhaustion attack or performance/SLA claim.
- LAN-FU-02: actual unsafe explicit issuer inputs now fail before material creation; normal listener and prior invalid-bind/SAN evidence retained. Test-only issuer override is not exercised as production permission.
- LAN-FU-03: former false green, wrong fixed-rating restoration, frame/control/DB correlation and actual opened-socket cleanup pass the exercised paths. Unsupported lifecycle refusal is inspected, not exhaustively runtime-tested here; current helper is for reserved synthetic fixtures, not production workshop mutation.
- LAN-FU-04: original strict TLS/reuse successes retained; incomplete-pair refusal now exercised with preserved bytes. No active CA/key change or phone trust reset.
- C1 and LAN-DOC-01 prior resolutions retained. Canonical peer report will supply its own static/selected-test scope; this is not its work.

## Integrity, side effects and next gate
Captured baseline covers immutable LAN R03 producer artifacts, protected dirty shared progress/handoff and unattributed old R03 evidence; compare before committing. No app/test/config edits by Coordinator, database/volume reset, public tunnel, push/deploy, global install or OS/device/network trust change. Existing suite/verifier creates synthetic grants/participants/answers; room lifecycle left rating open. Only owned isolated certificate material was removed.

Prior unchanged C1 browser evidence is retained, not rerun as a new mobile result. Physical iPhone device/iOS/network/trust, actual Safari UI/WSS, full accessibility, 30-client load, other OS/socket-buffer behavior, reboot/crash recovery and exhaustive scheduler coverage remain NOT RUN/outside scope. Await canonical review; physical-device test then requires explicit user-assisted public-CA trust and real observed flows. No automatic next coding cycle.
