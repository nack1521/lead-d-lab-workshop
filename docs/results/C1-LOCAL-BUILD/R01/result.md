# C1-LOCAL-BUILD / R01 — Local tracer bullet implementation and execution record

- **Task ID:** `C1-LOCAL-BUILD`
- **Run ID:** `R01`
- **Reported at:** 2026-11-07T16:46:40+07:00 (machine time, Asia/Bangkok)
- **Producer:** DeepSeek Harness (Agent Teams lead, single active coding writer)
- **Model:** `deepseek-v4.1-flash-1017` (identifier reported by the harness runtime; not independently verified)
- **Source kind:** `direct`
- **Baseline HEAD at start:** `e92e96a912c12bf35d6527077a8d83ed9c9a4886`
- **Current HEAD (this record):** `c5ed399aae53fed4c04229fecea546739f0b3b44` (`main`, ahead 30, not pushed)
- **Protected dirty paths left untouched (hashes unchanged):** `docs/AI-PROGRESS.md` `d28a75f1…54`, `docs/handoffs/ANTIGRAVITY-C1.md` `d361d2de…70b`
- **Task status:** **READY_FOR_REVIEW** — implementation and current-build execution evidence exist; this is not independent QA or human acceptance.

## What this change is

The smallest approved vertical tracer bullet: React (Vite) frontend, Elysia on Bun API, real PostgreSQL, authenticated native WebSocket, one API instance. Participants join a fixture session without an account, answer a rating or poll question with an optional comment, the answer commits in one transaction with a stable idempotency receipt, the facilitator sees an aggregate from the committed state through an authenticated socket, and accepted data survives reconnects and process/container restarts.

Not built (out of scope, unchanged): HR dashboard, multi-organisation, accounts/login, Redis/queue, AI summary, polished 19-screen UI, production load/SLA, mobile certification, deployment, image publishing.

## Decisions taken inside the approved scope

| Topic | Decision | Why |
|---|---|---|
| Driver/ORM | `postgres` 3.4.5 (postgres.js) with hand-written SQL migrations; Drizzle omitted | Smallest path that still gives transactions, FK/unique constraints and real-DB tests; Drizzle was explicitly a proposal, not a requirement |
| CORS | Explicit manual allowlist in the Bun fetch handler; `@elysiajs/cors` not installed | One less dependency; behaviour is directly testable (204 allow / 403 deny) |
| Auth | Opaque 32-byte tokens, SHA-256 hashed at rest; `Authorization: Bearer`; WS first-message auth | No grants in URLs, query strings, bundles or logs |
| Ordering | `SELECT … FOR UPDATE` on the session row in both submit and close/end transactions | Deterministic close/submit serialisation and one accepted answer per participant+question |
| Rejection contract | Structured `{status:"rejected", code, terminal:true}` only for certified non-save; everything else is UNKNOWN | Follows the approved R02/R03 terminal/unknown distinction |
| Mode B | Same compose file, separate project (`-p c1b`), separate volume/ports, images built inside Docker | No host Bun, node_modules or existing DB used |
| Client state | Pure functions in `apps/web/src/state.ts`; grants/drafts only in memory | Testable attempt policy; no persistent browser storage for drafts |

## Real commands, versions and exit codes (current build)

| Command | Exit | Result |
|---|---|---|
| `bun --version` | 0 | `1.4.4` (host) |
| `docker --version` / `docker info --format '{{.ServerVersion}}/{{.Architecture}}'` | 0 / 0 | `29.9.2`, `29.9.2/aarch64` |
| `curl` npm advisory bulk endpoint for the pinned set | 0 | `{}` — no advisories returned for the exact pins |
| `docker pull postgres:16.15-alpine` | 1 then 0 | First attempt: `short read: expected 108823817 bytes but got 101396136: unexpected EOF`; retry succeeded, digest `sha256:aa6cb33cf4c19c765cefcf48d96176258800870a9a1e930ad126200f9d825139` (arm64/linux) |
| `docker pull oven/bun:1.4.4-alpine` | 0 | digest `sha256:4cf82f5686b196504fe119db3fcd9185b191f82ece82c40680e597228ec6070a` (arm64/linux) |
| `bun install` | 0 | 88 packages, `bun.lock` written |
| `bun run migrate` | 0 | `migrations applied: 0001_init.sql` |
| `bun run bootstrap` | 0 | `fixtures ready: ROOM-01, ROOM-02; grants written to .local/fixtures.json` |
| `docker compose up -d db` | 0 | `c1a-db-1` Up (healthy) `127.0.0.1:5433->5432` |
| `bun test tests` (Mode A, host Bun + Docker PostgreSQL) | 0 | **56 pass, 0 fail, 259 expect(), 7 files** |
| `bun x tsc --noEmit -p tsconfig.json` | 0 | no type errors |
| `bun run build:web` | 0 | `dist/assets/index-*.js 161.27 kB`, `index-*.css 2.53 kB`, built in 310 ms |
| Mode A HTTP flow (join/submit/replay/new-key/snapshot/DB readback) | 0 | 201 / 200 replay / 200 deduplicated / snapshot revision 1 / DB `1|4`, receipts `1` |
| `docker compose restart db` (no `-v`) then readback | 0 | `ready HTTP 200`; responses/receipts/participants unchanged `1/1/1`; volume `c1a_c1_pgdata` |
| Stop + restart API process then readback | 0 | `ready HTTP 200`; snapshot revision 1, total 1 |
| Mode B `docker compose -p c1b --profile full build` | 1 then 0 | First attempt failed: `failed to update builder last activity time: open /Users/aiink/.docker/buildx/activity/...: operation not permitted` (sandboxed buildx dir). Retried with `DOCKER_BUILDKIT=0` → both images built |
| Mode B `docker compose -p c1b --profile full up -d` | 0 | `c1b-api-1` healthy `127.0.0.1:3001`, `c1b-db-1` healthy `127.0.0.1:5434`, `c1b-web-1` `127.0.0.1:5174`, volume `c1b_c1_pgdata` |
| Mode B container test suite (`oven/bun` image, `-p c1b` network, no host Bun) | 0 | **56 pass, 0 fail, 260 expect()** |
| Mode B HTTP/deep-link flow | 0 | join 201, submit 201, snapshot total 1, DB `responses=1 receipts=1`, `/join` 200, `/facilitator` 200, bundle contains `127.0.0.1:3001`, evil origin 403 |
| Mode B `docker compose -p c1b restart api db` (first attempt) | 1 on readback | API exited: `connect ECONNREFUSED 172.19.0.3:5432` (migration raced DB start). Fixed by `docker/start-api.sh` retry entrypoint (commit `b572464`), rebuilt |
| Mode B restart after fix | 0 | `ready HTTP 200`, containers healthy, `responses=1 receipts=1 participants=1`, volume unchanged |
| C1-16 scans | 0 | no tracked DB password, no fixture file tracked, no grant/nickname/comment in logs, no `.env`/`.local` in image, no secret in image env |

Mode B images: `c1b-api` / `c1b-web` built from commits `6521f14` + `b572464`; the later commit `c5ed399` only adds a test assertion.

## TDD evidence (honest record)

- **Captured RED → GREEN (real):** `tests/web-state.test.ts` first run against stub functions: exit 1, 7 fail `not implemented` (`evidence/tdd/web-state-red.log`); after implementing `apps/web/src/state.ts`: exit 0, 7 pass (`evidence/tdd/web-state-green.log`).
- **Captured RED → GREEN (real):** `tests/lifecycle.test.ts` first run: exit 1, 2 fail (scenario expectations wrong: an already-accepted participant must receive the stable accepted outcome, and a closed question needed reopening). Corrected scenarios, then exit 0, 6 pass. `tests/submission.test.ts` first run: exit 1, 1 fail (double-read of a response body); fixed test, then exit 0, 13 pass.
- **Limitation:** for the first API slices (health/join, submission core) the implementation was authored in one pass before the test files existed, so their first recorded run was GREEN except the test defects above. No RED was fabricated; the vertical-slice test-first ordering required by the TDD skill was only partially followed. This is reported as a limitation, not claimed as full TDD.

## Cases

### C1-01
- **Expected:** Mode A runs native Bun + Docker PostgreSQL for real.
- **Mode A:** **PASS.** `bun --version` 1.4.4 exit 0; `docker info` exit 0; db healthy on 5433; `/health` 200 `{"status":"ok"}`; `/ready` 200 `{"status":"ready","db":"ok"}`; migrations applied exit 0.
- **Mode B:** NOT RUN (this case is the Mode A setup; Mode B is proven under C1-02).
- **Evidence:** `evidence/mode-a/mode-a-http-evidence.log`, `evidence/mode-a/api.log`.
- **Limitation:** none known for the case; single instance only.

### C1-02
- **Expected:** Mode B fresh worktree without host Bun/node_modules/old DB runs frontend/API/DB through Docker only.
- **Mode A:** NOT RUN (Mode B case).
- **Mode B:** **PASS.** `git worktree add .worktrees/c1-mode-b HEAD` (no `node_modules` present), separate project `c1b`, separate volume `c1b_c1_pgdata`, separate ports 5174/3001/5434. Images built from `oven/bun:1.4.4-alpine` and `postgres:16.15-alpine`; `ready` 200; join/submit/snapshot via 3001 with Origin 5174; DB readback `responses=1 receipts=1`; full test suite ran inside a Docker container on the `c1b` network (56 pass).
- **Evidence:** `evidence/mode-b/mode-b-http-evidence.log`, `evidence/mode-b/container-test-suite.log`.
- **Limitation:** the default buildx builder could not write its activity dir under the sandbox, so images were built with `DOCKER_BUILDKIT=0`. Same Dockerfile and images; not a stack change.

### C1-03
- **Expected:** anonymous join without an account; blank and duplicate nicknames allowed; unchanged join retry returns the same person.
- **Mode A:** **PASS** — 3 join tests (grant TTL ≈4h, blank/whitespace → NULL, duplicate nicknames, same `join_key` returns same participant_id, one participant row).
- **Mode B:** **PASS** — same suite inside Docker (56 pass).
- **Evidence:** `tests/join.test.ts`, `evidence/mode-a/full-test-suite.log`, `evidence/mode-b/container-test-suite.log`.
- **Limitation:** join code is exact-match; production invite distribution is outside C1.

### C1-04
- **Expected:** rating + comment commit together; a DB failure leaves no partial score/comment.
- **Mode A:** **PASS** — 201 accepted with rating 4 and comment readable from PostgreSQL; injected trigger failure on `submission_receipts` produced 500 and `responses=0`, `receipts=0`; the same attempt succeeded after the trigger was dropped.
- **Mode B:** **PASS** — same suite inside Docker.
- **Evidence:** `tests/submission.test.ts` ("a database failure during receipt insert leaves no partial rating or comment").
- **Limitation:** fault injection uses a temporary trigger; no storage-level replication/downstream failures.

### C1-05
- **Expected:** poll + comment works; wrong option, wrong type and out-of-range rating are rejected.
- **Mode A:** **PASS** — poll `time` + comment committed (`option_id=time`, `rating_value` NULL); `INVALID_OPTION` 422; `TYPE_MISMATCH` 422; ratings 0/6/2.5 → `INVALID_RATING` 422 with zero rows.
- **Mode B:** **PASS**.
- **Evidence:** `tests/submission.test.ts` (poll section).
- **Limitation:** fixture has 4 poll options; no multi-select.

### C1-06
- **Expected:** whitespace, grapheme limits, Thai/emoji counting and HTML-like text follow the contract with safe rendering.
- **Mode A:** **PASS** — nickname 40 graphemes accepted / 41 rejected with `ชื่อเล่นต้องไม่เกิน 40 ตัวอักษร`; comment 500 accepted / 501 rejected with `ข้อความต้องไม่เกิน 500 ตัวอักษร`; whitespace-only → NULL; ZWJ emoji and Thai combining marks counted as single graphemes; HTML-like text stored raw and SSR renders it escaped (`&lt;script&gt;…`).
- **Mode B:** **PASS** (same suites in container).
- **Evidence:** `tests/join.test.ts`, `tests/submission.test.ts`, `tests/web-views.test.tsx`, `tests/web-state.test.ts`.
- **Limitation:** real-browser DOM/XSS check NOT RUN (no browser automation available); escaping verified through React SSR output, not a live DOM.

### C1-07
- **Expected:** unchanged retry counts once sequentially and concurrently; same key with different payload is refused.
- **Mode A:** **PASS** — sequential retry 200 `replay:true`, one response/one receipt; three concurrent retries → statuses `[200,200,201]`, one response, one receipt; different payload → 409 `IDEMPOTENCY_CONFLICT`, original rating unchanged.
- **Mode B:** **PASS**.
- **Evidence:** `tests/submission.test.ts` (C1-07 section).
- **Limitation:** concurrency exercised with 3 concurrent requests, not a load profile.

### C1-08
- **Expected:** accepted answers are immutable; a terminal non-save allows an explicit fresh attempt while the question is open; unknown never unlocks a new key.
- **Mode A:** **PASS** — new key after acceptance returns 200 `deduplicated:true` with the original response id and one row; terminal 422 keeps zero rows and a fresh key then succeeds; `GET receipt` for an unused key returns 404 `{status:"unknown", terminal:false}` and the same key later replays accepted.
- **Mode B:** **PASS**.
- **Evidence:** `tests/submission.test.ts`, `tests/web-state.test.ts` (attempt gating), `tests/web-views.test.tsx` (P07 actions).
- **Limitation:** the full fresh-attempt journey was verified at API + client-state level, not in a real browser.

### C1-09
- **Expected:** facilitator in another context sees the aggregate from the real commit, without nickname or comment.
- **Mode A:** **PASS** — facilitator WS snapshot followed by a pushed snapshot with `total=1`, `counts{4:1}`, matching a direct DB count; serialized payload contains neither the nickname nor the comment; REST snapshot carries the same revision.
- **Mode B:** **PASS**.
- **Evidence:** `tests/facilitator-ws.test.ts`, `evidence/mode-a/facilitator-snapshot.json`, `evidence/mode-b/snapshot.json`.
- **Limitation:** single API instance, no multi-instance fanout/outbox (explicitly out of C1).

### C1-10
- **Expected:** deterministic close/submit ordering; replay of an accepted answer after close returns the same result; stale question after close is refused.
- **Mode A:** **PASS** — closed question → `QUESTION_CLOSED` 409 with no new row; accepted replay after close → 200 accepted; 5 concurrent submit/close rounds each resolved to exactly one serial order (accepted+closed with 1 row, or closed with 0 rows); session end → `SESSION_ENDED` for a non-answered participant while an accepted replay still returns 200; read-own receipt works in the grace window.
- **Mode B:** **PASS**.
- **Evidence:** `tests/lifecycle.test.ts`.
- **Limitation:** race coverage is probabilistic ordering, not a deterministic interleaving harness; receipt grace boundary (15 min) was not advanced with a fake clock.

### C1-11
- **Expected:** dropped ack / reconnect yields an authoritative snapshot equal to the DB; no fake saved state or duplicates.
- **Mode A:** **PASS** — submission committed while the facilitator socket was disconnected appears on reconnect; snapshot revision equals the DB `sessions.revision`; counts equal the DB count; `resync` returns the same revision; duplicate counts never appear.
- **Mode B:** **PASS**.
- **Evidence:** `tests/lifecycle.test.ts` (C1-11 section).
- **Limitation:** process death between commit and broadcast was simulated by disconnecting the client, not by killing the server mid-broadcast.

### C1-12
- **Expected:** restarting API and DB without deleting volumes keeps accepted data, receipts and state.
- **Mode A:** **PASS** — `docker compose restart db` (no `-v`) exit 0, `ready` 200, responses/receipts/participants `1/1/1`, snapshot revision 1; API stop + restart exit 0, same readback.
- **Mode B:** **PASS after fix** — first simultaneous `restart api db` left the API exited (`ECONNREFUSED` during migration); the retry entrypoint fixed it and the second restart returned `ready` 200 with `responses=1 receipts=1 participants=1` and volume `c1b_c1_pgdata` intact.
- **Evidence:** `evidence/mode-a/restart-db-evidence.log`, `evidence/mode-a/restart-api-evidence.log`, `evidence/mode-b/restart-evidence.log`.
- **Limitation:** host reboot and Docker engine restart are NOT RUN.

### C1-13
- **Expected:** role/session isolation; expired/missing/revoked grants are rejected for reads and writes; no pre-auth WS data.
- **Mode A:** **PASS** — participant → facilitator snapshot/close 403; cross-session submission 403 with zero rows; facilitator of session A → session B 403; missing token 401; expired grant 401; revoked grant 401 on write and read; pre-auth WS sends nothing and drops messages; bad token → error frame + close 4401; participant requesting `facilitator_snapshot` → `FORBIDDEN`, no snapshot.
- **Mode B:** **PASS**.
- **Evidence:** `tests/facilitator-ws.test.ts`.
- **Limitation:** grant expiry tested via SQL time shift, not by waiting 4h; no admin-plane account model in C1.

### C1-14
- **Expected:** CORS allow/deny/null and WS Origin allow/deny/null/missing; Origin does not replace auth.
- **Mode A:** **PASS** — preflight from allowed origin 204 with exact `Access-Control-Allow-Origin`; denied and `null` origins → 403 without ACAO; no-Origin `curl` allowed for HTTP; WS upgrade refused for evil/null/missing Origin; allowed Origin without a grant → 401.
- **Mode B:** **PASS** — same contract with 5174/3001; evil origin 403 (`evidence/mode-b/mode-b-http-evidence.log`).
- **Evidence:** `tests/facilitator-ws.test.ts`, `evidence/mode-a/mode-a-http-evidence.log`.
- **Limitation:** tested with synthetic Origin headers, not multiple real browser engines.

### C1-15
- **Expected:** production frontend build and deep-link reload work; labels, multiline Enter and basic error recovery hold.
- **Mode A:** **PARTIAL** — `bun run build:web` exit 0; production bundle served by `docker/web-serve.ts`; `/join` and `/facilitator` return 200 HTML with the SPA root; JS/CSS assets 200; Vite dev server (`bun run web`) also served `/join` 200; SSR tests assert approved Thai labels, textarea multi-line value, terminal error copy and fresh-attempt actions, unknown/reconcile copy, stale facilitator state.
- **Mode B:** **PARTIAL** — images built with the production build; `/join` and `/facilitator` on 5174 return 200; bundle contains the Mode B API base `127.0.0.1:3001`.
- **Evidence:** `evidence/mode-a/mode-a-http-evidence.log`, `evidence/mode-b/mode-b-http-evidence.log`, `tests/web-views.test.tsx`.
- **Limitation:** real-browser interaction (click/typing/reload in a live browser) and mobile devices are **NOT RUN** — no browser automation is available on this host (only Safari.app; no Playwright/Puppeteer/Chrome) without changing global configuration, which is out of scope. Do not read PARTIAL as a passed browser check.

### C1-16
- **Expected:** no secrets, raw nicknames or comments in aggregates/logs/image context; README commands match reality.
- **Mode A:** **PASS** — only `.env.example` is tracked; the local DB password appears in no tracked file; no `.local`/fixtures tracked; source contains no grant/nickname/comment logging; API logs contain only the sanitised startup line (no tokens, nicknames, comments or password); images contain no `.env` and no `.local` directory; runtime secrets are injected by compose, not baked into image env; README commands were the ones actually run.
- **Mode B:** **PASS** — same checks; Mode B image env shows only base PATH/Bun variables.
- **Evidence:** `evidence/c1-16-security-scan.log`.
- **Limitation:** scans are pattern-based and local; no SAST/DAST or third-party security review.

## Blockers / next gate

- **Blockers:** none for this tracer bullet. Environment limitations (recorded, not blockers): sandboxed buildx dir → legacy builder for Mode B images; no Node runtime (TypeScript compiled with `bun x tsc`); no browser automation → C1-15 PARTIAL; no Chrome/Playwright installation attempted (would need approval and global changes).
- **Next gate:** Coordinator / Senior QA independent verification against this record; then user trial/acceptance of the implementation. Push, deploy, public tunnel, image publishing, paid services and destructive reset remain **not approved**.
- **Services left running (safe to inspect):** Mode A db `c1a-db-1` (5433), API on 127.0.0.1:3000, static production web on 127.0.0.1:5173; Mode B stack `c1b-api`/`c1b-db`/`c1b-web` (3001/5434/5174). Stop with `docker compose stop` / `docker compose -p c1b stop` — never `down -v` or prune.
- **Fixtures:** `.local/fixtures.json` (host, untracked) and `/tmp/c1-fixtures.json` inside `c1b-api`; grants are local-only and must not be copied into reports.

## Skill usage

| Skill | Load status | Applied to | Evidence | Limitation |
|---|---|---|---|---|
| `tdd` (`.agents/skills/tdd/SKILL.md`) | READ_LOADED | Vertical integration slices, test seams at HTTP/WS/DB, real RED→GREEN for `web-state` and lifecycle/submission scenario fixes | `evidence/tdd/`, `tests/` | Host has no Antigravity Customizations; file read by this writer, not host-activated. First API slices were not test-first (recorded above) |
| `ponytail` (`.agents/skills/ponytail/SKILL.md`) | READ_LOADED | Smallest complete change: postgres.js instead of an ORM, manual CORS instead of an extra plugin, no extra dependencies, no speculative features | `package.json`, `apps/`, this record | Not a licence to skip validation/security/tests; none were skipped |
| `codebase-design`, `diagnosing-bugs`, `unslop` | UNVERIFIED / not loaded this run | — | — | Not used; UI deliberately functional, visual polish outside C1 |

## Honest scope notes

- Implementation, tests and evidence were produced by one writer (DeepSeek Harness) in this session; the record is self-report and does not replace independent QA.
- Nothing was pushed, deployed, published or tunnelled. No global configuration, no paid service, no destructive reset, no volume deletion.
- Protected dirty files `docs/AI-PROGRESS.md` and `docs/handoffs/ANTIGRAVITY-C1.md` were not staged or modified.
