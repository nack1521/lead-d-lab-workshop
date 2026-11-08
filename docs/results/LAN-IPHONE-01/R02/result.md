# LAN-IPHONE-01 / R02 — Follow-up guards for the private-HTTPS LAN mode

- **Task/run:** LAN-IPHONE-01 / R02 (`main`, build `df4b523`, not pushed)
- **Producer:** DeepSeek Harness (single active coding writer); baseline `3ab71c4`
- **Reported:** 2026-11-08T17:24:40+07:00 (Asia/Bangkok)
- **LAN URL:** `https://192.168.1.98:8443` (entry `/join`, code `ROOM-01`)
- **Status:** follow-up implementation/evidence **complete**; physical iPhone remains **BLOCKED_PENDING_USER_ACTION / NOT RUN**.

## Follow-up groups
| Group | Source | Status | Evidence |
|---|---|---|---|
| LAN-FU-01 | QA-LAN-01 | **PASS** | Bounded WS proxy: client frames checked before forwarding/queueing (4096-byte default), queue capped by frames+bytes (32 / 64 KiB), upstream connect deadline (5s), both sides released on denial/timeout/client close/upstream error; abnormal close mapping. Tests: healthy forward+Origin+reconnect, unavailable upstream → 1011, delayed handshake → 1013, oversize client frame → 1009, queue overflow → 1013. `tests/lan-guards.test.ts`. |
| LAN-FU-02 | QA-LAN-03 | **PASS** | One fail-closed selection rule for issuer and listener: public/wildcard/loopback/VPN/ambiguous/missing rejected; exact-SAN agreement required before bind. Unit tests with synthetic interfaces + real entry exit-2 checks (`WILDCARD_ADDRESS`, `ADDRESS_NOT_ON_INTERFACE`, `LOOPBACK_ADDRESS`). |
| LAN-FU-03 | LAN-COORD-01 | **PASS** | Verifier asserts required outcomes, requires a **strictly newer** fresh push revision (85→86), exercises the real poll-first stale rating **409 QUESTION_CLOSED**, restores the fixture and closes sockets in `finally`, and exits nonzero on failure (unavailable target test: exit 1, `ok:false`). Successful HTTPS run: exit 0, `failures: []`. |
| LAN-FU-04 | LAN-COORD-02/03 | **PASS (structural) / exact strict-Python retest NOT RUN** | Leaf renewed with strict-compatible extensions (AKI/SKI, critical `CA:FALSE`) while **retaining the CA identity** (CA hash unchanged). Exact-SAN parsing replaces substring matching; reuse requires exact IP+DNS SAN, retained-CA signature, strict extensions and non-expiring leaf; changed-address and short-validity renewal tested with isolated material. `openssl verify -x509_strict` OK, curl + Bun fetch 200. Host has no OpenSSL-3.5 strict Python, so the Coordinator's 3.14/3.5 strict-verification retest is NOT RUN here (limitation, not a claim). |
| LAN-DOC-01 | QA-LAN-02 | RESOLVED_CURRENT_DOCS preserved | README keeps trusted out-of-band public-CA transfer; no warning-bypass instruction reintroduced. Historical producer R01 immutable. |

Both-mode regression was rerun on the final HEAD `df4b523` (the ws.ts conditional-hook commit landed after `42e7bb8`; both runs pass).

## Re-verified LAN criteria
- LAN-01 PARTIAL (Mac topology/URL/commands verified; iPhone same-network membership still unconfirmed).
- LAN-02 **BLOCKED_PENDING_USER_ACTION / NOT RUN** (no physical iPhone Safari, no profile/trust installation; model/iOS/Safari unknown).
- LAN-03/04/05 PASS through the trusted HTTPS entry: join 201, rating 201 with Thai/emoji multiline comment, stable replay, own view coherent, facilitator poll open, poll 201, evil origin 403, participant→facilitator 403, missing auth 401, facilitator snapshot/live fresh push/reconnect over WSS, DB readback.
- LAN-06 PASS: Mode A **103 pass / 0 fail**, typecheck 0, default+LAN builds 0; Mode B Docker-only runner **0 fail, 4 skipped** (host openssl/active-cert/private-fixture tests skipped in archive-only container, reported as skipped); Mode B api+db restart healthy; no volume deletion.
- LAN-07 PASS: keys ignored/mode 600, private-path probes 404, only the LAN address:8443 listens on the LAN interface, DB stays loopback, dev-CA removal steps documented.

## Evidence
`evidence/`: `lan-guards.log`, `lan-verify.log` (ok:true, fresh push 85→86, stale 409), `cert-renewal.log` (CA identity preserved), `tls-and-verify-evidence.log` (curl/Bun/openssl strict), `entry-fail-closed.log` (exit 2 codes), `mode-a-regression.log`, `mode-b-regression.log`, `mode-b-evidence.log`, `build-*.log`.

## Remaining user actions (unchanged)
Install the public CA `.local/lan-certs/ca.crt` on the iPhone, enable full trust in Certificate Trust Settings, confirm the same private Wi-Fi, open `https://192.168.1.98:8443/join` in Safari with `ROOM-01`, record actual model/iOS/Safari/results, remove the dev CA afterwards. macOS may ask once to allow the Bun listener.

## Limits
- Exact OpenSSL-3.5 strict Python verification NOT RUN (no such interpreter; no global install). Structural AKI/SKI additions + LibreSSL strict verify + curl/Bun used instead.
- Mode B skips host-tooling-dependent LAN guards (reported as skipped, not passed).
- Physical iPhone, mobile/accessibility/load/security certification remain NOT RUN. C1 remains PARTIAL with C1-EG-01/02 evidence gates and is not accepted by this run.
