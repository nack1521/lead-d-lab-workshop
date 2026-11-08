# LAN-IPHONE-01 / R03 — Open-side backpressure, issuer validation and exact verifier restoration

- **Task/run:** LAN-IPHONE-01 / R03 (`main`, source HEAD `fdba66a`, not pushed)
- **Producer:** DeepSeek Harness (single active coding writer)
- **Reported:** 2026-11-08T18:22:16+07:00 (Asia/Bangkok)
- **LAN URL:** `https://192.168.1.98:8443` (entry `/join`, code `ROOM-01`)
- **Status:** residual guards fixed and verified; physical iPhone remains **BLOCKED_PENDING_USER_ACTION / NOT RUN**.

## Group dispositions
| Group | Source | Status | Actual evidence |
|---|---|---|---|
| LAN-FU-01 | R02-QA-LAN-01 (High) | **FIXED** | Post-OPEN both directions bounded with supported Bun APIs: server `getBufferedAmount()` caps upstream→client outstanding bytes; client `bufferedAmount` caps client→upstream. Exceed → close 1013 + release both sides. Pre-open frame/queue/byte caps + upstream deadline retained. Tests: slow raw client → bounded close with upstream released; slow raw upstream → client 1013; healthy/unavailable/delayed/oversize/queue cases still pass. |
| LAN-FU-02 | QA-LAN-03 | **FIXED** | Explicit `LAN_IP` is validated through the shared intended-private-address contract before issuing material; public/wildcard/loopback refusals exit 2 and generate zero files. Isolated test material opts in explicitly (`LAN_ALLOW_TEST_ADDRESS=1`); production checks are not weakened. Listener SAN/startup refusal retained. |
| LAN-FU-03 | R02-QA-LAN-02 | **FIXED** | Verifier snapshots prior fixture lifecycle, refuses unsupported states without mutation, restores exactly via the approved control API and asserts active/receiving/closed state; fresh push must match the exact control revision (118), active question and DB aggregate total; opened sockets are closed and awaited; failure exits nonzero; standalone `lan/*` CLIs are covered by typecheck. |
| LAN-FU-04 | R02-QA-LAN-03 | **FIXED** | Partial CA pair fails closed (exit 2, surviving component untouched) while a wholly absent pair still initialises; healthy non-forced rerun actually reuses leaf+key (hash-equal, tested); strict TLS (AKI/SKI, critical CA:FALSE), exact-SAN renewal and the unchanged CA identity are preserved. |
| LAN-DOC-01 | QA-LAN-02 | RESOLVED_CURRENT_DOCS preserved | trusted out-of-band public-CA transfer instructions unchanged; immutable reports untouched. |

## Executed checks (exact commands / exits)
- `bun test tests` (Mode A): **107 pass / 0 fail**, 509 expect, 12 files — exit 0.
- Mode B Docker-only runner (`tests/run-in-docker.sh c1b_default`): **100 pass / 7 skip / 0 fail** (479 expect) — exit 0. Skips are host-tooling/raw-socket cases only (no openssl, no active cert, no private fixtures, raw slow-client buffering), reported as **skipped, not passed**.
- `bun x tsc --noEmit -p tsconfig.json` (now includes `lan/**/*.ts`): exit 0.
- `bun run build:web` / `bun run build:web:lan`: exit 0.
- `NODE_EXTRA_CA_CERTS=… bun lan/verify.ts` through trusted HTTPS entry: **exit 0**, `failures: []`; prior state captured and `fixture_restored_exactly: true`; fresh push `control_revision 118 = pushed_revision 118`, question matches, DB rating total matches; all opened sockets closed.
- Issuer CLI: `LAN_IP=8.8.8.8` and `LAN_IP=0.0.0.0` generation → exit 2, 0 files. Strict TLS unchanged: curl 200, Bun fetch 200, `openssl verify -x509_strict` OK, CA fingerprint unchanged.
- Mode B api+db restart: ready 200.

## Preserved / unchanged
C1 remains untouched (C1-FU-01 RESOLVED_TARGETED preserved, no C1 R06); strict TLS, CA identity, leaf reuse/renewal, pre-open guards, exact Origin/auth/role/session semantics, receipt/idempotency/join/UI contracts and aggregate privacy unchanged. Protected dirty work, immutable R01/R02/C1/QA/Coordinator reports and the R02 live-log append were not modified or staged.

## Remaining user actions (physical iPhone still pending)
1. Confirm the iPhone is on the same private Wi-Fi as 192.168.1.98 (no guest isolation/VPN conflict).
2. Transfer **only** the public CA `.local/lan-certs/ca.crt` (AirDrop/email; never a private key).
3. Install the profile and enable **full trust** (Settings → General → VPN & Device Management, then Settings → General → About → Certificate Trust Settings).
4. Allow the Bun listener if macOS prompts for incoming connections.
5. Open `https://192.168.1.98:8443/join` in Safari, use `ROOM-01`, and record actual iPhone model/iOS/Safari, trust state and observed flows.
6. Remove the development CA profile after testing.

## Limits
- Physical iPhone Safari, certificate installation/trust and real-network phone path are **NOT RUN / PENDING_USER_ACTION**; desktop/API/CLI checks are not Safari proof.
- Mode B skips host-tooling/raw-socket cases (7) — explicitly separated from passes.
- Slow-peer bounds are exercised with controlled raw sockets; no memory-exhaustion/load test on the live listener, no exploit claimed.
- Mobile/accessibility/load/security certification and C1 acceptance remain NOT RUN; no public deployment/tunnel.
