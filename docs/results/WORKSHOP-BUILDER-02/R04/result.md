# WORKSHOP-BUILDER-02 / R04 — English UI, shared full-width shell, all-responses view

- **Task/run:** WORKSHOP-BUILDER-02 / R04 (`main`, HEAD `a325994`, not pushed/deployed)
- **Producer:** DeepSeek Harness (sole coding writer); **Reported:** 2026-11-12T21:33:37+07:00
- **Status:** **READY_FOR_REVIEW — LOCAL UI/TESTS ONLY. Visual/browser acceptance remains OPEN (NOT RUN).**
- R01–R03 reports preserved unchanged; Unslop R02 direction and shared API-base fix retained.

## Implemented
1. **English system UI:** facilitator/admin rooms, Questions, Dashboard, HR/reports, dialogs, statuses, navigation, placeholders, chart labels, loading/empty/reconnect/error copy, date/time formatting and accessible names are English. Participant join/answer/saved/retry/closed copy, labels, placeholders and accessible names are English; HTML `lang="en"` and English title. API-derived participant field errors are mapped by code to English; the literal demo entry remains `admin`. Historical user-authored DB strings (titles, questions, answers) are untouched.
2. **Shared shell/menu:** one persistent branded top header (single logo/wordmark + Rooms path + mode context) remains across Rooms, room Questions, Dashboard, HR/reports. Room sidebar is subordinate navigation under that header; breadcrumb `Rooms / <title>` and a visible Rooms action exist; no duplicate wordmark.
3. **Full-width/balanced layout:** fluid content with shared 32px desktop / 16px mobile gutters, sidebar 280 + fluid main, consistent section borders; removed the inherited narrow 1180px content cap/off-center room list. Compact room rows, prominent room identity heading (~30px desktop / 23px mobile), `Room code: …` and status as secondary context; sidebar title wraps/clamps.
4. **Integrated authoring:** `Add question` section sits inside the workspace above the numbered rail/editor with three equal controls Score / Multiple choice / Text response — one horizontal 3-column row, stacked vertically when narrow, never 2+1; hidden on ended rooms; rail/editor/preview retained.
5. **Removed clutter:** visible demo disclaimer and its badge/footer substitute removed from product UI (weak-demo-auth disclosure remains in operator docs); visible `n=…/base…` microcaptions removed from score/choice/text summaries. Truthful counts/denominators remain in API/data and screen-reader text/accessible labels; means/bar counts/shares remain visible naturally; zero state shows no fabricated mean.
6. **All responses:** text summary still shows newest THREE; action is now **View all responses**, opening a distinct dialog whose first page starts at the newest answer and paginates **all** answers (latest three included exactly once, no older-only feed, no duplicate summary inside the dialog), stable newest-first order with cursor/has_more, loading/empty/error/close states. HR uses the same contract.
7. **Preserved:** per-question graphs for closed/ended rooms without Open-to-view, read-only HR, create naming dialog (single POST, cancel no row), lifecycle guards/end confirmation, per-question ended charts, idempotency/reconnect/locks, shared API-base policy.

## Verification (actual; no browser)
- `bun test tests/builder.test.ts` — **9 pass / 0 fail**, including newest-3 summary + full-view pagination: 7 answers over 4 pages (limit 2), 7 unique ids, latest three included exactly once.
- `bun test tests/builder-views-r03.test.tsx tests/builder-r04.test.tsx` — **12 pass / 0 fail**: English system source/dialogs, persistent Shell/breadcrumb/room identity, integrated three type controls, visible technical captions removed with sr-only descriptions, full-view all responses.
- Full suite `bun test tests` — **155 pass / 8 skip / 0 fail** (163 tests, 21 files). The 8 skips are declared: previously retired legacy facilitator-UI test, four superseded Thai-copy assertions, the retired stale-copy facilitator test, and two legacy HR/closed-question Thai-copy assertions — skips are not passes.
- `bun x tsc --noEmit` 0; `bun run build:web` 0; `bun run build:web:lan` 0.
- Source checks: `apps/web/src/builder.tsx` contains no Thai system copy; participant render block (`ui.tsx`) contains no Thai system copy; HTML lang/title English.

## NOT RUN / open (required for visual PASS)
- **No actual browser screenshots, click-flow or measured geometry.** This environment has no browser automation/headless browser available (no Chrome/Chromium/Playwright; no new dependencies or Safari automation enabled). Therefore desktop 1440/1280 and mobile 390px screenshots, gutter/type-group bounding boxes, Create→answer→graph→ended→HR click-flow and phone behavior are **NOT RUN**; SSR/static tests alone are not visual acceptance. Visual/spacing/mobile PASS remains **open**, not claimed.
- Text all-responses dialog interaction, English participant browser flow, keyboard/reduced-motion, Mode B/Docker, cloud/LAN deployment and independent QA are NOT RUN. No push/deploy; no data resets; protected dirty/untracked work preserved.

## Changed paths
`apps/web/src/builder.tsx`, `apps/web/src/styles.css`, `apps/web/src/ui.tsx`, `apps/web/src/containers.tsx`, `apps/web/index.html`, `tests/builder.test.ts`, `tests/builder-views-r03.test.tsx`, `tests/builder-r04.test.tsx` (new), `tests/findings-client.test.tsx`, `tests/web-views.test.tsx`, `tests/hr-views.test.tsx`, `docs/results/WORKSHOP-BUILDER-02/R04/**`, `docs/results/INDEX.md`.

## Next gate
User-assisted browser screenshots/geometry and click-flow at 1440/1280/390 after this local build, then independent QA. Unslop R02 direction unchanged; no deployment/push.
