# C1-LOCAL-BUILD / R03 — R02 residual fixes, C1-RV-02 security gate and both-mode regression

- **Task ID:** `C1-LOCAL-BUILD`
- **Run ID:** `R03`
- **Reported at:** 2026-11-07T18:03:26+07:00 (Asia/Bangkok)
- **Producer:** DeepSeek Harness (single active coding writer)
- **Model:** `deepseek-v4.1-flash-1017` (runtime-reported, unverified)
- **Review input:** `docs/implementation/C1-REVIEW-SUMMARY-R02.md` (CHANGES_REQUESTED; R02-QA-01..05 + security verification gate)
- **Baseline HEAD at start:** `2b87143` (review documentation; app source `da30003`)
- **Build HEAD:** `cce8db1ac194f2ea6d9d23b707c0c05a5841b6d0` (`main`, not pushed)
- **Protected dirty paths preserved unchanged:** `docs/AI-PROGRESS.md`, `docs/handoffs/ANTIGRAVITY-C1.md`
- **Task status:** **READY_FOR_REVIEW** — producer fixes with genuine RED→GREEN and both-mode current-build regression; not independent QA or human acceptance.

## Fixes

| ID | Group | Status | Fix and evidence |
|---|---|---|---|
| **R02-QA-01** | C1-RV-01 | **FIXED** | Authenticated receipt GET reads outcome/code/message explicitly: a rejected attempt returns its stored terminal rejection (200, `terminal:true`, `replay:true`, field hint) instead of 500. Covered after a lost rejection ack, inside the session-end grace window and denied (401) after revoke. RED→GREEN in `R03-evidence-*`; live Mode A/B receipt GET 200. |
| **R02-QA-02** | C1-RV-01 | **FIXED** | A deduplicated new key now inserts an `accepted` receipt bound to the existing response id and that key's payload fingerprint. Replay of the same key/payload is stable; changed payload under that key is 409 `IDEMPOTENCY_CONFLICT`; one accepted answer and one response row remain. Live Mode A evidence shows key A + key B receipts pointing at one response. |
| **R02-QA-03** | C1-RV-01 | **FIXED** | Participant submissions and facilitator `open`/`close`/`end`/`revoke` re-read the grant row `FOR UPDATE` inside the mutation transaction after the session row lock, with a documented lock order (session → grant; revoke takes facilitator grant → participant grants without the session lock). Controlled tests hold the session lock, start the write, then revoke or expire the grant before release: the write returns 401 and leaves no response/receipt. |
| **R02-QA-04** | C1-RV-03 | **FIXED** | The pending join keeps key + immutable payload (room code and nickname). A nickname edit is not sent as a payload change; the join response now exposes the stored participant label and the UI displays the authoritative label. Unchanged-join regression and different-room behaviour are preserved. |
| **R02-QA-05** | C1-RV-04 | **FIXED (structural) / PARTIAL verification** | `/api/me`, the join response and participant WebSocket state now come from one repeatable-read participant snapshot (session revision, active question, own response, stored identity). The client reconciles equal-revision state instead of dropping it. A concurrent commit/read stress test checks revision↔own-answer consistency; a deterministic mid-read commit interleaving was **not** achievable without production test hooks, and is reported as a limitation rather than claimed. |
| **C1-RV-02 gate** | C1-RV-02 | **COMPLETED as verification gate** | `WS_SWEEP_INTERVAL_MS` (default 30s) makes the idle sweep testable; sends build the payload first and then perform a per-socket revalidation that is documented as the authorization/send linearization boundary. Tests cover: idle sweep closes an expired socket with no client message; exact 1s session-end grace boundary; hard-expiry resync; revoked socket receives no state from a broadcast that a live socket receives. No stricter retention policy was invented and no zero-race claim is made. |

Prior review IDs are preserved: C1-RV-01 (OPEN→fixed residuals), C1-RV-02 (gate), C1-RV-03 (partial→payload/label fixed), C1-RV-04 (partial→server snapshot fixed), C1-RV-05 (already RESOLVED_TARGETED_BROWSER, regressions preserved), QA-C1-01..04, C1-UI-01/02, and R02-QA-01..05.

## Real commands and exit codes (current build)

| Command | Exit | Result |
|---|---|---|
| `bun test tests/findings-r02.test.ts` (before fix) | 1 | 7 fail / 4 pass (genuine RED) |
| `bun test tests/findings-client.test.tsx` (before fix) | 1 | 3 fail / 5 pass (genuine RED) |
| `bun test tests/findings-r02.test.ts` (after fix) | 0 | 11 pass |
| `bun test tests/findings-client.test.tsx` (after fix) | 0 | 8 pass |
| `bun x tsc --noEmit -p tsconfig.json` | 0 | no type errors |
| `bun test tests` (Mode A) | 0 | **84 pass / 0 fail**, 407 expect, 10 files |
| `bun run build:web` | 0 | production bundle rebuilt |
| Mode A live QA-01/02 flow | 0 | rejected POST 422 → receipt GET 200 stored rejection; dedup key bound; changed payload 409; DB two accepted receipts → one response |
| `tests/run-in-docker.sh c1b_default` (Mode B) | 0 | **84 pass / 0 fail**, 406 expect, 10 files in a throwaway container from committed source |
| Mode B `docker compose restart api db` | 0 | ready 200, authoritative join label, rejected receipt GET 200, schema `0001`+`0002` |
| C1-16 + hygiene scans | 0 | no tracked password, no sensitive logging, runner cleanup/env-by-name, image has no tests/happy-dom/.env |

## Cases C1-01–C1-16 (current build)

| ID | Mode A | Mode B | Actual this run |
|---|---|---|---|
| C1-01 | PASS | — | health/ready 200, live API on new build, join revision advanced |
| C1-02 | — | PASS | rebuilt images, stack healthy, Docker-only suite 84 pass |
| C1-03 | PASS | PASS | join/retry; immutable payload + authoritative label (R02-QA-04) |
| C1-04 | PASS | PASS | atomic rating+comment; injected DB failure leaves no row/receipt |
| C1-05 | PASS | PASS | poll typed validation |
| C1-06 | PASS | PASS | grapheme boundaries, whitespace, escaped text, budgets |
| C1-07 | PASS | PASS | unchanged retry once; same-key changed payload 409 |
| C1-08 | PASS | PASS | accepted immutability; dedup key binding; terminal receipts; fresh attempt |
| C1-09 | PASS | PASS | aggregate after commit without nickname/comment; WS lifetime rechecks |
| C1-10 | PASS | PASS | close/replay/order/session-end grace |
| C1-11 | PASS | PASS | reconnect/equal-revision reconcile; stale HTTP/WS rejection |
| C1-12 | PASS | PASS | restarts keep data and receipts (both modes) |
| C1-13 | PASS | PASS | role/session isolation; blocked-write revoke/expiry; idle sweep |
| C1-14 | PASS | PASS | CORS/WS origin matrix; origin ≠ auth |
| C1-15 | PARTIAL | PARTIAL | build + deep-link pass; container flows in happy-dom; **real-browser interaction NOT RUN** |
| C1-16 | PASS | PASS | source/log/image/runner hygiene |

## Delivery hygiene

- `tests/run-in-docker.sh` no longer `exec`s past its EXIT trap (temporary source copy is removed) and forwards `DATABASE_URL`/`ALLOWED_ORIGINS` with `--env NAME`, so values never appear in process arguments. Static check recorded in evidence.
- The Mode A API now writes to `.local/logs/api-r03.log` (untracked). The earlier tracked `R02/evidence/mode-a-api.log` runtime append is **left dirty and unstaged**; R02 history is not rewritten or erased.
- Production images still exclude tests and the happy-dom dev dependency.

## Limitations / NOT RUN

- **Real-browser flows NOT RUN** in this session: no Playwright/Puppeteer/Chrome is available and Safari automation would change global configuration. C1-15 remains PARTIAL and the browser retest of R02-QA-04/05 stays with QA/Coordinator.
- R02-QA-05 deterministic mid-read commit interleaving was not achieved without adding production test hooks; the repeatable-read structure, equal-revision reconciliation and a concurrent stress test are the executed evidence. This is explicitly not claimed as a full proof.
- The authorization/send linearization boundary is documented as the per-socket revalidation immediately before send; a revoke committed after that point may race at most the in-flight frame, after which the socket is closed. No zero-race guarantee is claimed.
- Mobile, 30-client load/SLA, host reboot, full accessibility/security certification and crash-before-broadcast remain NOT RUN.

## Blockers / next gate

- **Blockers:** none to the fix scope. Environment limits only (sandboxed buildx → `DOCKER_BUILDKIT=0`; no browser automation).
- **Next gate:** independent QA retest of `cce8db1` plus targeted browser verification (R02-QA-04/05, C1-RV-02 boundary), then user trial/acceptance. No push, deploy, tunnel, image publication, paid service or destructive reset was performed.
- **Services left running:** Mode A db `c1a-db-1` (5433), API 127.0.0.1:3000, static production web 127.0.0.1:5173; Mode B `c1b-api`/`c1b-db`/`c1b-web` (3001/5434/5174). Normal stop only, never `down -v`/prune.

## Skill usage
- `tdd` (READ_LOADED): genuine RED→GREEN at API/PostgreSQL/WS and React-container seams for every finding; pre-fix logs retained.
- `ponytail` (READ_LOADED): smallest complete change — one receipt insert, in-transaction grant recheck, one repeatable-read view, config for the sweep; no new runtime dependencies or policy changes.
- `diagnosing-bugs` (UNVERIFIED/not loaded): two test-harness defects (async helper adopting the lock promise) were found from RED output and fixed without weakening assertions.
