# C1 local build — Executive report (current: R05 follow-up)

Status: **READY_FOR_REVIEW** — R05 corrected the C1-FU-01 concurrent-send assurance (verified: concurrent already-admitted sends can deliver more than one frame; no one-frame bound, no policy change) and preserved all prior evidence gates. R04 closed the two evidence gates from the R03 review (C1-EG-01 controlled participant-snapshot interleave; C1-EG-02 WS authorization/send boundary with precise lifetime equality). No new defect and no application/policy change. Canonical detail: [C1-LOCAL-BUILD / R04](../results/C1-LOCAL-BUILD/R04/result.md) · [result.json](../results/C1-LOCAL-BUILD/R04/result.json) · [evidence](../results/C1-LOCAL-BUILD/R04/evidence/README.md) · [boundary](../implementation/C1-WS-AUTHORIZATION-BOUNDARY.md). R01–R03 remain unchanged history. This is the coding-tool self-report, not independent QA or human acceptance.

## Baseline and provenance
- Task `C1-LOCAL-BUILD`, run `R05`, branch `main`; start HEAD `3ab71c4`, build HEAD `42e7bb8` (not pushed).
- Producer: **DeepSeek Harness** (single active coding writer). Model `deepseek-v4.1-flash-1017` is the runtime-reported id and remains unverified.
- Protected dirty files `docs/AI-PROGRESS.md` and `docs/handoffs/ANTIGRAVITY-C1.md` were not staged or modified.

## Review residuals and fixes
| ID | Status | Fix |
|---|---|---|
| R02-QA-01 | FIXED | Receipt GET returns the stored terminal rejection (no 500), incl. lost-ack, grace and revoke paths |
| R02-QA-02 | FIXED | Deduplicated new key stores a stable accepted receipt bound to response+fingerprint; replay stable, changed payload 409 |
| R02-QA-03 | FIXED | Writes re-read the grant FOR UPDATE inside the mutation transaction; controlled blocked-write vs revoke/expiry returns 401 with no row |
| R02-QA-04 | FIXED | Uncertain join keeps immutable payload; nickname edits are not sent; server-stored label displayed |
| R02-QA-05 | FIXED (structural); evidence closed by C1-EG-01 | One repeatable-read participant snapshot for /api/me, join and WS state; equal-revision reconcile; controlled mid-read commit now executed in R04 |
| C1-RV-02 gate | COMPLETED; boundary evidence by C1-EG-02 | Configurable idle sweep, exact TTL/grace tests, revoke-vs-broadcast; per-socket revalidation documented as the authorization/send boundary and controlled in R04 |

Earlier groups keep their IDs: C1-RV-01..05, QA-C1-01..04, C1-UI-01/02. C1-RV-05 remains RESOLVED_TARGETED_BROWSER with its regressions still passing.

## R03 evidence gates (verification only)
| Gate | Status | Result |
|---|---|---|
| C1-EG-01 | **PASS** | A test-boundary barrier pauses a participant snapshot reader after its repeatable-read session read; a real submission commits before later component reads. Old HTTP/WS view is complete (revision R, no own answer) and the later view is complete (R+1, own answer); every frame's revision/question/own-answer identity agrees. |
| C1-EG-02 | **PASS** | Boundary documented in `docs/implementation/C1-WS-AUTHORIZATION-BOUNDARY.md` (per-socket revalidation is the linearization point; explicit disconnect; at most the already-built in-flight frame). Equality: hard TTL equality expired, grace equality readable, TTL wins in grace, revocation immediate. Controlled expiry in the revalidation→send window admits exactly the in-flight frame then 4401; revoke delivers no state frame. |

No production behavior, attempt policy or lifetime policy changed; two test-only seams (DB-client barrier in tests, inert hub `beforeSend` hook never supplied by production) were added.

## Executed evidence (current build)
- Verification tests: `tests/evidence-gates.test.ts` **7 pass** (EG-01 HTTP+WS, EG-02 equality + valid/expiry/revoke boundary).
- Mode A: **91 pass / 0 fail**; typecheck 0.
- Mode B: images rebuilt from `62bfa8d`; separate Docker runner **91 pass / 0 fail**; api+db restart healthy; image excludes tests/happy-dom.
- Delivery hygiene: runner cleanup trap preserved (no `exec`), secrets forwarded by env name, live API log moved to `.local/logs`; earlier tracked R02 log append left unstaged, history untouched.

## Case status (current build)
No application behavior changed in R04; the suite was re-run on the current build. C1-01..C1-14 and C1-16: **PASS** in required modes. C1-15: **PARTIAL** — build/deep-link pass and container flows exercised in happy-dom; **real-browser interaction NOT RUN** (no browser automation in this session).

## Known limitations
- Real-browser journeys (edited-nickname join, equal-revision reconnect, question transitions) are NOT RUN by this writer; browser retest is the immediate QA/Coordinator gate.
- Mobile, 30-client load/SLA, host reboot and full accessibility/security certification remain unproven.
- Mode B images built with `DOCKER_BUILDKIT=0` because the sandbox blocks the buildx activity directory (same Dockerfile/targets).
- TTL/grace equality is proven at the authorization seam with real DB timestamps (chosen instants); production 4h/8h/15m durations are not waited out. Exhaustive scheduler interleavings are not proven.

## Next gate
Independent QA of C1-R05 + LAN-R02 and the pending physical iPhone test, then user trial/acceptance. Push, deploy, tunnel, image publication, paid services, global configuration and destructive reset remain unauthorized. Services stay running with volumes for the next reviewer; normal stop only, never `down -v` or prune.
