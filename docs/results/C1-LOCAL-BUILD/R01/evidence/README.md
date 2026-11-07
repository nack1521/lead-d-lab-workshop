# Evidence index — C1-LOCAL-BUILD / R01

Sanitized evidence from real commands. No capability tokens, passwords, raw DATABASE_URLs or real personal data are stored here; the local DB password lives only in the untracked `.env`/`.local` files.

| Path | What it proves | Command / exit |
|---|---|---|
| `mode-a/mode-a-http-evidence.log` | Mode A health/ready, anonymous join, rating submit, unchanged replay, new-key dedup, facilitator snapshot, DB readback, denied origin, deep links and asset serving | `curl` flow, exit 0 |
| `mode-a/join.json` | Join response fields with the capability token redacted | `jq` projection, exit 0 |
| `mode-a/submit.json` | Accepted rating response with typed payload and revision | `curl`, HTTP 201 |
| `mode-a/facilitator-snapshot.json` | Aggregate counts only (no nickname/comment) at revision 1 | `curl` + `jq`, HTTP 200 |
| `mode-a/db-readback.txt` | Direct PostgreSQL readback of the accepted row and receipt | `docker exec … psql -tAc`, exit 0 |
| `mode-a/api.log` | Sanitised API startup lines only; no tokens/nicknames/comments | server log |
| `mode-a/web.log` | Static SPA host startup | server log |
| `mode-a/full-test-suite.log` | Current-build Mode A integration suite: 56 pass / 0 fail | `bun test tests`, exit 0 |
| `mode-a/restart-db-evidence.log` | PostgreSQL container restart without volume removal; data and revision unchanged; volume name | `docker compose restart db`, exit 0 |
| `mode-a/restart-api-evidence.log` | API process restart reading the committed state | process restart + `curl`, exit 0 |
| `mode-b/mode-b-http-evidence.log` | Mode B container status, volumes, health, join/submit via 3001 with Origin 5174, DB readback, deep links, bundle API base 3001, denied origin | `curl`/`docker compose` flow, exit 0 |
| `mode-b/submit.json` | Mode B accepted submission | HTTP 201 |
| `mode-b/snapshot.json` | Mode B aggregate snapshot | HTTP 200 |
| `mode-b/container-test-suite.log` | Same suite running inside a Docker container on the `c1b` network, no host Bun: 56 pass / 0 fail | `docker run … bun test tests`, exit 0 |
| `mode-b/restart-evidence.log` | After the retry-entrypoint fix: simultaneous api+db restart keeps data and becomes healthy | `docker compose -p c1b restart api db`, exit 0 |
| `tdd/web-state-red.log` | Genuine RED: web state functions not implemented, 7 fail | `bun test tests/web-state.test.ts`, exit 1 |
| `tdd/web-state-green.log` | GREEN after implementation, 7 pass | exit 0 |
| `c1-16-security-scan.log` | Tracked-file secret scan, log scan, image context scan and image env scan | shell scans, exit 0 |

Mode B build with the default buildx builder failed once with `operation not permitted` on `~/.docker/buildx/activity` (sandbox); the retry used `DOCKER_BUILDKIT=0` and the same Dockerfile. That failure is recorded in `result.md`, not presented as a green step.
