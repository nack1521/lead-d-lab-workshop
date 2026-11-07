# C1-LOCAL-BUILD R01 — Independent Senior QA

**Verdict: CHANGES_REQUESTED.** The existing Mode A suite passes, but static inspection identifies high-severity deviations in receipt/attempt safety, WebSocket grant lifetime, join retry, and snapshot freshness. Findings below are code-path findings, not independently executed reproductions. No human acceptance or ticket closure is implied.

Reviewer: canonical `lead-d-qa` | 2026-11-07 16:51:48 +0700  
Observed HEAD: `f1320d3e000651b82c7f50afc0642b2f699a2ad5`; producer implementation HEAD: `c5ed399aae53fed4c04229fecea546739f0b3b44`. `git diff --stat c5ed399aae53fed4c04229fecea546739f0b3b44 HEAD -- apps tests db package.json bun.lock compose.yaml Dockerfile` returned empty at review time. Protected pre-existing dirty paths: `docs/AI-PROGRESS.md`, `docs/handoffs/ANTIGRAVITY-C1.md`.

## Executed checks — this review

| Mode / command | Exit | Actual / limitations |
|---|---:|---|
| A: `bun test tests` | 0 | 56 pass, 0 fail, 259 expect calls, 7 files, Bun 1.4.4. `tests/helpers.ts:47–79,97–100` creates unique `c1_test_*` databases, migrates/seeds them and drops those temporary databases; reviewed before execution. Existing tests were run, not new tests. |
| A: `bun run typecheck` | 0 | TypeScript check completed. Earlier direct `./node_modules/.bin/tsc --noEmit -p tsconfig.json` was blocked by lifecycle guard because its referenced script exceeded scan cap; this blocked call did not run. The ordinary project script subsequently ran successfully, without changing guard settings. |
| B: `/Applications/Docker.app/Contents/Resources/bin/docker exec c1b-api-1 bun test tests` | 1 | Existing container had no matching test files; Dockerfile `:17–28` does not copy `tests`. No new container, install, mount, copy, service restart, or app-fixture mutation was performed. Mode B independent rerun **BLOCKED**, not PASS. |
| Docker container listing | 0 | Existing `c1a-db-1`, `c1b-db-1`, `c1b-api-1`, `c1b-web-1` reported healthy/up. Initial `docker` PATH lookup failed; explicit installed app path worked. No service changed. |

Tool stdout is the primary evidence for this QA run; this report records the command/exit and bounded result. Producer evidence index: `docs/results/C1-LOCAL-BUILD/R01/evidence/README.md` and `result.{json,md}`. Producer’s Mode B test-container log and restart logs are self-reported historical evidence, not this review’s rerun. No secret, grant, database URL, or fixture contents copied into this report.

## Findings

### QA-C1-01 — High: rejection is not a stable, terminal receipt for an attempt
- **Evidence:** `apps/api/src/app.ts:41–42,142–147,249–305,319–369`; `db/migrations/0001_init.sql:59–73`; client `apps/web/src/state.ts:34–45`, `apps/web/src/containers.tsx:221–234,262–274`; tests `tests/submission.test.ts:177–221`, `tests/web-state.test.ts:38–47`. Approved policy: `docs/product/UI-05-R02-TARGETED-FIXES.md:25–35`; `docs/handoffs/C1-LOCAL-BUILD.md:7–11`.
- **Scenario:** API marks generic rejection `terminal: true` by default, including `RATE_LIMITED` 429, authentication errors and internal 500; only accepted receipts are inserted. Client treats any structured terminal 4xx except key-conflict as certified terminal non-save. For an in-flight original request plus same-key reconcile, a rate-limited or unauthorized second request can be rejected while the first may still commit; UI may classify this as terminal and permit fresh attempt while `grantValid`/question state is stale. A validation rejection also leaves no durable terminal receipt, so the approved same-key stable outcome / same-key-different-payload conflict for a rejected attempt is not established. The database unique response constraint limits duplicate accepted rows but does not prove which payload wins or certify old request cannot later commit.
- **Expected / fix:** Persist or otherwise authoritatively certify per-attempt terminal outcome and in-flight completion, fingerprint and replay/conflict semantics, and recheck auth/lifecycle/uniqueness atomically for a fresh attempt. Treat generic 401/429/5xx and transient errors as unknown or unavailable, not proof that another request with the key cannot commit. Add existing-tool-writer tests for delayed original + rejected reconcile and rejected key replay/conflict. No runtime race reproduced in this review.

### QA-C1-02 — High: authenticated WebSockets do not recheck expiry or receipt grace
- **Evidence:** `apps/api/src/ws.ts:105–109,133–158,186–203`; `apps/api/src/grants.ts:64–87`; approved `docs/implementation/C1-LOCAL-BUILD-APPROVAL-R01.md:21–24`; `tests/facilitator-ws.test.ts:125–151,166–177`.
- **Scenario:** WS authenticates once and stores only role/session/participant; subsequent resync/broadcast paths do not call `authenticate` or enforce expiry/grace. A socket opened before its grant expires, or participant socket kept open after normal end beyond the 15-minute grace, can continue receiving snapshots/own response after HTTP would deny the same grant. Explicit participant revocation closes sockets via `disconnectParticipant`, but that is not expiry/grace enforcement, and existing tests exercise HTTP expiry/revocation rather than long-lived WS expiry.
- **Expected / fix:** Enforce grant expiration, session-end grace and revocation for already-open sockets and any resync/broadcast, close or suppress data promptly; test expiry, grace boundary, revoke and facilitator/participant variants on real DB and WS. Exact runtime behavior has not been independently reproduced.

### QA-C1-03 — High: UI creates a new join operation key on every retry
- **Evidence:** `apps/web/src/containers.tsx:59–83`, particularly line 71; server idempotent join `apps/api/src/app.ts:201–218`; `tests/join.test.ts` checks unchanged API join key, not the real UI.
- **Scenario:** First join commits but response is lost. User retries from JoinPage: `crypto.randomUUID()` generates a different `join_key`, so server creates a second participant rather than reconciling the first. This can inflate joined count and create a new identity despite the C1 join retry contract.
- **Expected / fix:** Retain an immutable join operation key for a pending/unknown join in the tab and reuse it for unchanged retry; define explicit safe behavior when room code changes. Exercise lost-ack join via actual client and DB. No browser reproduction in this review.

### QA-C1-04 — High: snapshot revision does not track joins; refresh may overwrite newer state
- **Evidence:** join inserts participant in `apps/api/src/app.ts:201–229` without session revision increment or `hub.broadcast`; `apps/api/src/snapshot.ts:46–64,97–103` includes participant count in revisioned snapshot; `apps/web/src/state.ts:62–65` rejects equal revisions; participant `apps/web/src/containers.tsx:137–142,151–169` applies `/api/me` response even if its revision is older; facilitator `:312–325` sets Live on socket open before authenticated fresh snapshot (`apps/web/src/api.ts:111–120`).
- **Scenario:** Facilitator connects with count N, a participant joins without a subsequent submission/control, and no revision/broadcast occurs; count remains stale. Even an equal-revision resync can be dropped by client guard. Separately an in-flight older HTTP `/api/me` response can apply after a newer WS state, because `Math.max` updates only the stored revision while `applyOwnResponse` always applies the old body. Socket transport open can also set Live before a fresh authoritative snapshot. These are code-path deductions; real-client interleavings are NOT RUN here.
- **Expected / fix:** Revision and publish all snapshot-changing joins atomically, reconcile old/new question and participant data under one coherent monotonic contract, reject older HTTP as well as WS states, and set Live only after authorized fresh snapshot. Add controlled tests for join-only changes, out-of-order HTTP/WS and reconnect. Producer’s disconnected-socket test does not prove these cases.

## C1-01–16 independent coverage / gates

Statuses below reflect this reviewer’s evidence, not the producer’s self-reported PASS. **PARTIAL** means some executed component tests or producer evidence exist, but the acceptance criterion is not independently complete. **NOT RUN** means this reviewer did not perform the requested full end-to-end verification.

| ID | Independent status | Coverage / gap |
|---|---|---|
| C1-01 | PARTIAL | Mode A DB-backed suite executed; clean setup, app health and full documented path not independently rerun. |
| C1-02 | NOT RUN / BLOCKED | Existing B API image excludes tests; fresh-worktree Docker-only setup not independently repeated. |
| C1-03 | FAIL (static contract) | Existing API join tests pass in A, but client retry issue QA-C1-03; B not rerun. |
| C1-04 | PARTIAL | A suite exercises DB trigger rollback and answer/comment; full UI and B not independently tested. |
| C1-05 | PARTIAL | A suite exercises typed poll/invalid inputs; real browser and B not independently tested. |
| C1-06 | PARTIAL | A server grapheme/SSR tests pass; browser DOM, IME, mobile and B not independently tested. |
| C1-07 | FAIL (static contract) | A tests cover accepted replay/concurrent 3 and changed valid payload; rejected receipt/key identity gap QA-C1-01; B not rerun. |
| C1-08 | FAIL (static contract) | A tests exercise state helpers and one immediate validation rejection; no independent old-in-flight terminal guarantee; QA-C1-01. |
| C1-09 | PARTIAL | A WS/DB aggregate test passes and checks raw fields; no independent browser/context or B test; socket expiry QA-C1-02 and freshness QA-C1-04 remain. |
| C1-10 | PARTIAL | A tests include five concurrent races and accepted replay; scheduling is probabilistic, not deterministic both orders or controlled in-flight interleavings; B not rerun. |
| C1-11 | FAIL (static contract) | A tests cover disconnected client/reconnect; QA-C1-04 violates revision/freshness paths. Actual server crash after commit before broadcast, dropped participant ack and controlled stale HTTP/WS ordering NOT RUN. |
| C1-12 | NOT RUN | No service/DB restart permitted during Coordinator browser exploration; producer restart logs are self-report. |
| C1-13 | FAIL (static contract) | A HTTP role/session/revoke tests pass; existing already-authenticated socket expiry/grace gap QA-C1-02. |
| C1-14 | PARTIAL | A synthetic Origin and pre-auth WS tests pass; real browser engines and B not independently tested. |
| C1-15 | NOT RUN | Browser exploration belongs to Coordinator; no browser or production build execution in this QA review. |
| C1-16 | PARTIAL | Reviewed aggregate shape and relevant paths; no complete independent tracked-file/image/log/README audit, and WS lifetime risk QA-C1-02 remains. Do not treat producer pattern scan as security certification. |

## Scope and follow-up

Read current `AGENTS.md`, `docs/CODING-WORKFLOW.md`, `docs/TEAM-WORKFLOW.md`, `docs/handoffs/C1-LOCAL-BUILD.md`, approval record, `docs/results/INDEX.md`, producer result/evidence index, existing tests and relevant API/WS/client source. C1-01–16 acceptance derives from protected `docs/handoffs/ANTIGRAVITY-C1.md`; current R02 attempt policy overrides edited-only wording. Results are limited to observed source and execution at this HEAD; no app/test/config changes or installs were made. Neither ROOM-01/02 fixture nor running services/volumes were intentionally changed. No browser, container restart, destructive volume reset, commit, stage, push, deploy, or external service was used.

After the active coding tool fixes findings, rerun affected suites and regression on the new build in both approved modes, with controlled fault/race and grant-expiry tests and independent browser exploration. Do not accept old 56-pass output as post-fix evidence. 30-client load, mobile and full security/accessibility remain NOT RUN. Coordinator owns triage and task state; user owns acceptance.
