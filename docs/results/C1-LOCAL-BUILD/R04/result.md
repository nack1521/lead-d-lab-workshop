# C1-LOCAL-BUILD / R04 — Verification-only evidence gates (C1-EG-01, C1-EG-02)

- **Task ID:** `C1-LOCAL-BUILD`
- **Run ID:** `R04`
- **Reported at:** 2026-11-08T14:54:17+07:00 (Asia/Bangkok)
- **Producer:** DeepSeek Harness (single active coding writer)
- **Model:** `deepseek-v4.1-flash-1017` (runtime-reported, unverified)
- **Review input:** `docs/implementation/C1-REVIEW-SUMMARY-R03.md` (PARTIAL / EVIDENCE_GATES_OPEN; no new confirmed defect)
- **Baseline HEAD at start:** `6c75daa`; **build HEAD:** `62bfa8d54c4f01a54a2d08648032637c16f6e850` (`main`, not pushed)
- **Protected dirty paths preserved unchanged:** `docs/AI-PROGRESS.md`, `docs/handoffs/ANTIGRAVITY-C1.md` (plus the pre-existing R02 live-log append, left unstaged)
- **Task status:** **READY_FOR_REVIEW** — both evidence gates executed with controlled tests; not independent QA or human acceptance.

## Scope

Verification only. No confirmed defect was fixed, no application behavior or access/attempt policy changed, and the already-resolved R01/R02/R03 paths were not reopened. Two narrowly scoped additions:

1. A test-boundary barrier around the application's existing PostgreSQL client (`tests/sql-barrier.ts`) — test-only plumbing passed through the test helper; production code does not use it.
2. A minimal inert `beforeSend` hook on the WebSocket hub (`HubTestHooks`) — only `startServer(..., hooks)` from tests supplies it; production construction never does. It exists solely to place a revoke/expiry exactly between per-socket revalidation and send.

## C1-EG-01 — controlled participant-snapshot interleave: **PASS (executed)**

- **Criterion:** a controlled commit occurs after the reader starts its snapshot but before later component reads; a complete old view and a complete new view are inspected; revision, active question, own response and participant identity agree within each view; real PostgreSQL repeatable read, no mocked persistence.
- **Method:** the barrier wraps the app's DB client and pauses a participant snapshot reader immediately after its repeatable-read session read. A real `POST /submissions` then commits (HTTP 201) while the reader is paused; the barrier is released and the reader finishes from its old snapshot. A later `/api/me` reads the new state. The same pattern is repeated for the participant WebSocket frame: the broadcast's snapshot build is paused, a real submission commits, then the old frame and the post-commit frame are inspected.
- **Actual (HTTP):** old view = revision `R`, `active_question_id` = rating question, owner identity = participant, `own_response = null`; new view = revision `R+1`, question matches active question, own response answers that question with rating 4; DB confirms revision `R+1` and one response. The commit was confirmed (201) before the old view resolved, and the old view is still complete.
- **Actual (WS):** frames observed at revision `R+1` (question open, own answer null) and `R+2` (own answer present and matching the frame's question); every observed state frame is internally coherent.
- **Evidence:** `tests/evidence-gates.test.ts`, `evidence/evidence-gates.log`.
- **Limitation:** this proves the scheduled interleave at the DB-client seam and WS frame seam; it is not an exhaustive proof over every possible scheduler interleaving and does not cover crash-before-broadcast.

## C1-EG-02 — documented WS authorization/send boundary and lifetime equality: **PASS (executed)**

- **Criterion:** controlled revoke/expiry around the documented per-socket authorization/send boundary with actual frames/close outcomes; valid and invalid sides; precise hard-TTL/grace equality; account for explicit disconnect and the possible in-flight frame; no invented zero-race policy.
- **Boundary documented:** `docs/implementation/C1-WS-AUTHORIZATION-BOUNDARY.md`. Payload build → per-socket re-authentication (the linearization point) → send. A revoke/expiry committing after revalidation can interleave with at most the frame already being written; explicit participant revocation closes sockets immediately; the next send/resync fails with 4401; an idle sweep (default 30 s) closes sockets whose grant stopped being valid. No stricter retention policy was introduced.
- **Equality semantics (real DB rows, executed):** hard TTL is valid only while `now < expires_at` (exact equality is expired); participant session-end grace is readable while `now <= ended_at + grace` (exact equality readable, +1 ms is `GRACE_EXPIRED`); hard TTL wins inside grace; revocation is immediate at any instant; facilitator hard-TTL equality is expired. These are recorded as the interpretation of the existing approved policy, not a policy change.
- **Controlled boundary outcomes (executed):**
  - valid side: an authorized participant receives the broadcast state frame;
  - expiry placed between revalidation and send: exactly the already-built in-flight frame is delivered, then `resync` returns `UNAUTHORIZED` and closes 4401 with no further state frames;
  - revocation placed between revalidation and send: the explicit disconnect closes the socket and no state frame from that broadcast reaches the revoked participant.
- **Evidence:** `tests/evidence-gates.test.ts`, `evidence/evidence-gates.log`.
- **Limitation:** the admitted in-flight-frame window is inherent to the existing boundary and is documented, not eliminated. Exact wall-clock equality for the production 4h/8h TTL and 15m grace is proven at the authorization seam with real DB timestamps (equality at chosen instants), not by waiting out production durations.

## Prior IDs preserved (not reopened)

| ID | Current disposition |
|---|---|
| R02-QA-01, R02-QA-02, R02-QA-03, R02-QA-04 | RESOLVED_TARGETED (R03 review) — regressions still pass |
| R02-QA-05 | STRUCTURAL_FIX_VERIFIED; its evidence gap is now covered by C1-EG-01 |
| C1-RV-01..C1-RV-04 | Addressed across R02/R03; unchanged |
| C1-RV-05 (C1-UI-01) | RESOLVED_TARGETED_BROWSER retained; transition regressions still pass |
| C1-RV-02 | Tested paths pass; boundary + equality evidence now provided by C1-EG-02 |
| C1-UI-02 | Retained under C1-RV-03 |
| C1-EG-01, C1-EG-02 | PASS (executed evidence, this run) |

## Current-build regression (both approved modes)

| Check | Result |
|---|---|
| `bun test tests` (Mode A) | **91 pass / 0 fail**, 455 expect, 11 files |
| `bun x tsc --noEmit` | exit 0 |
| Mode B Docker-only runner from committed source | **91 pass / 0 fail**, 453 expect, 11 files |
| Mode B api+db restart | ready 200, containers healthy, runner has no `exec`/inline secret argument, image has no tests/happy-dom |

## Cases C1-01–C1-16 (current build)
No application behavior changed in this run, so the R03 dispositions carry forward on a re-run of the same suite: **C1-01..C1-14 and C1-16 PASS** in required modes; **C1-15 PARTIAL** — production build and deep-link pass, container flows exercised in happy-dom, but real-browser interaction remains **NOT RUN** (no browser automation in this session).

## NOT RUN / limitations
- Real-browser retest (C1-15 interactive, browser-level R02-QA-04/05 evidence) — NOT RUN by this writer; QA/Coordinator owns it.
- Physical mobile, 30-client load/SLA, host reboot, real crash-before-broadcast, full accessibility/security certification — NOT RUN.
- Deterministic proof over every scheduler interleaving and the production-duration TTL/grace waits — not attempted; recorded as limits above.
- Independent QA and human acceptance — not granted.

## Gates / next
- **Remaining gates:** independent QA/browser retest of `62bfa8d` (or the docs commit that follows), then user trial/acceptance. No push, deploy, tunnel, image publication, paid service or destructive reset was performed; services and volumes remain for review (normal stop only).
- **Services left running:** Mode A db `c1a-db-1` (5433), API 127.0.0.1:3000 (logging to `.local/logs/api-r03.log`), static web 127.0.0.1:5173; Mode B `c1b-api`/`c1b-db`/`c1b-web` (3001/5434/5174).

## Skill usage
- `tdd` (READ_LOADED): barrier-driven verification tests written at the existing seams; results recorded as evidence, not as invented defect RED.
- `ponytail` (READ_LOADED): two minimal additions only — a test-only DB-client barrier and an inert hub hook; no production behavior change.
- `diagnosing-bugs` (UNVERIFIED/not loaded): a first attempt using PostgreSQL table locks deadlocked with the writer's foreign-key checks; replaced by the DB-client barrier and documented rather than worked around with sleeps.
