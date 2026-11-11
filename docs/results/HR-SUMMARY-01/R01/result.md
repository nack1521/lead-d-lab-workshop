# HR-SUMMARY-01 / R01 — Minimal authorized read-only post-session HR summary

- **Task/run:** HR-SUMMARY-01 / R01 (`main`, source HEAD `41c8557`, not pushed)
- **Producer:** DeepSeek Harness (single active coding writer; user-authorized local HR slice)
- **Reported:** 2026-11-11T14:46:37+07:00 (Asia/Bangkok)
- **Status:** **READY_FOR_REVIEW** — implemented and verified with real API/PostgreSQL/WS evidence; physical browser journey **NOT RUN**; not independent QA or human acceptance.

## User decision implemented
The user declined a five-person minimum ("อย่างน้อยกี่คนก็ได้ … แสดงจำนวนกำหนดว่าจากข้อมูลจำนวนกี่คน"). The summary therefore shows aggregates for **any positive n** with the question-specific n, joined base N, unanswered count and coverage n/N; **n=0 is an honest empty state with no mean**; every response carries self-report/small-sample caveats and never infers employee diagnosis or individual ranking. Synthetic demo data only.

## What was built (smallest complete slice)
- **Additive migration `0003_hr_role.sql`**: grant role check extended with `hr`; applied migrations and existing credentials are not rewritten.
- **Session-scoped HR authorization**: HR grant issued only for an **ended** session by a local private CLI (`.local/hr-grants/<session>.json`, mode 600, prints path only). Prototype TTL defaults to the configured facilitator TTL (`GRANT_TTL_HR_SECONDS`, documented choice, no existing TTL extension). Derivation is from the validated grant's session only; join codes/browser roles are never authority.
- **API** `GET /api/hr/summary` (plus explicit session-scoped route) reads **one repeatable-read PostgreSQL snapshot**: session/ended state/revision, joined participants, per-question n/unanswered/coverage, rating and poll distributions, descriptive mean only when n>0, comment **presence count** (content never read), deterministic feedback-confidence text, reported blockers with counts/shares, caveats. No raw nicknames, participant identifiers, comments, subgroup drill-down or ranking.
- **Role matrix**: HR can only read; facilitator/participant/submission/control routes deny HR; HR WebSocket is explicitly rejected (error FORBIDDEN + close 4403); participant/facilitator cannot read HR; other-session, expired and revoked grants denied; missing token 401; not-ended 409 distinct from empty.
- **React `/hr` page**: token field only (no token in URL/localStorage/bundle), loading / unauthorized / not-ended / error / empty / ready states, accessible tables with textual counts and captions, Thai copy, caveats, responsive layout. No fabricated freshness/zero.
- **Fresh owned fixture + smoke**: `apps/api/src/hr-demo-fixture.ts` creates a new `HR-DEMO-*` session (never reuses ROOM fixtures); `scripts/hr-smoke.ts` drives synthetic participants through the real HTTP API, observes facilitator WS pushes, ends the session, issues an HR grant and reconciles the summary with independent DB counts.

## Acceptance evidence
| ID | Status | Actual |
|---|---|---|
| HR-01 | **PASS** | Fresh session `HR-DEMO-20261111074024.json`: 30 real API participants, rating/poll submissions persisted, session ended, HR summary returned by the real API; independent DB reconciliation (joined/rating n/poll n/rating comments/poll comments) all true; second GET identical except `generated_at` (`reload_persisted=true`). |
| HR-02 | **PASS** | DB-backed tests: n=0 empty with **no mean**; n=1; partial per-question denominators (2/3 rating, 2/3 poll); blank comment not counted as provided; poll tie reported as equal counts, no invented winner; **no five-person gate** (positive n shown). Live smoke additionally shows rating n=30/N=30 and poll n=27/N=30 with 3 unanswered. |
| HR-03 | **PASS** | Role/session matrix tests: HR read-only; participant/facilitator 403; other-session 403; missing 401; **expired 401**; revoked 401; HR blocked from facilitator control, submission and `/api/me`; HR WS denied (4403); summary JSON contains no nickname/comment/participant id. |
| HR-04 | **PASS** | Distinct loading / not-ended (409) / unauthorized / error / empty / ready states covered by API + SSR view tests; network failure is presented as error, never as zero/empty; reload reproduces persisted results. |
| HR-05 | **PARTIAL / NOT RUN for real browser** | Route `/hr` builds and serves (HTTP 200 SPA shell), SSR states and accessible tables tested. **Actual browser journey, mobile/desktop visual check, physical Safari and keyboard basics NOT RUN** in this session (no browser automation available). |
| HR-06 | **PASS** | Native `bun test tests`: **121 pass / 0 fail** (644 expects, 14 files). Mode B Docker-only runner: **121 tests, 0 fail, 9 declared skips** (host-tooling/raw-socket/fixture-dependent LAN cases; skips are not passes). `bun x tsc --noEmit` 0 (covers `lan/**/*.ts`); default and LAN web builds 0. Mode B API+DB healthy; Docker was available (no reset; existing volumes reused). |
| HR-07 | **PASS (bounded smoke)** | 30 synthetic participants on an isolated fresh session: joined 30, rating accepted 30, poll accepted 27, facilitator WS snapshot frames 89 (final revision 88), observed duration **732 ms**; exact summary/DB reconciliation true. Not proof of 30 real phones and not an SLA. |

## TDD evidence
- RED before implementation: `bun test tests/hr-summary.test.ts` → **5 fail** (HR route/role/migration absent), saved as `evidence/hr-red.log`.
- GREEN after implementation: same file **5 pass** (`evidence/hr-green.log`); SSR view tests **3 pass**; full native suite 121/0.
- View tests were authored with the view (presentational layer), so the RED record applies to the API/DB behavior; this is stated rather than claiming full test-first ordering for JSX.

## Commands / exits (actual)
- `bun run migrate` → 0 (`0003_hr_role.sql` applied additively).
- `bun test tests/hr-summary.test.ts` RED → exit 1 (5 fail); GREEN → exit 0 (5 pass).
- `bun test tests` → exit 0 (121 pass / 0 fail, 642→644 expects).
- Mode B runner `tests/run-in-docker.sh c1b_default` → exit 0 (0 fail, 9 declared skips).
- `bun x tsc --noEmit -p tsconfig.json` → 0; `bun run build:web` → 0; `bun run build:web:lan` → 0.
- Fresh fixture `hr-demo-fixture.ts` → 0; `scripts/hr-smoke.ts … 30` → 0; `issue-hr-grant.ts` → 0.
- Live HR API with issued grant → 200; reload comparison identical; raw-data scan clean.

## Changed paths
`db/migrations/0003_hr_role.sql`, `apps/api/src/{hr-summary.ts,issue-hr-grant.ts,hr-demo-fixture.ts,app.ts,ws.ts,env.ts,grants.ts}`, `apps/web/src/{api.ts,ui.tsx,containers.tsx,styles.css}`, `tests/{hr-summary.test.ts,hr-views.test.tsx,lan-guards.test.ts}`, `scripts/hr-smoke.ts`, `README.md`, `.env.example`.

## Private local trial instructions
1. Keep services local: `docker compose up -d db`, `bun run migrate`, `bun run api`, web on `http://127.0.0.1:5173`.
2. `bun run apps/api/src/hr-demo-fixture.ts` → fresh `HR-DEMO-*` code/fixture in ignored `.local/hr-demo/`.
3. Drive synthetic answers: `bun scripts/hr-smoke.ts .local/hr-demo/<CODE>.json 30` (or use the facilitator/participant pages manually with the fixture's facilitator grant and join code).
4. `bun run apps/api/src/issue-hr-grant.ts <session-id-or-code>` → private `.local/hr-grants/<id>.json`.
5. Open `http://127.0.0.1:5173/hr`, paste the HR grant into the page field (never a URL), read the summary.
6. Keep grants and `.env` off-screen during recording; delete `.local/hr-grants/*.json` afterwards. A completed session is immutable for demo purposes — create a fresh fixture for another take.

## Limitations / not run
- **Physical browser/Safari, mobile visual/keyboard checks: NOT RUN** (no browser automation in this session). SSR + HTTP shell evidence only; do not treat as device/accessibility PASS.
- 30-participant smoke is a bounded synthetic single-machine check (732 ms observed), not an SLA, load certification, or proof of 30 real phones.
- HR policy beyond this synthetic demo (real employee data, retention, production access distribution) is not decided or approved.
- LAN work is untouched: the remaining LAN verifier lost-control-ack issue stays separate and was not run on known fixtures; the recorded LAN certificate is stale for the current DHCP address (entry would refuse), and no LAN claim is made here.
- C1 remains partial and was not rerun; protected dirty files, the R02 live log and immutable reports were not modified.

## Provenance
Producer self-report with actual command exits and sanitized evidence; independent QA/human acceptance remain open. No deployment, push, public tunnel, global install or destructive reset occurred.
