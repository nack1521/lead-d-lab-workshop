# LAN-IPHONE-01 / R04 — Three LAN branches closed together

- **Task/run:** LAN-IPHONE-01 / R04 (`main`, source HEAD `68e8670`, not pushed)
- **Producer:** DeepSeek Harness (single active coding writer)
- **Reported:** 2026-11-09T07:52:18+07:00 (Asia/Bangkok)
- **LAN URL (current network):** `https://192.168.4.97:8443` (entry `/join`, code `ROOM-01`)
- **Status:** three residual branches fixed and verified; physical iPhone remains **BLOCKED_PENDING_USER_ACTION / NOT RUN**.

## Group dispositions
| Group | Source | Status | Actual evidence |
|---|---|---|---|
| LAN-FU-01 | R03-QA-01 (High) | **FIXED** | One shared guarded client→upstream forwarding path used by both the pending-queue flush and ordinary sends; the same OPEN-side byte budget applies per queued frame. Explicit send outcomes distinguish backpressure from closed/dropped (Bun client `send()`→undefined + `bufferedAmount`; server `send()` byte count + `getBufferedAmount()`). Test with queue cap larger than a deliberately smaller OPEN budget (250 queued frames, 1 KiB budget) closes 1013 with cleanup; direct/slow-reader paths remain bounded. |
| LAN-FU-02 | R03-QA-02 | **FIXED** | Test-only address override now requires an explicit isolated `LAN_CERT_DIR` and refuses the active/default directory, aliases and nested paths; override targeting active storage exits 2 without changing active cert/key bytes. A real CLI start against an existing but mismatched retained SAN exits 2 with the documented message. Normal unsafe-address refusal retained. |
| LAN-FU-03 | R03-QA-03 | **FIXED** | Pure supported-state preflight runs before any grant creation or lifecycle mutation (ended/no-active/multiple-receiving/active-mismatch/closed_at states refused without changes). Grant is created only after preflight + health pass; early failure does not reopen or advance a question. Every connection attempt (CONNECTING and OPEN) is tracked, timers cancelled, late auth blocked after disposal, and incomplete cleanup is reported as failure. Post-mutation exact restoration and control-revision/DB correlation remain (control revision 146 = pushed revision, question + DB total match). Control-action comment corrected. |
| LAN-FU-04 / C1-FU-01 / LAN-DOC-01 | previous | RESOLVED/preserved | CA identity, strict TLS, leaf reuse/renewal, C1 concurrency resolution and current docs unchanged. |

## Network/certificate note
The private LAN address changed between runs (now `192.168.4.97`, previous evidence used 192.168.1.98). The entry correctly refused to start with the stale SAN (evidence `entry-san-mismatch-refusal.log`), the leaf was renewed for the exact new address while the **CA identity was preserved** (fingerprint prefix `e2a52e8d7939d0c3`), and the API allowlist was updated for the new exact origin. Previous immutable reports retain their historical URLs and are not rewritten.

## Executed checks (exact commands / exits)
- `bun test tests` (Mode A): **113 pass / 0 fail**, 531 expect, 12 files — exit 0.
- Mode B Docker-only runner: **113 tests, 104 pass / 0 fail, 9 skip** (493 expect) — exit 0. Skips are host-tooling/raw-socket/fixture-dependent cases only (list in `evidence/mode-b-skips.txt`), declared as skips, not passes. Mode B api+db restart ready 200.
- `bun x tsc --noEmit -p tsconfig.json` (covers `lan/**/*.ts`): exit 0.
- `bun run build:web` / `build:web:lan`: exit 0.
- Trusted HTTPS verifier (`NODE_EXTRA_CA_CERTS=… LAN_ORIGIN=https://192.168.4.97:8443 bun lan/verify.ts`): **exit 0**, `failures: []`; preflight supported, exact restoration true, fresh push = control revision 146 with matching question/DB total, 3/3 socket attempts settled.
- Strict TLS: curl 200, Bun fetch 200, `openssl verify -x509_strict` OK, CA fingerprint unchanged.
- Branch tests: `tests/lan-guards.test.ts` **21 pass / 0 fail** on host (flush budget, direct budget, slow peers, issuer confinement/mismatch CLI, preflight states, CONNECTING/OPEN cleanup, incomplete-cleanup failure).

## Preserved / unchanged
C1 not rerun (C1-FU-01 stays resolved); no C1 R06. Origin/auth/role/session, receipt/idempotency/join/UI contracts, aggregate privacy, strict TLS/CA identity and immutable R01–R03/C1/QA/Coordinator reports unchanged. Protected dirty work, R02 live-log append and unattributed evidence untouched.

## Remaining user actions (physical iPhone pending)
1. Confirm the iPhone is on the same private Wi-Fi as `192.168.4.97` (no guest isolation/VPN conflict).
2. Transfer only the public CA `.local/lan-certs/ca.crt` (never a private key).
3. Install the profile and enable full trust (Settings → General → VPN & Device Management, then About → Certificate Trust Settings).
4. Allow the Bun listener if macOS prompts.
5. Open `https://192.168.4.97:8443/join` in Safari with `ROOM-01`, record actual iPhone model/iOS/Safari/trust and observed flows.
6. Remove the development CA profile after testing.

## Limits
- Physical iPhone Safari/trust/network path **NOT RUN / PENDING_USER_ACTION**; desktop/API/CLI is not Safari proof.
- Mode B skips (9) declared; no memory-exhaustion/load test on the live listener; slow-peer tests use low-resource isolated loopback peers.
- C1 acceptance and mobile/accessibility/load/security certification remain NOT RUN; no public deployment/tunnel.
