# Evidence index — LAN-IPHONE-01 / R01

Sanitized evidence from commands actually run on build `f7b2006`. No grants, tokens, passwords, private keys or DB connection strings are stored here.

| Path | What it proves | Command / exit |
|---|---|---|
| `commands.txt` | Exact topology commands, LAN URL and safe-stop/return notes | shell flow, exit 0 |
| `lan-verify.log` | Through the trusted HTTPS entry to the real Mode A API/PostgreSQL: join, rating with Thai/emoji multiline comment, idempotent replay, own view, facilitator open poll, poll submission, exact-origin 201 + evil-origin 403 + role/session negatives 403/401, facilitator/participant WS, live push, reconnect snapshot, direct DB readback, fixture restore | `NODE_EXTRA_CA_CERTS=… bun lan/verify.ts`, exit 0 |
| `lan-05-06-07-evidence.log` | Same-origin LAN resolution (`api:""`, `wss://192.168.1.98:8443/ws`), relative asset references, no tunnel processes, loopback Mode A still usable, private keys ignored, private paths 404, only the LAN entry listens on the LAN interface, DB stays loopback | shell/curl flow, exit 0 |
| `mode-a-regression.log` | Current source Mode A suite: 91 pass / 0 fail | `bun test tests`, exit 0 |
| `mode-b-regression.log` | Same suite in a throwaway Docker container from committed source: 91 pass / 0 fail | `tests/run-in-docker.sh c1b_default`, exit 0 |
| `mode-b-evidence.log` | Mode B api+db restart healthy after runner | `docker compose -p c1b restart api db`, exit 0 |
| `build-lan-web.log` / `build-default-web.log` | LAN same-origin build and default build both succeed | `bun run build:web:lan` / `build:web`, exit 0 |
| `typecheck.log` | TypeScript check (empty output on success) | `bun x tsc --noEmit`, exit 0 |

Honest limits: physical iPhone Safari, CA profile installation/trust and the real phone network path are **NOT RUN / PENDING_USER_ACTION**; see `../result.md`.
