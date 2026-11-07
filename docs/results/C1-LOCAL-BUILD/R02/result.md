# C1-LOCAL-BUILD / R02 — R01 review fixes, both-mode regression and evidence

- **Task ID:** `C1-LOCAL-BUILD`
- **Run ID:** `R02`
- **Reported at:** 2026-11-07T17:26:01+07:00 (machine time, Asia/Bangkok)
- **Producer:** DeepSeek Harness (Agent Teams lead, single active coding writer)
- **Model:** `deepseek-v4.1-flash-1017` (runtime-reported identifier, not independently verified)
- **Source kind:** `direct`
- **Review input:** `docs/implementation/C1-REVIEW-SUMMARY-R01.md` (CHANGES_REQUESTED, 5 deduplicated groups from 6 source IDs)
- **Baseline HEAD at start:** `340c0d1` (review documentation; application source was `c5ed399`)
- **Build HEAD after fixes:** `da30003a805cc6b0e133bdc9ac94ae001419e488` (`main`, not pushed)
- **Protected dirty paths preserved:** `docs/AI-PROGRESS.md`, `docs/handoffs/ANTIGRAVITY-C1.md` (hashes unchanged)
- **Task status:** **READY_FOR_REVIEW** — fixes and current-build execution evidence exist; not independent QA or human acceptance.

## What changed (scoped to the five review groups)

| Group | Fix |
|---|---|
| **C1-RV-01** (QA-C1-01) | `submission_receipts` now stores terminal rejections too (migration `0002`, `outcome`/`code`/`message`). Rejection is produced inside the same session-row-locked transaction that checks receipts/response uniqueness, so the same key always replays the same outcome, a changed payload is `IDEMPOTENCY_CONFLICT`, and concurrent same-key attempts cannot commit two outcomes. Auth 401/403, throttling 429, proxy/HTML errors and 5xx now return `terminal:false` and are never certified non-save; internal errors roll back both the response and the receipt. Client classification uses an explicit terminal-code allowlist. |
| **C1-RV-02** (QA-C1-02) | Already-open sockets re-authenticate on every `resync` and `broadcast` (plus a 30 s sweep): hard TTL expiry, session-end read grace and revocation close them with `UNAUTHORIZED` + 4401 before any data. Participant and facilitator variants cover resync and publish paths. |
| **C1-RV-03** (QA-C1-03 + C1-UI-02) | The join form keeps one pending operation key and immutable join payload for an uncertain join to the same room; nickname edits reuse it, a different room code is an explicit new join. The API join is idempotent per `(session, join_key)` and one logical join now creates one participant. |
| **C1-RV-04** (QA-C1-04) | A new participant advances `sessions.revision` inside the join transaction and the committed snapshot is published after commit (join-only count changes are visible). The join retry does not bump revision. Client drops strictly older HTTP `/api/me` responses as well as older WS state, accepts an equal-revision authenticated reconnect snapshot, and shows Live only after a fresh authorized snapshot. |
| **C1-RV-05** (C1-UI-01) | Participant outcome/draft/attempt state is keyed by authoritative question id. A saved answer no longer locks the next unanswered question, returning to an answered question shows the saved state again, and an unresolved earlier attempt stays with its own question during a transition. |

Attempt policy, grant lifetimes, Thai copy and the one-instance stack are unchanged.

## Real commands and exit codes (current build)

| Command | Exit | Result |
|---|---|---|
| `bun test tests/findings-api.test.ts` (before fix) | 1 | 7 fail / 2 pass — genuine RED |
| `bun test tests/findings-client.test.tsx` (before fix) | 1 | 6 fail / 0 pass — genuine RED |
| `bun x tsc --noEmit -p tsconfig.json` | 0 | no type errors |
| `bun run migrate` (Mode A) | 0 | `0002_terminal_receipts.sql` applied |
| `bun test tests` (Mode A, host Bun + Docker PostgreSQL) | 0 | **71 pass / 0 fail, 342 expect(), 9 files** |
| `bun run build:web` | 0 | production bundle rebuilt (162.80 kB js, 2.53 kB css) |
| Mode A live HTTP flow | 0 | join revision 6→7; terminal 422 with `terminal:true`; same key replay 422 `replay:true`; same key different payload 409 `IDEMPOTENCY_CONFLICT`; 401 `terminal:false`; facilitator `participant_count=4`; DB receipt `rejected/VALIDATION_FAILED` |
| `docker compose restart db` (Mode A, no `-v`) | 0 | ready 200; revision 7 / participants 4; responses 4, receipts 5, rejected 1 |
| Mode A API process restart | 0 | ready 200; snapshot revision 7, participants 4 |
| Mode B `docker compose -p c1b --profile full build` | 0 | images rebuilt from `da30003` (with `DOCKER_BUILDKIT=0` because the sandbox blocks the buildx activity dir) |
| Mode B `docker compose -p c1b --profile full up -d` | 0 | api/db/web healthy on 3001/5434/5174 |
| Mode B schema check | 0 | `0001_init.sql`, `0002_terminal_receipts.sql`; receipt columns `code`, `message`, `outcome` |
| Production image hygiene | 0 | no `tests/`, no `.env`, `happy-dom` count = 0 |
| `tests/run-in-docker.sh c1b_default` (Docker-only runner) | 0 | **71 pass / 0 fail, 341 expect(), 9 files** |
| Mode B simultaneous `restart api db` | 0 | ready 200; over-limit receipt durable, replay stable, conflict 409; DB response count unchanged |
| C1-16 scans | 0 | no tracked password, no grant/nickname/comment logging, no secret in image env, API log clean |

## TDD evidence (this round)

- API/DB/WS seams: `findings-api.test.ts` first run **exit 1, 7 fail** (RED log saved), then **exit 0, 9 pass** after the server changes.
- React-container seams: `findings-client.test.tsx` first run **exit 1, 6 fail** (RED log saved), then **exit 0, 6 pass** after the client changes.
- Two test-harness defects found by red runs were fixed without weakening assertions: shared facilitator grant expiry between WS sub-cases, and mutated happy-dom globals leaking into later test files (now restored in `afterAll`).
- No old PASS was copied forward: every status below was re-executed on `da30003`; R01 evidence and R01 result remain unchanged.

## Findings

### C1-RV-01 — terminal non-save, stable receipts and in-flight safety
- **Status:** **FIXED**
- **Fix:** durable `rejected` receipts (outcome/code/message/fingerprint) written in the same transaction as the receipt/uniqueness checks under the session row lock. Same key + same payload → same terminal outcome with `replay:true`; same key + changed payload → 409 conflict; auth/429/5xx are `terminal:false`; DB failure rolls back response and receipt; concurrent same-key attempts resolve to one outcome.
- **Evidence:** `evidence/findings-api-red.log`, `evidence/findings-api-green.log`, `evidence/mode-a/r02-http-evidence.log`, `evidence/mode-b/restart-and-receipts.log`, `tests/findings-api.test.ts`.
- **Limitation:** delayed-original-vs-reconcile is proven by serialising same-key requests on the session row and the durable receipt, not by a network-level delayed transport harness.

### C1-RV-02 — already-open WebSocket grant lifetime
- **Status:** **FIXED**
- **Fix:** every resync/broadcast re-authenticates the socket token (expiry, session-end grace, revocation) and a 30 s sweep closes stale sockets; tests cover expired facilitator resync, participant past grace, and broadcast to an expired grant.
- **Evidence:** `evidence/findings-api-green.log` (3 C1-RV-02 cases), `tests/findings-api.test.ts`, `apps/api/src/ws.ts`.
- **Limitation:** the sweep interval itself is not time-advanced in tests; resync/broadcast enforcement is executed.

### C1-RV-03 — lost join acknowledgement creates another participant
- **Status:** **FIXED**
- **Fix:** tab-scoped pending join operation `{key, joinCode}` reused for uncertain unchanged retries; nickname edits reuse it; a different room code starts a new join. Server join remains idempotent per `(session_id, join_key)`.
- **Evidence:** `evidence/findings-client-red.log`, `evidence/findings-client-green.log`, `tests/findings-client.test.tsx`, `tests/join.test.ts`.
- **Limitation:** exercised through the real React container in happy-dom with a stubbed transport, not a real browser; a real-browser retest remains for QA.

### C1-RV-04 — monotonic snapshots, join visibility and truthful Live
- **Status:** **FIXED**
- **Fix:** join bumps revision atomically and publishes after commit; retry does not bump; client drops strictly older HTTP and WS state, accepts equal-revision authenticated reconnect snapshots, and Live is only set from a fresh authorized snapshot.
- **Evidence:** `evidence/findings-api-green.log` (join revision/publish), `evidence/findings-client-green.log` (stale HTTP, Live, reconnect), `evidence/mode-a/r02-http-evidence.log`.
- **Limitation:** real-browser timing interleavings NOT RUN; covered by container/DOM tests and server revisions.

### C1-RV-05 — saved outcome incorrectly carries into the next question
- **Status:** **FIXED**
- **Fix:** outcome/draft/attempt/own-response state is keyed by question id; new question derives draft (or saved only with its own accepted response); unanswered next question is usable; unknown attempt is preserved on its own question.
- **Evidence:** `evidence/findings-client-red.log`, `evidence/findings-client-green.log`, `tests/findings-client.test.tsx`.
- **Limitation:** real-browser rating→poll→return flow NOT RUN by this writer; QA/Coordinator browser retest is the next gate.

## Cases C1-01–C1-16 (current build only)

Mode A = host Bun 1.4.4 + Docker PostgreSQL 5433; Mode B = fresh worktree Docker-only (5174/3001/5434). PASS requires execution on `da30003`; R01 PASS is not reused.

| ID | Mode A | Mode B | Actual this run | Evidence |
|---|---|---|---|---|
| C1-01 | PASS | — (Mode B case) | health 200, ready 200 (real DB), migration 0002 applied, join against live API | `mode-a/r02-http-evidence.log` |
| C1-02 | — (Mode A case) | PASS | images rebuilt, stack healthy, schema 0002, DB readback, Docker-only suite 71 pass | `mode-b/verify.log`, `mode-b/container-suite.log` |
| C1-03 | PASS | PASS | join/retry/nickname tests; RV-03 UI key reuse in real React container | `findings-client-green.log`, `tests/join.test.ts` |
| C1-04 | PASS | PASS | atomic rating+comment; injected DB failure leaves no response/receipt | full regression log |
| C1-05 | PASS | PASS | poll+comment; invalid option/type/rating persisted yes/no rows correct | full regression log |
| C1-06 | PASS | PASS | grapheme boundaries, whitespace, escaped text, payload budgets | full regression log |
| C1-07 | PASS | PASS | accepted replay, concurrent retry count-once, conflict | full regression log |
| C1-08 | PASS | PASS | terminal receipt replay/fresh attempt/unknown reconcile (client attempt policy) | `findings-api-*`, `findings-client-*` |
| C1-09 | PASS | PASS | aggregate after commit without nickname/comment; resync/broadcast lifetime enforced | full regression log |
| C1-10 | PASS | PASS | close/replay/order/session-end grace | full regression log |
| C1-11 | PASS | PASS | reconnect snapshot equals DB revision; stale HTTP/WS rejected; equal-revision resync accepted | `findings-client-green.log`, `tests/lifecycle.test.ts` |
| C1-12 | PASS | PASS | DB restart (no `-v`) and API/container restart keep data, revision and rejected receipts | `mode-a/restart-*`, `mode-b/restart-and-receipts.log` |
| C1-13 | PASS | PASS | role/session isolation; missing/expired/revoked; open-socket expiry/grace | `findings-api-green.log`, full regression log |
| C1-14 | PASS | PASS | CORS/WS origin allow/deny/null/missing; origin ≠ auth | full regression log |
| C1-15 | PARTIAL | PARTIAL | production build and deep-link 200; approved Thai copy and container flows exercised in react-dom/happy-dom; **real-browser interaction NOT RUN** | `mode-a/r02-http-evidence.log`, `findings-client-green.log` |
| C1-16 | PASS | PASS | source/log/image scans; no dev/test deps in production images | `c1-16-security-scan.log`, `mode-b/verify.log` |

## Blockers, limits and next gate
- **Blockers:** none to the fix scope. Environment limitations recorded: sandboxed buildx path requires `DOCKER_BUILDKIT=0` for Mode B image builds; no browser automation available, so real-browser retest of C1-RV-03/05 flows and C1-15 is **NOT RUN** by this writer.
- **Not verified:** real-browser question transitions / lost-ack journeys / reconnect in an actual browser; real mobile; 30-client load/SLA; host reboot; full accessibility/security certification.
- **Next gate:** independent QA/browser verification of `da30003` against the five group acceptances, then user trial/acceptance. No push, deploy, tunnel, image publication, paid service or destructive reset was performed.
- **Services left running:** Mode A db `c1a-db-1` (5433), API 127.0.0.1:3000, static production web 127.0.0.1:5173; Mode B `c1b-api`/`c1b-db`/`c1b-web` (3001/5434/5174). Normal stop only, never `down -v`/prune. Fixtures remain untracked in `.local/fixtures.json` and `/tmp/c1-fixtures.json` inside `c1b-api`.

## Skill usage

| Skill | Load status | Applied to | Evidence | Limitation |
|---|---|---|---|---|
| `tdd` (`.agents/skills/tdd/SKILL.md`) | READ_LOADED | RED→GREEN at API/DB/WS and React-container seams for all five groups | `evidence/findings-*-red/green.log` | Host has no Antigravity activations; file read by this writer, not host-activated |
| `ponytail` (`.agents/skills/ponytail/SKILL.md`) | READ_LOADED | smallest complete fix: one migration, in-transaction receipts instead of a new service, no new runtime dependencies | commits, `package.json` | Validation/security/tests were not reduced |
| `diagnosing-bugs` | UNVERIFIED (not loaded) | two real harness defects fixed from observed logs (shared grant expiry between tests, leaked globals) | red logs | — |

## Honest scope notes
- All statuses above were executed on build `da30003`; R01 files and R01 PASS claims were not copied forward and R01 evidence was restored to its committed content after detection of one accidental SIGTERM line.
- The R01 review's independent browser reproductions are not re-run here; those browser journeys remain the QA/Coordinator retest gate.
- Protected `docs/AI-PROGRESS.md` and `docs/handoffs/ANTIGRAVITY-C1.md` were not staged or modified.
