# RELEASE-PREP-01 / R01 — Local Cloudflare Pages + Railway deployment artifacts

- **Task/run:** RELEASE-PREP-01 / R01 (`main`, HEAD `9a909bf`, not pushed)
- **Producer:** DeepSeek Harness (single writer); **Reported:** 2026-11-12T08:10:29+07:00
- **Status:** **LOCAL PREPARATION COMPLETE / CLOUD NOT RUN.** No account, cloud resource, publication, push, tunnel or paid service was used.

## Delivered artifacts
- **`Dockerfile.api`** — API-only Railway image. The root `Dockerfile`'s last stage is the static web host, so auto-detecting it for the API would deploy the wrong service; `railway.json` pins `dockerfilePath=Dockerfile.api` and `/ready` healthcheck. Pinned Bun digest, frozen production install, additive-migration entrypoint, unprivileged user, copied-file read modes fixed (source files can be mode 600 locally).
- **Cloud PORT/bind compatibility** — `PORT` (Railway) is honoured with a `0.0.0.0` bind; local defaults stay `127.0.0.1:3000`; explicit `API_PORT`/`API_HOST` take precedence; invalid `PORT` fails closed. TDD RED→GREEN (`tests/env-cloud.test.ts` 4/4).
- **Readiness/migrations** — container waits for PostgreSQL, applies additive migrations via `schema_migrations`, then starts; `/ready` is DB-backed, `/health` liveness; one migration path, no double-run/reset; rollback documented as previous-compatible image redeploy (no destructive DB rollback promise).
- **Serving/deep links** — Pages output `apps/web/dist`; local static host verified `/join`, `/room`, `/facilitator`, `/hr` 200; Pages SPA fallback documented as provider behaviour to verify after approval.
- **Public build safety** — public candidate built with reserved `.invalid` hosts: bundle contains those hosts and **0** loopback refs, **0** private-IP refs, **0** `postgres://` refs, no bearer/grant literals. Default/LAN builds preserved.
- **Runbook** — `docs/deployment/RELEASE-PREP-01.md`: topology, env matrix (secret/public names only), build/start/migration/readiness, exact origins/WS, manual publication sequence, owner-operated evaluator access/grants at submission time, final smoke checklist, rollback, pending human gates.
- **Public-safety audit** — `scripts/audit-public-safety.sh`: 0 private-key blocks, 0 AWS/GitHub/sk/JWT patterns; 5 database-URL pattern lines all classified placeholder/template, **0 real-like candidates** in working tree and full Git history; only `.env.example`/`.env.lan` (public settings) tracked; `.env`/`.local`/keys ignored and dockerignored; public bundle scan clean. Limits: pattern-based only, no gitleaks/trufflehog installed, no entropy analysis, binary/PDF internals shallow.

## Local execution evidence (actual)
- `DOCKER_BUILDKIT=0 docker build -f Dockerfile.api -t lead-d-lab-api:local .` → 0 (default buildx blocked by sandboxed activity dir; legacy builder, same Dockerfile).
- Container with `PORT=8080`, real local PostgreSQL, `ALLOWED_ORIGINS=https://example.pages.dev`: `/health` 200, `/ready` 200 `{\"db\":\"ok\"}`, `/api/hr/summary` **401** (API served, not web), startup log shows migrations then `listening on http://0.0.0.0:8080`; root `/` now JSON 404. Test container removed.
- `VITE_API_BASE_URL=https://api.lead-d-lab.invalid VITE_WS_URL=wss://api.lead-d-lab.invalid/ws bun run build:web` → 0; checks in `evidence/public-build-checks.log`.
- Local API/web restored without reset: `/health`/`/ready` 200, SPA deep links 200.
- Native `bun test tests` → **137 pass / 0 fail** (745 expects); Mode B Docker-only runner → **137 tests, 0 fail, 9 declared skips**; typecheck 0; default/LAN builds 0.
- Secret audit output: `evidence/public-safety-audit.log` (counts/paths only, no values).

## NOT RUN / pending human gates
- Cloud account login, project/region/plan choice, Railway PostgreSQL creation, Pages/Railway deployment, real HTTPS/WSS URLs, provider PORT/healthcheck/SPA-fallback behaviour, custom domain, public repository push/history decision, evaluator link and physical Safari/phone tests — all **NOT RUN**.
- Public history audit is pattern-based; no exhaustive secret-history certification is claimed. Publication stops for owner approval; any real credential found later requires owner rotation/history decision (no autonomous rewrite).
- LAN lost-control-ack verifier residual is separate and untouched here (see LAN R05).

Evidence: `evidence/` (env RED/GREEN, API image build/runtime, public build checks, local services, audit, regressions, README) and `docs/deployment/RELEASE-PREP-01.md`.
