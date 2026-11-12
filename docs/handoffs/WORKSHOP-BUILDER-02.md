# WORKSHOP-BUILDER-02 — user-requested product correction

Status: REQUIREMENTS_CAPTURED / IMPLEMENTATION_NOT_STARTED. Supersedes prior token-entry and fixed-room UX for this task; preserves historical reports. Coordinator remains non-coding; DeepSeek Harness is the active user-operated coding writer. No dispatch, push or deployment performed by this brief.

## User outcome
A usable workshop authoring and reporting app, not only pre-seeded rooms. Simplify demo access. Facilitator enters literal `admin`, sees room list and creates rooms/questions without CLI, bootstrap or manually distributed facilitator grants. HR uses the same simple demo entry (proposed default: `admin`) and graph-first read-only room reports. This is intentionally weak demo access, not production authentication. Do not claim otherwise or replace it with account signup.

## Routes and flow
- `/facilitator`: admin entry -> persistent room list + Create room action -> room workspace.
- Room workspace left sidebar: `คำถาม` and `Dashboard`.
- Questions: create/edit/reorder/remove questions in draft; configure type, wording, help, required/optional, score min/max, and choices as applicable; preview and save; open room when ready.
- Dashboard: waiting state initially; show actual live answer aggregates and response counts per question; control active question, close/reopen collection, end session. Do not require manual token entry.
- `/hr`: same room-list/sidebar navigation pattern, read-only graphical summaries, principally ended rooms. Do not expose mutating question controls. No generated narrative insights required.
- Participant `/join` -> `/room`: room code, optional nickname, no accounts; answer one active question at a time. Preserve saved/duplicate/reconnect behavior.

## Response types (bounded default)
1. Score: configurable integer range, default 1–5; mean + answered n and distribution chart. Use horizontal distribution bars as primary truthful representation; optional donut only for a meaningful categorical split, never a mean represented as pie fractions.
2. Single-choice: configurable choices; horizontal bars ranked by response count, count/share labels and explicit denominator.
3. Text: standalone text response (not merely optional comment on a rating). Show latest five submitted answers; View all opens paginated view. Proposed API pagination: stable created_at/id ordering, page/cursor + limit + has_more/next cursor. No fabricated entries.
Other types are extensibility, not promised implemented scope.

## Lifecycle and data correctness defaults
- Draft: editable and reorderable questions. Persist rooms/questions/answers in PostgreSQL, realtime via existing stack; no Redis/BullMQ.
- Open room with an active question; facilitator can switch questions while participants remain in room. Explicit close/end controls.
- Allow question editing inside a room, but lock type/range/choice deletion once that question has responses; permit non-destructive wording/help edits or create a new question instead. Do not discard or silently reinterpret answers. This default must be visible in UI and reviewed with the user if conflicting.
- Empty results show n=0/empty state. Every positive n is reportable; no five-person suppression. Report actual base and n.
- Keep auth/role scope server-side even with shared demo admin access; new user input `admin` must work through deployed API, not only a frontend bypass.
- Text answers may be shown to facilitator/HR under this new explicit user requirement, superseding prior aggregate-only summary scope. Use synthetic review data; do not label text anonymous if content itself identifies someone.

## UX corrections explicitly requested
- Remove manual facilitator-token form and its persistent `โทเค็นผู้ควบคุมไม่ถูกต้องหรือหมดอายุ` UI. Clear obsolete auth errors after successful admin entry/reconnect; real failed admin input can receive a concise local validation message.
- Remove red warning copy such as `ข้อมูลเก่า · ไม่ใช่ Live` entirely. Do not falsely label disconnected/cached results Live; use neutral last-updated timestamp and subtle reconnect/loading affordance instead. Keep genuine submission failure handling, without the rejected warning styling/copy.
- Charts replace narrative HR summaries. Text response listing is requested data, not an AI narrative.

## Visual direction
Reference inspected: `/Users/aiink/Downloads/unnamed.png`: Lead+D Lab stylized flame/leaf, teal gradient, pale mint/white background. Use approved logo and teal/mint family instead of prior monochrome-only direction. Add depth and personality through restrained brand gradients, rounded cards, question-type icons, chart accents, brief state transitions and progress indicators. Keep chart surfaces readable/opaque; support mobile and reduced-motion. No decorative random metrics or generic oversized empty hero. Logo must be copied into an owned project asset only by coding writer, not linked to a user Downloads path at runtime. Proposed layout: brand/sidebar navigation, compact room toolbar, usable question editor and spacious results cards.

## Delivery sequence (one coding writer)
1. Product flow/wireframe and branded visual preview for room list/editor/results; user validates direction before broad visual implementation.
2. Vertical slice: admin -> create room -> score question -> open -> phone join/answer -> live chart -> persisted reload.
3. Single-choice + standalone text + latest-five/pagination; editing constraints and reconnect cases.
4. HR graph-first room reports; cleanup rejected warning/token UI; regression, deployment and actual cloud end-to-end verification.

## Acceptance checklist
- Fresh browser enters admin, creates room and all three question types without terminal or manual grant handling.
- Rooms/questions survive reload and API restart; answers persist and are isolated by room/question.
- Participant answers one active question, sees saved state, moves to next; retry/reconnect do not duplicate.
- Facilitator live score/choice counts match DB; latest five text responses and View all pagination are correct and stable, including >5 answers.
- HR read-only graphs match facilitator/DB; no invented narrative; n/base shown for zero/singleton/multiple answers.
- Previously rejected persistent auth warning and stale red copy are absent after successful access and reconnect; no false Live claim.
- Logo/teal direction verified visually on desktop and phone widths, keyboard focus and reduced motion respected.
- Existing users' data is not reset; migrations additive; prior protected dirty documentation/evidence preserved.
- Producer reports actual commands/results per docs/ANTIGRAVITY-RESULT-PROTOCOL.md in a new immutable task/run; independent QA and human acceptance separate.

## Observed baseline / progress
At capture: main HEAD 537d700; working tree contains pre-existing edits to docs/AI-PROGRESS.md, docs/handoffs/ANTIGRAVITY-C1.md and docs/results/C1-LOCAL-BUILD/R02/evidence/mode-a-api.log plus untracked docs/implementation/evidence/C1-RETEST-R03/. Do not overwrite or stage them. This brief records current user correction separately because the shared progress log is already dirty.
Public infrastructure exists (Pages frontend + Railway API/PostgreSQL), but previous endpoint/CORS passes are not acceptance of this requested authoring product. No implementation or test pass is claimed here.
