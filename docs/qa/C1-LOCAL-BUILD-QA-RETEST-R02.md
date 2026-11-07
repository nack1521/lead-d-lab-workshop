# C1-LOCAL-BUILD — Independent targeted QA retest R02

**Verdict: CHANGES_REQUESTED.** R02 improves the original failure paths, and the Mode A existing suite passes, but static review finds unresolved receipt, authorization, join-payload and revision-consistency defects. Green tests do not demonstrate the missing controlled interleavings. Findings are source-path deductions unless explicitly identified as executed; they are not fabricated runtime reproductions. No user acceptance or ticket closure.

Reviewer: canonical Senior QA `lead-d-qa` | 2026-11-07 17:30:23 +0700  
Observed report HEAD `97a47605bc827c6b8f0a860fbfa8a8c5df6ebc39`; app/build `da30003a805cc6b0e133bdc9ac94ae001419e488`. `git diff --stat da30003a805cc6b0e133bdc9ac94ae001419e488 HEAD -- apps tests db package.json bun.lock compose.yaml Dockerfile` returned empty. Pre-existing dirty `docs/AI-PROGRESS.md` and `docs/handoffs/ANTIGRAVITY-C1.md` were preserved.

## Independent execution on current source

| Command | Exit | Result / scope |
|---|---:|---|
| `bun test tests` | 0 | Mode A: 71 pass, 0 fail, 343 expect calls, 9 files. Existing suite uses PostgreSQL `c1_test_*` temporary DBs and destroys its own DBs; `tests/helpers.ts:47–79,97–100` and destructive test operations were inspected before running. Existing React tests use happy-dom and mocked transport, not a real browser. |
| `bun run typecheck` | 0 | TypeScript check completed. |
| Mode B tests/browser | NOT RUN | Coordinator owns both-mode regression and real-browser participant retest; no parallel Docker tests, browser, app fixture mutation or service restart by QA. Producer R02 reports 71/0 in Mode B; this is self-report, not this review's execution. |

Tool output from this run is the direct evidence for command counts/exits. The producer's `docs/results/C1-LOCAL-BUILD/R02/evidence/{README.md,findings-api-green.log,findings-client-green.log,mode-a-full-regression.log}` and `result.{json,md}` were read as producer evidence, not as independent QA PASS. No secrets or raw fixture credentials are included here.

## Per-group verdict

| Consolidated group / original ID | QA R02 verdict | Actual evidence and residual |
|---|---|---|
| C1-RV-01 / QA-C1-01 | **OPEN — High** | `tests/findings-api.test.ts:24–93,95–164` passed in Mode A for durable rejected POST replay, changed payload conflict, and transient errors. `apps/api/src/app.ts:364–449` serializes receipt persistence under session row lock. However rejected receipt GET, same-key dedup receipt and atomic grant recheck still have concrete defects R02-QA-01/02/03 below; delayed-original vs rejected-reconcile controlled test NOT RUN. |
| C1-RV-02 / QA-C1-02 | **PARTIAL / OPEN** | `tests/findings-api.test.ts:186–235` passed expired facilitator resync, participant past grace resync, and expired facilitator broadcast; `apps/api/src/ws.ts:124–137,185–190,223–234` rechecks auth. Exact grace/TTL boundaries, open-socket revoke during asynchronous send and 30-second sweep behavior were not deterministically exercised. `stillAuthorized` runs before `buildSnapshot`/`stateFor` and send (`ws.ts:107–111,185–190,223–234`): revocation/expiry can occur between recheck and data delivery; coordinate policy and deterministic test before closing this security group. This is a code-path risk, not a runtime repro. |
| C1-RV-03 / QA-C1-03 + C1-UI-02 | **OPEN — High** | A suite passed `tests/findings-client.test.tsx:205–286` for same-room key reuse and different-room key changes; real browser and DB lost-ack joint end-to-end belong to Coordinator. Original requirement also demands immutable join payload; R02-QA-04 demonstrates source-level mismatch. |
| C1-RV-04 / QA-C1-04 | **PARTIAL / OPEN** | A suite passed join-only revision/broadcast, stale client HTTP suppression, Live-after-snapshot and equal-revision reconnect (`tests/findings-api.test.ts:247–292`; `tests/findings-client.test.tsx:354–430`). `/api/me` revision consistency remains open under R02-QA-05; two concurrent clients, delayed DB interleaving and actual crash-before-broadcast are NOT RUN. |
| C1-RV-05 / C1-UI-01 | **PARTIAL — not closed by QA** | Existing happy-dom tests for new question and unknown transition passed (`tests/findings-client.test.tsx:289–351`); this independent assignment does not replace Coordinator's real-browser rating→poll→return retest. |

## Residual/new findings

### R02-QA-01 — High: rejected receipt read cannot return its terminal outcome
- **Path:** `apps/api/src/app.ts:410–415,521–542`; `db/migrations/0002_terminal_receipts.sql:4–8`; `serializeResponse` at `app.ts:114–123`.
- **Repro scenario (static):** submit an over-limit comment with a valid attempt key; R02 persists a `rejected` receipt with `response_id = null`. GET the own receipt for that key: handler selects only `response_id`, looks up a response for null, and calls `serializeResponse(response)` without handling the rejected outcome. The response is undefined and cannot be serialized as accepted; the handler's error path may return an internal error. It cannot return the stored terminal rejection as required for reconciliation.
- **Impact/fix:** after a lost rejection acknowledgment, receipt lookup cannot establish the durable non-save result. Read outcome/code/message explicitly and return the stable authenticated rejected receipt; add API+DB test for rejected GET, lost rejection ack, replay and grace/revoke. No new test was written or executed here.

### R02-QA-02 — High: deduplicated new-key outcome is not recorded for stable replay/conflict
- **Path:** `apps/api/src/app.ts:375–398,452–457,500–507`; `tests/submission.test.ts:150–175`.
- **Repro scenario (static):** participant has accepted response under key A. Submit valid payload B under new key B; server returns the old accepted response as deduplicated but inserts no B receipt. Reuse key B with a different valid payload C: lookup still finds no B receipt and returns accepted/deduplicated again, rather than `IDEMPOTENCY_CONFLICT`. The current test asserts one receipt, so it does not check the approved same-key/different-payload rule for key B.
- **Impact/fix:** accepted answer remains unique, but the per-key outcome/fingerprint contract is not enforced. Define and persist or explicitly reject the new-key attempt consistently, preserving accepted-answer read-only and stable replay; test both changed-payload and same-payload subsequent requests under that key.

### R02-QA-03 — High: fresh submission authorization is checked before, not atomically with, the session transaction
- **Path:** `apps/api/src/app.ts:137–145,322–325,364–367,452–477,640–651`; `apps/api/src/grants.ts:49–55,64–87`; approved `docs/product/UI-05-R02-TARGETED-FIXES.md:29–35`.
- **Repro scenario (static):** a fresh attempt authenticates, then waits for the session row lock; facilitator revokes that participant or the grant expires before the waiting transaction proceeds. The transaction rechecks session/question/accepted response but never rechecks grant expiry/revocation under a shared serialization rule. It can proceed using the earlier `auth` object. A revoke can also race the write because revocation does not take the same session/grant lock.
- **Impact/fix:** a write can be accepted after authorization ceases, contrary to approved atomic guard. Define a common transaction/locking order for write and revocation, recheck current grant within it, and test deterministic revoke/expiry while the submission is blocked. No runtime interleaving was induced here.

### R02-QA-04 — High: uncertain join retry changes nickname payload and can display a different identity label
- **Path:** `apps/web/src/join-attempt.ts:6–21`; `apps/web/src/containers.tsx:78–98`; `apps/api/src/app.ts:245–262,275–299`; `tests/findings-client.test.tsx:238–285`.
- **Repro scenario (static):** first join with nickname A commits but response is lost; user edits nickname to B and retries same room. The operation keeps the key but sends current nickname B. Server reuses the existing participant and retains A; response does not expose stored nickname, while client sets `participantLabel` from B. The retry payload is not immutable and the UI can show a label that differs from the persisted participant.
- **Impact/fix:** maintain the full original join payload for an uncertain retry and show the server-authoritative stored label, or stop and request an explicit approved payload-change policy. Test lost ack with edited nickname using the actual React container and real DB. Current happy-dom test checks key reuse but does not assert original nickname payload or DB label.

### R02-QA-05 — High: participant `/api/me` and WS own-response can mix different database revisions
- **Path:** `apps/api/src/app.ts:304–320`; `apps/api/src/ws.ts:56–76,79–104,107–111,223–234`; `apps/api/src/snapshot.ts:41–64`; `apps/web/src/containers.tsx:155–189,203–212`; `apps/web/src/state.ts:78–85`.
- **Repro scenario (static):** `/api/me` reads session revision and then question and own response in separate queries without a repeatable-read snapshot. A close or submit between those queries can return old revision paired with newer question/response. WS `buildSnapshot` uses a consistent transaction, but then `stateFor` queries own response separately; a newer commit can likewise be included under the older snapshot revision. The client compares revision only and rejects equal WS revisions, so a mixed payload cannot be assumed authoritative or consistently reconciled.
- **Impact/fix:** read session/question/own response from one coherent transactional snapshot or attach and validate per-component revision and reconcile equal-version semantics explicitly. Add a controlled read/commit interleaving, including equal-revision reconnect; the happy-dom test `tests/findings-client.test.tsx:355–380` covers strictly older HTTP, not a mixed same-revision server payload.

## Runner safety observation — not executed

`tests/run-in-docker.sh:16–25` creates a host temporary workdir, sets an EXIT trap, then uses `exec docker run`; replacing the shell can prevent its EXIT cleanup trap from running. It also expands `DATABASE_URL` into a `docker run -e NAME=value` process argument. This can leave archived source in host temporary storage and expose credentials to local process inspection. Do not use the script unchanged for independent runs; Coordinator's private inherited environment/tmpfs approach is separate. This is a static observation, not a claim of an actual leaked secret or orphaned directory. No installer, Docker runner, or shell workaround was invoked by this QA.

## Limits and next gate

- Producer's network delay is not a controlled delayed-original/rejected-reconcile execution; the passing same-key race has two valid requests, not a held original plus terminal rejection. Grace tests shift time to 16 minutes, not exact 15-minute/hard-TTL boundaries or periodic sweep. Reconnect tests use fake WS and happy-dom; full Mode B/browser/restart remains Coordinator-owned and NOT RUN here.
- Read `AGENTS.md`, `docs/TEAM-WORKFLOW.md`, current C1 handoff, R01 consolidated mapping, R01 QA report, R02 result/evidence index, and relevant current source/tests. Did not mutate ROOM-01/02, restart services, edit app/tests/config/protected files, install, stage, commit, push or run browser/parallel Docker tests. No runtime/security/a11y certification or 30-client SLA is claimed.
- Active coding tool should add controlled failing tests and fix above paths; QA must rerun on the new build in both modes, including existing full regression and browser tests by the assigned owner. Coordinator owns triage/status, user owns acceptance; R01 remains historical.
