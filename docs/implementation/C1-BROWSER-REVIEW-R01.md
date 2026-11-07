# C1 local build — Coordinator browser review R01

**Verdict: CHANGES_REQUESTED.** Two Major functional findings reproduced against the submitted build. This targeted browser review is separate from the producer's R01 report and the independent Senior QA report; it does not accept C1.

- Observed: 2026-11-07, 16:49–17:01 (+07).
- Review baseline: `f1320d3e000651b82c7f50afc0642b2f699a2ad5`; application source equivalent to Mode B worktree `c5ed399aae53fed4c04229fecea546739f0b3b44` (Git diff exit 0).
- Actor: lead-d-setup, non-coding Coordinator; Chromium browser interactions, authorized local synthetic-fixture API control and read-only PostgreSQL verification. No application/test/config changes.
- Targets: Mode A web/API `127.0.0.1:5173/3000`; Mode B `127.0.0.1:5174/3001`. API readiness and both web endpoints returned 200.

## C1-UI-01 — Major: previous answer's saved state locks the next question

**Affected:** C1-15 interactive flow; per-question saved/read-only state contract.

1. In Mode A, join ROOM-01 without an account or nickname.
2. Select rating 4, enter a synthetic comment and submit. The actual UI confirms saved and becomes read-only.
3. Through the authorized fixture facilitator API, open question 02 (poll). Read back the authoritative snapshot.
4. Inspect the same participant tab after its real WebSocket state update.

**Expected:** Question 02 has its own authoritative answer state. With no accepted response for this participant/question, show a usable draft and no saved confirmation. Preserve any unresolved earlier attempt separately rather than discarding it during a transition.

**Actual:** The UI displays question 02 and the green saved confirmation, while its radio group and comment are disabled and no submit button exists. The API snapshot shows the poll receiving answers with total 0. This is a false saved state and blocks the next answer, not a visual-polish issue.

**Source clue:** `apps/web/src/containers.tsx:155–169` changes question/inputs and own response but retains the previous `outcome`. Inspect complete per-question outcome/attempt hydration, including returning to an already answered question; do not blindly erase an unknown old attempt.

**Evidence:** [browser ledger](evidence/C1-REVIEW-R01/browser-ledger.jsonl), [authoritative control snapshots](evidence/C1-REVIEW-R01/control-ledger.jsonl), [screenshot](evidence/C1-REVIEW-R01/A-false-saved-next-question.png). The screenshot was opened and visually inspected.

## C1-UI-02 — Major: retrying an unknown join creates another participant

**Affected:** C1-03 join-operation idempotency; C1-15 recovery.

1. In Mode B, open a fresh join tab for ROOM-01 with a synthetic nickname. DB participant count is 2.
2. Instrument browser transport to discard one join response only after the actual server response has been received. The server returns 201; the UI remains on the join form and shows a generic join failure. DB count is now 3.
3. Retry the unchanged form. Inspect request-key equality without recording grants or request headers; read DB count again.

**Expected:** An uncertain join reuses the original operation key and immutable payload, recovering the same participant rather than creating another identity.

**Actual:** The retry generates a different join key and reaches `/room`; DB count becomes 4. One logical join with a lost acknowledgement added two participants. No response overwrite or authentication bypass is asserted.

**Source clue:** `apps/web/src/containers.tsx:65–72` generates a new join key on every submit. API tests that manually reuse a key do not cover this UI integration defect.

**Evidence:** [join ledger](evidence/C1-REVIEW-R01/join-ledger.jsonl), [joined UI](evidence/C1-REVIEW-R01/B-joined-after-lost-ack.png). Counts were queried directly from the Mode B PostgreSQL container.

## Additional observations that passed within this limited scope

- Mode A anonymous join with blank nickname; actual rating/comment acceptance; HTML-like synthetic text rendered literally; accepted controls became read-only.
- Mode B 501-character comment rejection preserved all 501 characters and offered an explicit fresh attempt. After that action, editing and resubmission were possible.
- Native Enter in the Mode B textarea inserted a newline without submitting. The stored PostgreSQL comment retained a newline.
- A separate Mode B submission lost its acknowledgement after a real HTTP 201. UI showed unknown, offered no fresh-attempt action, retained the multiline draft, then reconciled with the same key. DB readback was exactly one response, one receipt and newline present (`1|1|t`).
- Captured browser error hooks reported no errors during those participant interactions; this is not an audit of all console output or application paths.

## Limits, cleanup and progress

- Fault injection wrapped the browser fetch transport to drop a real response; it did not fabricate server success. The wrappers were restored. Initial harness selector-quoting errors were corrected before actions and are not application findings. The first multiline attempt used a helper that omitted the newline; only the later native-keyboard/DB check proves multiline behavior.
- A later browser-tool call recovered an about:blank tab; no application defect or reconnect result is inferred from that tooling/session loss.
- Facilitator **browser** authentication/control, real mobile devices, full accessibility, browser origin matrix, real process-death timing and load were not verified here. The facilitator action used a private local fixture grant outside the browser, never exposed in chat/evidence. No credential was typed into a browser form.
- Mode A ROOM-01 was restored to rating question 01 open; API readback confirmed revision 5. Added synthetic participants/responses remain for traceability. No rows/volumes were deleted and no services restarted or stopped.
- Application source and producer R01 results are unchanged. SHA256 checks confirm both protected dirty documents unchanged; this report records progress instead of editing another writer's pending AI-PROGRESS work.
- Skills applied: lead-d-workshop-cycle (review/evidence/roles), dogfood (real-browser flows and issue evidence). No codewriter was dispatched, no push/deploy occurred, and no token-savings claim is made.
- Independent Senior QA was requested separately for API/WS/security and existing-suite reruns. Its report has not been consumed at the time this browser review is authored. Consolidate by finding ID before preparing the final fix scope; do not start another writer automatically.
