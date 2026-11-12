# RELEASE-PREP-01 — Local readiness for Cloudflare Pages + Railway deployment

Status: **LOCAL PREPARATION ONLY / CLOUD NOT RUN**. All cloud behaviour below (accounts, resources, HTTPS/WSS URLs, provider PORT injection, Pages/Railway builds) is **NOT RUN** until the owner approves account/cost/region and publishes. This run does not deploy, push, tunnel or expose anything.

## Selected topology (approved direction)
- **Web:** React (Vite) static build on Cloudflare Pages (`apps/web/dist`).
- **API:** Elysia on Bun in one container on Railway, built from the dedicated **`Dockerfile.api`**; real PostgreSQL; native WebSocket; **one API instance only** (no Redis/queue/multi-instance fanout).
- **Database:** Railway-managed PostgreSQL, reached only by the API over the provider's private networking with TLS (`sslmode=require`).
- **Transport:** cross-origin HTTPS API + WSS, exact frontend origin in `ALLOWED_ORIGINS`, bearer grants with first-message WS auth. No wildcard, no token in URL/cookie/query.

## Deployment artifacts (owned)
| Artifact | Purpose |
|---|---|
| `Dockerfile.api` | **API-only** image (the root `Dockerfile`'s last stage is the static web host and must not be auto-detected for the API). Pinned `oven/bun:1.4.4-alpine` digest; installs frozen production deps; copies `apps/api`, `db/migrations`, `docker/start-api.sh`; fixes copied-file modes; runs as unprivileged `bun`; `EXPOSE 3000`. |
| `railway.json` | Sets `build.builder=DOCKERFILE`, `dockerfilePath=Dockerfile.api` and deploy healthcheck `/ready` (Railway account/config use still requires approval/verification). |
| `docker/start-api.sh` | Waits for PostgreSQL, applies **additive** migrations, then execs the API; `/ready` is DB-backed readiness. |
| `.env.deploy.example` | Variable names + secret/public classification only. Never copy real values into Git. |
| Root `Dockerfile` + `compose.yaml` | Preserved for local Mode A/B; unchanged selection semantics. |

## Local verification actually performed
- `DOCKER_BUILDKIT=0 docker build -f Dockerfile.api -t lead-d-lab-api:local .` → success (legacy builder required because this host's sandbox blocks the buildx activity directory).
- `docker run` with cloud-style `PORT=8080`, `DATABASE_URL` to the local PostgreSQL, `ALLOWED_ORIGINS=https://example.pages.dev`:
  - `GET /health` → 200 `{"status":"ok"}`; `GET /ready` → 200 `{"status":"ready","db":"ok"}` (real DB round trip).
  - `GET /api/hr/summary` without a grant → **401** (API route served, not the web shell).
  - startup log: migrations applied, then `c1 api listening on http://0.0.0.0:8080 (origins: https://example.pages.dev)` — cloud `PORT` and 0.0.0.0 bind work while local defaults stay `127.0.0.1:3000`.
  - root `/` now returns an explicit JSON 404 instead of a file-read error.
- Public-candidate web build with **reserved** hosts (`VITE_API_BASE_URL=https://api.lead-d-lab.invalid`, `VITE_WS_URL=wss://api.lead-d-lab.invalid/ws`): bundle contains those hosts; **0** loopback refs, **0** private-IP refs, **0** `postgres://` refs, no bearer/grant literals.
- Default and LAN builds still pass; local static SPA host preserves `/join`, `/room`, `/facilitator`, `/hr` deep links.
- Publication-safety audit (pattern-based, no gitleaks/trufflehog installed): 0 private-key blocks, 0 AWS/GitHub/sk/JWT patterns; 5 database-URL pattern lines, **all 5 placeholder/template**, 0 real-like candidates in working tree and full Git history; only `.env.example`/`.env.lan` (public settings) tracked; `.env`, `.local`, keys ignored and excluded by `.dockerignore`; public candidate bundle scan clean. Limits: pattern-based only, no entropy scanning; binary/PDF internals not deeply inspected; no external secret service or push test.

## Environment matrix (names only, never values)
| Variable | Class | Where | Notes |
|---|---|---|---|
| `DATABASE_URL` | **server secret** | Railway API | Private PostgreSQL host + `sslmode=require`; never `VITE_*`, never client. |
| `PORT` | provider (server) | Railway injects | API listens `0.0.0.0:$PORT`; no manual value needed. |
| `API_PORT` / `API_HOST` | server settings (optional) | Railway/local | Explicit values take precedence over `PORT`; local default is `127.0.0.1:3000`. |
| `ALLOWED_ORIGINS` | server setting | Railway API | Exact Pages origin (comma-separated for extra known origins); no wildcard; WS uses the same check. |
| `GRANT_TTL_*`, `WS_*`, `HTTP_BODY_LIMIT_BYTES`, `WS_FRAME_LIMIT_BYTES`, `WS_SWEEP_INTERVAL_MS`, `RECEIPT_READ_GRACE_SECONDS` | server settings | Railway API | Existing local contract; do not silently change values. |
| `VITE_API_BASE_URL`, `VITE_WS_URL` | **public browser** | Pages build | URLs only (`https://…`, `wss://…/ws`); never tokens/secrets. |

## Build / start / migration / readiness
1. **Web build (Pages):** from repository root, `VITE_API_BASE_URL=https://<approved-api-host> VITE_WS_URL=wss://<approved-api-host>/ws bun run build:web`; publish output **`apps/web/dist`**. Pages SPA fallback: with no top-level `404.html`, unknown paths serve the app shell (provider behaviour to be verified after approval); local static host already proves `/join`, `/room`, `/facilitator`, `/hr`.
2. **API image:** Railway builds **only** `Dockerfile.api`. `railway.json` pins the path and `/ready` healthcheck. Confirm the deployed service is the API (e.g. `/health` 200 and `/api/hr/summary` 401, not an HTML shell).
3. **Migrations:** the container entrypoint applies pending additive SQL migrations (`schema_migrations`), retries until PostgreSQL is reachable, then starts the API. There is **one** migration path; do not add a second deploy-time or manual reset step. Failure behaviour: bounded retries then container exit (no partial-start success).
4. **Readiness:** use `/ready` (DB round trip) for deployment readiness; `/health` is liveness only. Neither weakens Origin restrictions.
5. **Rollback:** redeploy the previous API image; additive migrations are forward-compatible by design. No destructive schema rollback is promised — a breaking change would require a separate, owner-approved database decision.

## Origins / WS
- Set `ALLOWED_ORIGINS` to the exact Pages origin (e.g. `https://<project>.pages.dev`; custom domain if approved). HTTPS API/WSS must be same API host. Missing/`null`/unknown WS Origin is rejected; Origin is not authentication.
- Participant/facilitator/HR grants are opaque bearer values supplied by the owner; no grant in URL, bundle, logs or evidence. CORS/WS negative checks are covered by the local suite and must be rechecked after deployment.

## Owner-operated evaluator access (after approval only)
1. In Railway, keep `DATABASE_URL` server-side and use private networking/TLS; do not enable public DB exposure for convenience.
2. Create a **fresh synthetic** session inside an approved API container/one-off environment attached to the same Railway private network. Run the included `bun run apps/api/src/hr-demo-fixture.ts` there; its `.local/hr-demo/<CODE>.json` is private storage **inside that environment**, not automatically on the Mac. A Railway private DNS DATABASE_URL is not directly reachable from a local Mac. Do not add public PostgreSQL access merely to seed the demo.
3. Use the deployed frontend manually for facilitator/participant trial, then end the session. Run the included `bun run apps/api/src/issue-hr-grant.ts <session>` in the approved private-network environment. Retrieve the generated private credential files only through an owner-approved secure mechanism, keep them out of logs/recording, and supply scoped grants to the evaluator privately. The mechanism/account permissions still require validation after approval. The API-only image does not include root smoke scripts: automated cloud smoke needs a separately approved in-network runner with the required source, rather than assuming `scripts/hr-smoke.ts` exists in the API image or can access a private DB from the Mac. Grants expire; mint at submission time without silently extending TTLs or exposing a public issuer.
4. Keep grants, `.env`, local CA/dev certificates and fixture files off-screen during recording.

## Final smoke checklist (local now; cloud/phone after approval)
- Facilitator page (valid scoped grant) → open question 01 → participant joins `ROOM`/fresh code without account, answers rating+poll with multiline Thai/emoji comment → facilitator sees the committed live aggregate frame.
- End session → HR page with a valid HR grant shows persisted summary with per-question n/joined base/unanswered/coverage, rating/poll distributions, confidence/blockers text and caveats; reload reproduces the same result.
- Negative checks: participant/facilitator cannot read HR; HR cannot submit/control; expired/revoked/other-session grants denied; evil/missing WS Origin rejected; unauthorized browser never treated as empty.
- HTTPS/WSS endpoints are the deployed ones (no loopback/mixed content); request logs contain no grants/bodies; DB rows reconcile with the summary; reconnect after a dropped socket returns the authoritative snapshot.
- Reconnect/restart: API restart keeps data (additive migrations, no volume deletion). 30-participant load/SLA, mobile/accessibility and multi-instance fanout are **not** part of this preparation.

## Pending human gates (stop points)
- Account login/permissions, region, plan/cost, PostgreSQL creation, Railway/Pages project creation.
- Publication: Pages deployment URL, Railway API URL, exact `ALLOWED_ORIGINS`, WSS, custom domain decision, push to the public repository (history/secrets audit decision) and evaluator link.
- Real-device/physical Safari and cloud HTTPS/WSS verification remain **NOT RUN**; actual provider behaviour (PORT injection, Pages SPA fallback, healthcheck timing) must be exercised after approval and recorded separately. No deployment or push is implied by this document.
