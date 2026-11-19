# WORKSHOP-PERF-02 / R01 — Session persistence, opt-in action diagnostics and Add outcome UX

- **Task/run:** WORKSHOP-PERF-02 / R01 (baseline `9fb38df`, observed HEAD `15851f8`, not pushed/deployed)
- **Producer:** DeepSeek Harness (sole user-operated coding writer); **Reported:** 2026-11-19T13:34:57+07:00
- **Status:** **IMPLEMENTED WITH FOCUSED LOCAL TESTS — NOT whole-app PASS, NO speedup/root-cause claim, production measurement NOT RUN.**
- Two slices committed separately; no app-wide redesign, dependency, migration, provider/timeout/index change, session revoke or participant persistence.

## Slice commits
- **`a7236a6`** — client session persistence, restore/expiry/logout/race guards, sign-out controls, client diagnostics scaffolding, Add pending/uncertain UX.
- **`15851f8`** — server opt-in bounded request/DB-step diagnostics, CORS expose allowlist, authoritative rooms `scope`, named DB-await steps, tests.

## Session persistence (independent of latency)
- Versioned per-role sessionStorage record `lead-d-lab.perf02.admin-session.v1.{admin|hr}`: opaque token, exact scope, finite absolute `expiresAt`, public API-base identity. Expiry derives from the actual login request start wall clock + returned `expires_in_seconds`; reload/retry never renew. No password/draft/room/report/Text/participant data; no localStorage/cookie/accounts. sessionStorage is untrusted and JavaScript-readable; **not XSS hardening or cross-tab logout**.
- Refresh validates only the current role's locally usable candidate through one authenticated `GET /api/admin/rooms`; the response's additively returned server `scope` must equal the route before any restored UI/room is shown. No extra auth request; stored role/expiry alone is not authorization. Unusable/expired/wrong-version/wrong-scope/wrong-audience records are discarded (best-effort remove current role only).
- Login: pending form; validates token/scope/TTL; mismatched success never activates; storage write failure keeps memory session with `Session could not be saved...` warning. Login invalid-passphrase remains a form error (never global invalidation). 401 clears only originating role/session + best-effort storage/tombstone; 403 preserves access and shows permission view; 404/409/422 remain action errors; network/5xx preserve candidate and expose manual Retry with no false empty rooms or auth success.
- Local deadline: timer + focus/visibility check + pre-dispatch checks block new protected work and end active access with `Your session has expired. Sign in again.`; server 401 remains authoritative. Sign-out is local-only, current role only, removes role-owned rooms/room/report/dialog/subscription state and cancels safe local work; it does **not** revoke server grants or undo already-dispatched writes. Other role and unrelated keys untouched. Removal failure attempts an invalid tombstone; if both fail the UI explicitly says saved session could not be removed and refresh may restore it (no false guarantee).
- Generation guards cover boot/login/rooms/workspace/read/report/Add completions; sign-out/role remount route keys prevent old responses reauthenticating, repopulating prior data or clearing newer state; old `finally` cannot clear newer pending. Sign out available on checking/rooms/workspace/access-denied/restore-error surfaces.
- Add UX: immediate `Adding question...`, 10s copy `Still adding question...` (no transport timeout/resend), busy authority prevents duplicate dispatch; network/5xx unknown outcome shows `Could not confirm whether the question was added. Check questions before adding again.` with an authoritative `Check questions` read and no automatic mutation retry. No optimistic question success.
- PERF-01 lazy editor/report coalescer/error precedence/cached Text and R07 CORS/R08 self-paced/HR guards preserved.

## Actual-action diagnostics (opt-in, default OFF)
- Server `PERF_DIAGNOSTICS=1`: per-request opaque `x-request-id`, route template `x-perf-route`, method/status, request `Server-Timing: req;dur=...`, and named `db_<step>;dur=...` steps for login/rooms/workspace/Add. DB await is labelled `db_*` client-call elapsed (includes pool/connection/wire/execution where applicable); **pure query execution separately is UNKNOWN** because no supported driver boundary was used. No SQL/params/bodies/tokens/passphrases/room IDs/query strings/URLs/raw errors in output; bounded header size/steps. Disabled path emits no diagnostic headers.
- Browser-readable correlation uses a minimal CORS expose allowlist (`x-request-id, server-timing, x-perf-route, x-perf-method, x-perf-status`); exact-origin/method/auth checks unchanged; no new diagnostic request header/preflight.
- Client `VITE_PERF_DIAGNOSTICS=1`: bounded in-memory 100 action events with action kind, monotonic durations, status, opaque request/Server-Timing headers; no external analytics/retention. Disabled default emits no events/global. Browser paint/network phases not observable are **UNKNOWN**, not zero.
- **No controlled actual-action timing sample was collected in this run.** Diagnostics contract was tested (enabled/disabled/privacy), but login→rooms→workspace→Add latency attribution remains **NOT RUN / UNKNOWN**. Same-region and DB `idle_timeout: 20` remain hypotheses only; no special DB timing, extra connections, median subtraction, cold-start/region inference, speedup or root-cause claim. Enable/disable: `PERF_DIAGNOSTICS=1` server, `VITE_PERF_DIAGNOSTICS=1` client; default off; no config change beyond these opt-ins.

## Focused local tests (actual)
Environment: existing local `c1a-db-1` started from its existing volume (no reset); project DB URL loopback `127.0.0.1:5433`; `API_HOST=127.0.0.1`; helpers create/migrate/close only unique `c1_test_*` DBs. No production/cloud/known-DB reset, load, browser or push/deploy. Debug output sanitized; no tokens/credentials persisted.
| Command | Exit | Counts |
|---|---:|---|
| `API_HOST=127.0.0.1 bun test tests/perf02-session.test.ts tests/perf02-diagnostics.test.ts tests/perf02-client-diag.test.ts` | **0** | **10 pass / 0 fail / 0 skip**, 74 expects, 3 files |
| `API_HOST=127.0.0.1 bun test tests/findings-client.test.tsx` | **0** | **28 pass / 0 fail / 0 skip**, 101 expects, 1 file |
| `API_HOST=127.0.0.1 bun test tests/r04-coalesce-lifecycle.test.ts tests/r10-coalesce.test.ts tests/r09-regressions.test.ts` | **0** | **11 pass / 0 fail / 0 skip**, 42 expects |
| `API_HOST=127.0.0.1 bun test tests/builder.test.ts tests/self-paced.test.ts tests/builder-views-r03.test.tsx` | **0** | **23 pass / 0 fail / 0 skip**, 167 expects |
| `bun x tsc --noEmit -p tsconfig.json` | **0** | compile/typecheck only |
| `bun run build:web` | **0** | compile/build only |
Total focused: **72 pass / 0 fail / 0 skip**. No skips/filters.

## Acceptance/QA coverage map (executed vs NOT RUN)
- **Covered (focused local):** storage record expiry/malformed/scope/audience/write-remove-read failures/role isolation; mounted valid restore, restore 401, restore 403, transient 503 + manual Retry, scope mismatch, sign-out-during-restore race with other-role retention, storage-write warning, local expiry, uncertain Add + no auto-retry; real API rooms authoritative scope; diagnostics enabled headers/steps/privacy markers/disabled/no-ID-query; CORS expose allowlist; existing PERF-01/R09/R10/self-paced/builder regressions.
- **PARTIAL:** AC01–AC09/QA S01–S08 cover representative cases but not every actor/surface/race (HR mounted restore, workspace/Add old-completion races, removal-failure mounted, long-wait 10s copy, invalid successful restore body, sign-out from every surface). AC10 timing actual sample **NOT RUN/UNKNOWN**. AC11 accessibility/keyboard NOT RUN. AC12 partial via existing tests.
- **NOT RUN:** controlled actual action timing/login→workspace→Add, first/warm/post-idle/connection evidence, browser Resource Timing/paint, production measurement, cloud, load, physical browser/mobile, full suite.
- If future tests reveal a real app defect, report the seam for a separately agreed fix; do not silently broaden scope.

## Cleanup / limits
Existing helpers own API/server/SQL/socket cleanup and drop their unique test DBs; individual DB absence was not independently catalog-verified. Base `c1a-db-1` was started from its existing volume for these tests and left running; no reset/volume change. SessionStorage is demo convenience, not secure storage; server revoke/all-tab logout are outside scope. No independent QA/Product acceptance; Coordinator/QA/Product review the same delivered revision.

## Changed paths
`apps/web/src/{admin-session.ts,perf-diag.ts,builder.tsx,containers.tsx}`, `apps/api/src/{diagnostics.ts,env.ts,server.ts,builder-routes.ts}`, `tests/{perf02-session.test.ts,perf02-diagnostics.test.ts,perf02-client-diag.test.ts,findings-client.test.tsx}`, `docs/results/WORKSHOP-PERF-02/R01/**`, `docs/results/INDEX.md`.
