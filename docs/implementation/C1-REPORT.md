# C1 local build — Executive report (current: R03 fixes)

Status: **READY_FOR_REVIEW** — the R02 retest residuals (R02-QA-01..05) and the C1-RV-02 security verification gate are addressed on build `cce8db1` with genuine RED→GREEN regressions and both-mode current-build regression. This is the coding-tool self-report, not independent QA or human acceptance. Canonical detail: [C1-LOCAL-BUILD / R03](../results/C1-LOCAL-BUILD/R03/result.md) · [result.json](../results/C1-LOCAL-BUILD/R03/result.json) · [evidence](../results/C1-LOCAL-BUILD/R03/evidence/README.md). R01/R02 remain unchanged history.

## Baseline and provenance
- Task `C1-LOCAL-BUILD`, run `R03`, branch `main`; start HEAD `2b87143`, build HEAD `cce8db1` (not pushed).
- Producer: **DeepSeek Harness** (single active coding writer). Model `deepseek-v4.1-flash-1017` is the runtime-reported id and remains unverified.
- Protected dirty files `docs/AI-PROGRESS.md` and `docs/handoffs/ANTIGRAVITY-C1.md` were not staged or modified.

## Review residuals and fixes
| ID | Status | Fix |
|---|---|---|
| R02-QA-01 | FIXED | Receipt GET returns the stored terminal rejection (no 500), incl. lost-ack, grace and revoke paths |
| R02-QA-02 | FIXED | Deduplicated new key stores a stable accepted receipt bound to response+fingerprint; replay stable, changed payload 409 |
| R02-QA-03 | FIXED | Writes re-read the grant FOR UPDATE inside the mutation transaction; controlled blocked-write vs revoke/expiry returns 401 with no row |
| R02-QA-04 | FIXED | Uncertain join keeps immutable payload; nickname edits are not sent; server-stored label displayed |
| R02-QA-05 | FIXED (structural) / PARTIAL verification | One repeatable-read participant snapshot for /api/me, join and WS state; equal-revision reconcile; deterministic mid-read interleave NOT achieved |
| C1-RV-02 gate | COMPLETED | Configurable idle sweep, exact TTL/grace tests, revoke-vs-broadcast; per-socket revalidation documented as the authorization/send boundary |

Earlier groups keep their IDs: C1-RV-01..05, QA-C1-01..04, C1-UI-01/02. C1-RV-05 remains RESOLVED_TARGETED_BROWSER with its regressions still passing.

## Executed evidence (current build)
- Genuine RED: API/WS residuals 7 fail / 4 pass; React-container 3 fail / 5 pass. GREEN: 11 pass / 8 pass.
- Mode A: **84 pass / 0 fail**; typecheck 0; production build 0; live rejected-receipt and dedup-key evidence with DB readback.
- Mode B: images rebuilt from `cce8db1`; separate Docker runner **84 pass / 0 fail**; api+db restart keeps data; image excludes tests/happy-dom/.env.
- Delivery hygiene: runner cleanup trap preserved (no `exec`), secrets forwarded by env name, live API log moved to `.local/logs`; earlier tracked R02 log append left unstaged, history untouched.

## Case status (current build)
C1-01..C1-14 and C1-16: **PASS** in required modes. C1-15: **PARTIAL** — build/deep-link pass and container flows exercised in happy-dom; **real-browser interaction NOT RUN** (no browser automation in this session).

## Known limitations
- Real-browser journeys (edited-nickname join, equal-revision reconnect, question transitions) are NOT RUN by this writer; browser retest is the immediate QA/Coordinator gate.
- Mobile, 30-client load/SLA, host reboot and full accessibility/security certification remain unproven.
- Mode B images built with `DOCKER_BUILDKIT=0` because the sandbox blocks the buildx activity directory (same Dockerfile/targets).
- Sweep and grace boundaries are tested at scaled intervals (100ms/1s); production TTLs are not waited out. R02-QA-05 deterministic mid-read interleave NOT achieved.

## Next gate
Independent QA/browser verification of `cce8db1` against R02-QA-01..05 and the C1-RV-02 gate, then user trial/acceptance. Push, deploy, tunnel, image publication, paid services, global configuration and destructive reset remain unauthorized. Services stay running with volumes for the next reviewer; normal stop only, never `down -v` or prune.
