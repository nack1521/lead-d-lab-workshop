# LAN-IPHONE-01 / R01 — Private-Wi-Fi HTTPS iPhone test mode

- **Task:** LAN-IPHONE-01 (private-Wi-Fi device testing, not public deployment)
- **Run:** R01 (first run for this task)
- **Reported at:** 2026-11-08T15:41:00+07:00 (Asia/Bangkok)
- **Producer:** DeepSeek Harness (single active coding writer); previous C1 R04 run was committed/checkpointed before this task
- **Build HEAD:** `f7b2006` (`main`, not pushed); docs commit follows
- **Task status:** **BLOCKED_PENDING_USER_ACTION for the iPhone test**; the LAN mode itself is implemented and verified with real HTTPS API/PostgreSQL/native-WS evidence. Physical Safari steps were **NOT RUN**.

## Chosen topology

```
iPhone / Mac browser
  https://192.168.1.98:8443   (private LAN, project CA)
        │  TLS (Bun, project-local cert; bind only to the LAN address)
        ▼
  lan/lan-entry.ts  ── one HTTPS entry ──► web (apps/web/dist, same-origin LAN build)
        │                                   /api, /health, /ready → http://127.0.0.1:3000
        │                                   /ws (Origin preserved) → ws://127.0.0.1:3000/ws
        ▼
  existing native Mode A API (Elysia/Bun, single authority) → PostgreSQL 127.0.0.1:5433
```

- Backing authority: **Mode A** API on `127.0.0.1:3000`; participant and facilitator use the same authority/database.
- The LAN listener binds **only** to `192.168.1.98:8443` (en0, gateway 192.168.1.1); API/DB remain loopback. No public tunnel, port-forward or cloud resource; no tunnel processes were running.
- The LAN bundle is built with empty `VITE_*` (tracked `.env.lan`), so an HTTPS page resolves API/WSS **same-origin**; no loopback or observed-IP API base is baked into phone traffic. The only `127.0.0.1` strings left in the bundle are the unchanged non-secure (HTTP) fallback used by local Mode A.
- Exact origins allowed: `http://127.0.0.1:5173` (existing local Mode A) and `https://192.168.1.98:8443` (LAN). No wildcard. WS first-message auth, role/session isolation and origin negatives unchanged.
- Development CA and server certificate (SAN `IP:192.168.1.98`, `DNS:MacBook-Air-khxngAraya.local`) are project-local under ignored `.local/lan-certs`; keys are mode 600, never served or committed. Only the public CA certificate is transferable.
- If the LAN IP changes: rerun `bun run lan:certs` (regenerates a matching SAN) and update the exact `ALLOWED_ORIGINS` entry.

## LAN-01 — topology, URL and commands: **PARTIAL (Mac side verified; iPhone network membership unknown)**
- LAN URL: **`https://192.168.1.98:8443`** (`/join` entry). Health: `GET /lan-health` → 200 `{"status":"ok","mode":"lan-https","upstream":"http://127.0.0.1:3000"}`.
- Interface `en0`, IPv4 `192.168.1.98`, default gateway `192.168.1.1`; no public tunnel or port-forward; DB/API not exposed on the LAN interface.
- Commands/exit codes: see `evidence/commands.txt` (`lan/generate-certs.sh` 0, `build:web:lan` 0, API start 0 with ready 200, `lan/lan-entry.ts` 0, verification 0).
- iPhone on the same trusted private network: **unknown / pending user confirmation** — no fabricated claim.

## LAN-02 — real iPhone Safari with trusted HTTPS: **BLOCKED — PENDING_USER_ACTION (NOT RUN)**
- Not executed by this writer: no physical iPhone Safari run, no certificate profile installation and no SSL trust change was performed. Installing/trusting the project CA on the iPhone is an explicit user action.
- Secure-context requirement matters: the app relies on `crypto.randomUUID`; Safari must have a trusted HTTPS origin.
- iPhone model / iOS / Safari version: **unknown** (not supplied or observed).

## LAN-03 — anonymous join, rating/poll, Thai/emoji multiline comment through the real API/DB: **PASS (through the HTTPS entry; phone UI part NOT RUN)**
- Executed via the trusted HTTPS entry with synthetic data: join 201 (stored label `ผู้ร่วมทดสอบ LAN`), rating 201 (`rating: 4`, multiline Thai + emoji comment preserved), unchanged retry 200 with `replay: true`, own view 200 with matching question/revision, facilitator open poll 200, poll submission 201 (`option_id: "time"`).
- Direct PostgreSQL readback (Mode A DB container) confirmed committed rows; expected counts are in `evidence/lan-verify.log`.
- Attempt/idempotency/unknown rules unchanged (no code path changed).

## LAN-04 — separate facilitator context on the same authority: **PASS (HTTPS/WS; browser UI NOT RUN)**
- A separately authenticated facilitator WebSocket over `wss://192.168.1.98:8443/ws` received the committed snapshot (counts only), a live pushed snapshot after a commit, and an authoritative snapshot after reconnect (revision shown in evidence). Facilitator grants were minted privately and never printed or stored in evidence.

## LAN-05 — intended LAN HTTPS/WSS origin, no loopback/mixed content, negatives still fail: **PASS (automated); real-browser network panel NOT RUN**
- HTTPS page same-origin resolution verified: empty `VITE_*` → `{api: "", ws: "wss://192.168.1.98:8443/ws"}`; served bundle references relative `/assets/...`; asset 200.
- Allowed exact Origin join 201; `https://evil.example` join 403; participant token on a facilitator route 403; missing auth 401.
- No HTTP downgrade path was added; the LAN entry is TLS-only.

## LAN-06 — existing modes, builds and safe stop: **PASS**
- `bun test tests` (Mode A) **91 pass / 0 fail**; `bun x tsc --noEmit` exit 0; default and LAN production builds exit 0.
- Mode B: images rebuilt from `f7b2006`; separate Docker-only runner `tests/run-in-docker.sh` **91 pass / 0 fail**; api+db restart → ready 200.
- Loopback-only Mode A still serves `/join` 200 and API health 200 after the LAN build. Database state preserved; no volume deleted, no `down -v`/prune.
- Return to loopback-only: stop `lan/lan-entry.ts` (Ctrl-C); API/web/db continue on loopback. Normal stop only.

## LAN-07 — key privacy, private files, exposure, removal: **PASS**
- `git check-ignore` confirms `.local/lan-certs/*.key`, `.local/fixtures.json` ignored; `.env.lan` is tracked intentionally and contains only public empty settings; key files are mode 600.
- Through the LAN entry: `/.env`, `/../.env`, `/.local/lan-certs/server.key` → 404; `/lan-ca.crt` → 200 `application/x-x509-ca-cert` (public certificate only).
- Only `bun 192.168.1.98:8443` listens on the LAN interface; PostgreSQL remains `127.0.0.1:5433`.
- Certificate removal: on the iPhone delete the profile under Settings > General > VPN & Device Management (removes the CA and its trust); no Mac keychain trust change was made. Certificates are development-only.

## Changed paths
`lan/lan-entry.ts`, `lan/generate-certs.sh`, `lan/verify.ts`, `.env.lan`, `.gitignore`, `package.json`, `apps/web/src/api.ts`, `README.md`, plus this run's docs. No API/auth/idempotency/privacy behavior changed; no C1 result changed.

## Pending user actions (phone test remains BLOCKED until completed)
1. Confirm the iPhone is on the same private Wi-Fi (not guest/isolated, no VPN conflict) as `192.168.1.98`.
2. Transfer **only** the public CA certificate `.local/lan-certs/ca.crt` (AirDrop/email, or `https://192.168.1.98:8443/lan-ca.crt` after proceeding past the initial warning). Never transfer `ca.key`/`server.key`.
3. Install the profile on the iPhone: Settings > General > VPN & Device Management.
4. Enable trust separately: Settings > General > About > Certificate Trust Settings > full trust for "Lead+D Lab LAN Development CA" ([Apple guidance](https://support.apple.com/en-us/102390)).
5. If macOS asks whether to allow `bun` to accept incoming connections, that is the user's firewall decision (this task changed no firewall/router setting).
6. Open `https://192.168.1.98:8443/join` in Safari with code `ROOM-01`; report/record the actual iPhone model, iOS and Safari version and the steps performed. Do not install this development CA beyond device testing; remove it afterwards.

## Limits
- No physical iPhone execution, no mobile certification, no load/30-client SLA, no full accessibility/security certification.
- The LAN CA is a development-only local CA; IP-based SAN means a DHCP address change requires certificate regeneration.
- Guest-network/AP isolation, VPNs and firewall prompts can block LAN access; these were not changed and were not verified against the phone.
- macOS firewall inbound-prompt status was not verified; the user may need to allow the Bun listener once.
- C1 remains **PARTIAL** with C1-EG-01/02 evidence gates unchanged; this LAN run neither closes nor reinterprets C1 acceptance.

## Evidence
- [evidence index](evidence/README.md), `lan-verify.log`, `lan-05-06-07-evidence.log`, `mode-a-regression.log`, `mode-b-regression.log`, `mode-b-evidence.log`, `build-*.log`, `commands.txt`.
- No grants, tokens, passwords, private keys or DB connection strings are present in this record.
