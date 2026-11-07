# C1 local build — Executive report (R01)

Status: **READY_FOR_REVIEW** — implementation and current-build execution evidence exist. This is the coding-tool self-report, not independent QA or human acceptance. Canonical detail: [C1-LOCAL-BUILD / R01](../results/C1-LOCAL-BUILD/R01/result.md). Machine summary: [result.json](../results/C1-LOCAL-BUILD/R01/result.json). Evidence: [R01 evidence index](../results/C1-LOCAL-BUILD/R01/evidence/README.md).

## Baseline and provenance
- Task `C1-LOCAL-BUILD`, run `R01`, branch `main`.
- Start HEAD `e92e96a`; report HEAD `c5ed399` (6 local commits, not pushed).
- Producer: **DeepSeek Harness** (single active coding writer). Model `deepseek-v4.1-flash-1017` is the runtime-reported id and remains unverified.
- Protected dirty files `docs/AI-PROGRESS.md` and `docs/handoffs/ANTIGRAVITY-C1.md` were not staged or modified (hashes unchanged).

## What was built
React (Vite) participant/facilitator UI, Elysia API on Bun, real PostgreSQL, authenticated native WebSocket, one API instance. Vertical flow: join without an account → answer a rating or poll question with optional comment → single-transaction commit with a stable idempotency receipt → facilitator sees the committed aggregate over an authenticated socket → accepted data and receipts survive reconnect and process/container restarts.

Decisions kept deliberately small: postgres.js + SQL migrations instead of an ORM (Drizzle was a proposal only), manual explicit CORS instead of an extra plugin, opaque hashed grants with Bearer auth and first-message WS auth, session-row locking for close/submit ordering, and client attempt/revision rules as pure testable functions.

## Versions and images (verified locally)
- Bun `1.4.4` (host) and `oven/bun:1.4.4-alpine` (`sha256:4cf82f56…6070a`).
- `postgres:16.15-alpine` (`sha256:aa6cb33c…825139`), Docker `29.9.2/aarch64`.
- elysia `1.4.31`, postgres `3.4.5`, react/react-dom `18.3.1`, vite `6.4.5`, `@vitejs/plugin-react` `4.7.0`; advisory bulk query returned no advisories for these exact pins.

## Executed evidence (summary)
| Check | Result |
|---|---|
| Mode A: host Bun + Docker PostgreSQL (5433) | `bun test tests` → **56 pass / 0 fail**; health/ready 200; join 201; submit 201; replay 200; deduplicated 200; snapshot revision 1; DB `1|4` and 1 receipt |
| Typecheck / build | `bun x tsc --noEmit` exit 0; `bun run build:web` exit 0 |
| Mode A restart | `docker compose restart db` and API restart → ready 200, counts unchanged, volume `c1a_c1_pgdata` |
| Mode B: fresh worktree, Docker only (5174/3001/5434) | images built; stack healthy; join/submit/snapshot/deep-link OK; full suite inside container → **56 pass / 0 fail** |
| Mode B restart | first simultaneous restart exposed a migration/DB start race (`ECONNREFUSED`); fixed with a bounded retry entrypoint; second restart healthy with data intact |
| Security/logs (C1-16) | no tracked DB password or fixture, no grant/nickname/comment in logs, no `.env`/`.local` in image, no secret in image env |

TDD evidence is recorded honestly: genuine RED→GREEN captured for the client state slice (7 fail → 7 pass) and for lifecycle/submission scenario corrections; the first core API slices were authored before their tests, so full test-first ordering was not achieved. No RED was invented.

## Case status (Mode A / Mode B)
| ID | Status | Note |
|---|---|---|
| C1-01 | PASS / — | Mode A runtime and DB readiness |
| C1-02 | — / PASS | Mode B Docker-only fresh worktree |
| C1-03 – C1-14 | PASS / PASS | Both modes, same suite; see result.md per-case evidence |
| C1-15 | PARTIAL / PARTIAL | Production build and deep-link reload verified; real-browser interaction and mobile **NOT RUN** (no browser automation available) |
| C1-16 | PASS / PASS | Source, logs and image context scanned |

`—` means the case is defined for the other mode. PARTIAL must not be read as a passed browser check.

## Known limitations
- No real-browser click/typing/reload verification and no mobile devices.
- Race coverage is probabilistic (5–8 rounds), not a deterministic interleaving harness; the 15-minute receipt grace boundary was not advanced with a fake clock.
- Single API instance; no multi-instance fanout/outbox, load or 30-client SLA claim.
- Host reboot and Docker engine restart are NOT RUN.
- Mode B images were built with `DOCKER_BUILDKIT=0` because the sandbox blocks the buildx activity directory; same Dockerfile and images.
- Local in-memory rate limiter and app-level WS frame check are per instance.

## Next gate
Coordinator / Senior QA independently reads and re-runs the current build, then the user tries and accepts it. Push, deploy, public tunnel, image publishing, paid services, global configuration and destructive reset remain unauthorized. Mode A services (5433/3000/5173) and Mode B services (5434/3001/5174) are left running with their volumes for the next tool; normal stop only, never `down -v` or prune.
