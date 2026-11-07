# Evidence index — C1-LOCAL-BUILD / R02 (fix round for C1-RV-01..05)

Sanitized evidence from commands actually run on the fixed build (`da30003`). No capability tokens, passwords, raw DATABASE_URLs or real personal data are stored here.

| Path | What it proves | Command / exit |
|---|---|---|
| `findings-api-red.log` | Genuine RED at API/DB/WS seams before fixes: 7 of 9 finding tests fail (durable terminal receipts, transient-failure certification, open-socket lifetime, join revision/publish) | `bun test tests/findings-api.test.ts`, exit 1 |
| `findings-api-green.log` | Same suite after the server fixes: 9 pass | exit 0 |
| `findings-client-red.log` | Genuine RED at the React-container seam before fixes: 6 fail (join key changes on retry, saved outcome carried to the next question, stale HTTP applied, Live before snapshot) | `bun test tests/findings-client.test.tsx`, exit 1 |
| `findings-client-green.log` | Same suite after the client fixes: 6 pass | exit 0 |
| `mode-a-full-regression.log` | Current-build Mode A full suite (host Bun + Docker PostgreSQL): **71 pass / 0 fail** across 9 files | `bun test tests`, exit 0 |
| `mode-a/r02-http-evidence.log` | Live Mode A API: health/ready, join revision 6→7, terminal rejection, stable replay, conflict, 401 with `terminal:false`, facilitator count, rejected receipt in DB | `curl` flow, exit 0 |
| `mode-a/restart-evidence.log` | PostgreSQL restart without volume removal on the new schema; revision/counts and rejected receipts persist | `docker compose restart db`, exit 0 |
| `mode-a/restart-api-evidence.log` | API process restart reads the committed state | process restart + `curl`, exit 0 |
| `mode-b/verify.log` | Mode B rebuilt images, `0002_terminal_receipts.sql` applied, production image has no happy-dom/tests, Docker-only runner **71 pass / 0 fail** | `docker compose build/up`, `tests/run-in-docker.sh`, exit 0 |
| `mode-b/container-suite.log` | Full suite inside a throwaway container from committed source (no host Bun/node_modules, production images untouched) | `tests/run-in-docker.sh c1b_default`, exit 0 |
| `mode-b/restart-and-receipts.log` | Simultaneous api+db restart keeps data healthy; over-limit rejection is a durable receipt, same key replays and a changed payload conflicts | restart + `curl` + `psql`, exit 0 |
| `mode-a-api.log` | Sanitized API startup lines only (R02 process); no tokens, nicknames, comments or passwords | server log |
| `c1-16-security-scan.log` | No tracked DB password, no grant/nickname/comment logging, no secrets in API log, production image has no `.env`/tests/happy-dom and no secret env | shell scans, exit 0 |

Notes kept honest:
- The default buildx builder is still blocked by the sandboxed `~/.docker/buildx/activity` path, so Mode B images were rebuilt with `DOCKER_BUILDKIT=0` (same Dockerfile/targets).
- Real-browser interaction for this fix round is **NOT RUN**: no browser automation is available in this session (no Playwright/Puppeteer/Chrome; Safari automation would change global configuration). React-container behaviour was exercised in a mounted react-dom tree in happy-dom, which is a DOM emulator, not a browser.
