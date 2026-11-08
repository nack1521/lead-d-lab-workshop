# LAN R03 — Consolidated independent review

**CHANGES_REQUESTED: three narrower LAN groups remain. LAN-FU-04 is RESOLVED_TARGETED; C1-FU-01 and LAN-DOC-01 resolutions are retained.** No human/device acceptance or publication. Source `fdba66a8a0e3c849c8fc645bab59774d2b6c0e99`; producer report HEAD `a3b3ed241c963116a58c5c7d83368e10629f0854`.

## Grounded provenance
- [Canonical QA](../qa/LAN-R03-INDEPENDENT-RETEST.md): typecheck exit 0; selected loopback/address/slow-peer cases 10 pass / 0 fail / 5 filtered / 22 expects. No full suite/verifier/TLS/generator/Docker/device work attributed to QA.
- [Coordinator retest](LAN-R03-COORDINATOR-RETEST.md), archived in `3cab74fc4de30588e0943a3bd8ca97be4faae002`: native full 107/0/509, Docker-only 100/0/7 skip/478, typecheck/builds, default-strict Python TLS with unchanged CA, real invalid issuer refusal, both isolated partial-CA-pair refusals preserving survivor bytes, exact control/frame/DB correlation, poll-prior and failure-after-mutation restoration.
- Seven Docker skips remain skips, including host raw-slow-client timing. These successful paths are retained, not rewritten as failures.

## Three residual groups
| Group | Priority | Remaining branch / evidence class |
|---|---|---|
| LAN-FU-01 / R03-QA-01 | High per canonical QA | Pending queue flush sends client-to-upstream frames without the same OPEN-side budget guard; downstream send result is ignored. Pending queue is already finite. Need one consistent guarded forwarding path and explicit supported send-outcome handling. Static contract gap, no exploit/DoS/data-loss reproduction. |
| LAN-FU-02 / R03-QA-02 | Medium | LAN_ALLOW_TEST_ADDRESS override can target the default active certificate directory. Normal issuer validation passes; test-only permission must be confined to isolated material or removed from production CLI. Static local-config risk, not observed public exposure. |
| LAN-FU-03 / R03-QA-03 | Medium | Grant insertion precedes unsupported-state refusal; early failure can reopen an unchanged question and advance revision; connecting attempts are not in opened-socket cleanup. Need side-effect-free refusal/no-op lifecycle, and all-attempt close/settle. Exact post-mutation restoration and control/frame correlation already pass. Static harness residual, not observed application voting failure. |

Queue-flush direction is **client -> upstream** in the actual source; the QA narrative's downstream-budget wording must not be propagated into the fix. The source-default pending cap is finite and below the source-default OPEN upstream budget; the missing consistency matters for differing budgets and explicit send outcomes. Preserve canonical High priority, but do not assert an unbounded default queue or proven exploitation. Interpret Bun server send results using the actual supported API ([reference](https://bun.com/docs/api/websockets)); queued backpressure and dropped/failed sends are not interchangeable.

## Closed scope and next bounded action
LAN-FU-04 closure combines QA static review with Coordinator symmetric partial-pair/strict/reuse execution, not independent QA generation. Actual listener invalid-bind/SAN CLI refusal evidence is retained; improve helper-only automated startup coverage without pretending that no runtime check occurred.

Use [three-branch follow-up](../handoffs/LAN-R03-RESIDUALS.md) and [English prompt](../handoffs/LAN-R03-RESIDUAL-EN.txt). Expected next LAN run R04, recheck availability. Do not create another C1 run, redo certificate fixes, add product features or run broad new hardening outside these existing contracts. Keep immutable reports and successful evidence; no automatic coding dispatch.

Physical iPhone remains NOT RUN from retained evidence. User alone controls public-CA transfer/trust/removal and human acceptance. Coordinator has not stopped the private listener or changed OS/network settings. No publication, global install, TLS bypass, reset or application/test/config edit by this consolidation. Progress is recorded here because shared AI progress/original C1 handoff remain protected dirty work.
