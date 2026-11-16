# WORKSHOP-PERF-01 / R01 — Mutation RETURNING, editor-first loading, batched latest text

- **Task/run:** WORKSHOP-PERF-01 / R01 (baseline `d438ba9`, observed HEAD `d618e54`, not pushed/deployed)
- **Producer:** DeepSeek Harness (sole user-operated coding writer); **Reported:** 2026-11-16T13:16:23+07:00
- **Status:** **IMPLEMENTATION DELIVERED / COMPILE BUILD PASS — NO TESTS OR BENCHMARKS RUN.** This is implementation delivery with honest limits, not measured production speedup.
- **Authorization:** user's explicit no-tests instruction remains in force. No automated tests, browser scenarios, benchmarks/load/probes or synthetic production data were run. Builds/typecheck are compile checks only, not runtime verification.

## Context (user-provided; not re-measured)
API/PostgreSQL same region; region is not the target. Observed non-mutating persistent-connection endpoint baselines: 4 reads, median /health **0.513913s**, /ready **0.8557335s**; /ready performs SELECT 1. These are endpoint baselines — **not** authenticated action timings, DB query latency, cold-start proof or speedup evidence. No percentage/latency promise is made.

## Slice 1 — fewer mutation DB round trips (`ad76c8d`)
- Room create: `INSERT ... RETURNING` the exact Room projection used by `roomJson`; removed post-write SELECT.
- Add question: `INSERT ... RETURNING` the exact Question projection; removed post-write SELECT. `max(seq)+1` and unique(session_id,seq) behavior unchanged; existing concurrent ordering limitation flagged, not refactored.
- Unlocked Save: `UPDATE ... RETURNING` saved row; removed post-write SELECT. Locked label-only path unchanged.
- Auth admin query, HR read-only, room/session isolation, ended/open-structure/response locks, validation, receipts and self-paced answering untouched; no auth caching/permissions removed.
- Statements per action (before → after): create room **3 → 2**; add question **5 → 4**; unlocked save **6 → 5** (auth/guard statements retained). Success still reported only after durable write.

## Slice 2 — editor readiness independent of report (`d618e54`)
- `refresh()` awaits only `workspace`; editor renders immediately. Report loads only when results visible: initial/entered Dashboard, HR, ended-room results.
- No report request per WS frame while editing; visibility tracked by ref/effect (tab/readOnly/ended), not stale closures. Entering Dashboard schedules one coalesced refresh; R10 max-one-in-flight + dirty/trailing latch preserved (in-flight invalidation → one bounded trailing read).
- Honest states: loading vs ready vs error; “Loading results…” instead of false zero-data, subtle “Updating results…” while stale-refreshing, Retry on failure. Monotonic report-revision guard prevents stale HTTP overwriting newer applied report; snapshot merge/WS ordering and previous-room/unmounted guards retained.
- Room-list load deduplicated per token (no duplicate login/loadRooms effect); sign-in pending and room-loading remain distinct; auth/login endpoints unchanged.
- Structural flow: editor entry before workspace+report parallel → after **1 workspace request** before editor; report deferred; dashboard reads bounded by coalescer.

## Slice 3 — batch latest Text report query (`a90b2db`)
- Replaced per-Text-question latest-3 queries (N+1) with one set-based query scoped to authorized room/session and its text question ids: `row_number() over (partition by question_id order by accepted_at desc, id desc)`, return only `rn <= 3`; grouped by question id into the existing shape.
- K Text questions: **K → 1** latest-text query (0 if none). Score/poll aggregates, n/denominators, latest-3 newest-first order, next_cursor, has_more and full “View all responses” cursor endpoint (latest three once) unchanged; no unbounded JS history fetch.
- Existing indexes inspected: `responses(question_id)`, `grants(session_id)`, `participants(session_id)`. **No schema/index migration.** Separate proposal: `responses(question_id, accepted_at desc, id desc)` (or session-leading variant), requiring approval + measured evidence.

## Compile/build checks (not runtime verification)
| Command | Exit | Scope |
|---|---:|---|
| `bun x tsc --noEmit -p tsconfig.json` | 0 | whole project typecheck |
| `bun run build:web` | 0 | Vite production web compile |
| `bun build apps/api/src/index.ts --target=bun --outfile=/tmp/workshop-api-perf.js` | 0 | API compile bundle check |

## NOT RUN
No automated tests, browser scenarios, benchmark/load/probe scripts, synthetic room data, authenticated API/DB/WS calls, DB timing or cloud measurements. Runtime correctness, RETURNING response-contract compatibility, lazy-report/loading/stale/error/tab UI, coalescer trailing at new call sites, and batch ordering/pagination are **NOT RUN**. No speedup/P95/P99/click-to-paint claim. No push/deploy, cloud setting/data reset, paid service/dependency/provider change; protected dirty docs/logs/presentation/Coordinator evidence not staged.

## Proposed checks for later explicit authorization
1. Builder API: RETURNING shapes; locked/ended/HR/guards; self-paced sequence/receipts.
2. Report batch: latest-3 ordering, has_more/next_cursor, full-view includes latest three once, K text→1 query, session scope, empty/singleton/>3.
3. Mounted frontend: editor without report; Dashboard loading; WS editing = no report request; burst coalescing + trailing final text; stale HTTP ordering; tab switch/end/publish/rejection; unmount/old-room cancellation.
4. Permissioned timing: authenticated Add/Save/Dashboard RTTs with disclosed n and warm/first separation, plus DB query timing; benchmark index proposal separately.
5. Manual synthetic-room browser check only after test/browser authorization.

## Commits / changed paths
- `ad76c8d` `apps/api/src/builder-routes.ts` (RETURNING room/question writes)
- `a90b2db` `apps/api/src/builder-routes.ts` (batched latest text query)
- `d618e54` `apps/web/src/builder.tsx` (workspace-first, lazy/coalesced report, states, room-list dedupe)
- `docs/results/WORKSHOP-PERF-01/R01/**`, `docs/results/INDEX.md`

## Provenance / skills
Read AGENTS.md, docs/CODING-WORKFLOW.md, docs/ANTIGRAVITY-RESULT-PROTOCOL.md. No skill helper/upstream installer executed. Producer/model: DeepSeek Harness / `deepseek-v4.1-flash-1017` (runtime-reported, unverified). Producer self-report; independent QA and user execution/release decisions remain separate.
