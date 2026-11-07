# C1 local build — Executive report (current: R02 fixes)

Status: **READY_FOR_REVIEW** — the five independent-review groups from R01 are fixed on build `da30003` with genuine RED→GREEN regressions and both-mode current-build regression. This is the coding-tool self-report, not independent QA or human acceptance. Canonical detail: [C1-LOCAL-BUILD / R02](../results/C1-LOCAL-BUILD/R02/result.md) · [result.json](../results/C1-LOCAL-BUILD/R02/result.json) · [evidence](../results/C1-LOCAL-BUILD/R02/evidence/README.md). R01 remains unchanged history.

## Baseline and provenance
- Task `C1-LOCAL-BUILD`, run `R02`, branch `main`; start HEAD `340c0d1`, build HEAD `da30003` (not pushed).
- Producer: **DeepSeek Harness** (single active coding writer). Model `deepseek-v4.1-flash-1017` is the runtime-reported id and remains unverified.
- Protected dirty files `docs/AI-PROGRESS.md` and `docs/handoffs/ANTIGRAVITY-C1.md` were not staged or modified.

## Review groups and fixes
| Group | Source | Fix | Status |
|---|---|---|---|
| C1-RV-01 | QA-C1-01 | Durable rejected-attempt receipts in the same locked transaction; stable replay/fingerprint conflict; auth/429/5xx are not certified non-save; DB failure rolls back response and receipt | FIXED |
| C1-RV-02 | QA-C1-02 | Resync/broadcast/30s sweep re-authenticate already-open sockets (expiry, session-end grace, revocation) and close with 4401 before data | FIXED |
| C1-RV-03 | QA-C1-03 + C1-UI-02 | One pending join operation key per room; uncertain retry reuses key/payload, nickname edits reuse it, different room is an explicit new join; server join stays idempotent | FIXED |
| C1-RV-04 | QA-C1-04 | Join advances revision atomically and publishes after commit; client rejects older HTTP and WS state, accepts equal-revision authenticated resync, Live only after fresh snapshot | FIXED |
| C1-RV-05 | C1-UI-01 | Outcome/draft/attempt state keyed by authoritative question id; next unanswered question usable; unknown earlier attempt preserved with its question | FIXED |

Attempt policy, grant lifetimes, Thai copy and the one-instance stack are unchanged.

## Executed evidence (current build)
- Genuine RED: API/WS suite 7 fail / 2 pass before fixes; React-container suite 6 fail / 0 pass before fixes. Both saved in evidence.
- Mode A (host Bun 1.4.4 + Docker PostgreSQL 5433): `bun test tests` → **71 pass / 0 fail**, typecheck 0, production build 0, migration 0002 applied, live HTTP flow shows durable rejection/replay/conflict and join revision advance.
- Mode B (Docker-only, 5174/3001/5434): images rebuilt from `da30003`, stack healthy, migration applied; **separate Docker test runner** (`tests/run-in-docker.sh`, throwaway container, no host Bun/node_modules) → **71 pass / 0 fail**; production image contains no tests, `.env` or happy-dom.
- Restart: Mode A db restart and API restart, Mode B simultaneous api+db restart — data, revision and rejected receipts persist; no volume deleted.
- C1-16: no tracked password, no grant/nickname/comment logging, clean API logs, no secret in image env.

## Case status (current build)
C1-01..C1-14 and C1-16: **PASS** in their required modes. C1-15: **PARTIAL** — production build and deep-link pass; approved Thai copy and container flows exercised in react-dom/happy-dom, but **real-browser interaction is NOT RUN** (no browser automation on this host) and must be retested by QA/Coordinator.

## Known limitations
- Real-browser journeys (question transition, lost join/submission acknowledgement, reconnect) are NOT RUN by this writer; those were the R01 reproducers, so browser retest is the immediate next gate.
- Mobile, 30-client load/SLA, host reboot and full accessibility/security certification remain unproven.
- Mode B images built with `DOCKER_BUILDKIT=0` because the sandbox blocks the buildx activity directory (same Dockerfile/targets).
- Sweep interval and receipt-grace boundary are enforced by code/tests but not time-advanced with a fake clock.

## Next gate
Independent QA/browser verification of `da30003` against the five group acceptances, then user trial/acceptance. Push, deploy, tunnel, image publication, paid services, global configuration and destructive reset remain unauthorized. Services stay running with volumes for the next reviewer; normal stop only, never `down -v` or prune.
