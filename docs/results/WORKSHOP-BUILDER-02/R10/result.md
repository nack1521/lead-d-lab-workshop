# WORKSHOP-BUILDER-02 / R10 — Bounded trailing latch for coalesced report reads

- **Task/run:** WORKSHOP-BUILDER-02 / R10 (`main`, HEAD `92d2508`, not pushed/deployed)
- **Producer:** DeepSeek Harness (sole coding writer); **Reported:** 2026-11-12T23:37:36+07:00
- **Trigger:** R09 coordinator retest **WB2-R09-COALESCE-01 HIGH** — DEFAULT 150ms coalescer dropped an invalidation whose timer fired during an in-flight read, leaving final text stale. R09 WS/deletion/graph fixes preserved.
- **Status:** **FIXED / TESTS PASS — mobile/browser physical verification NOT RUN.**

## Fix
- `createCoalescedTask` retains **max one in-flight** read but adds a **dirty/trailing latch**: any schedule during a run sets `dirty`; timer firing while `inFlight` no longer drops it; after settlement one bounded follow-up read runs (immediate next tick), then subsequent schedules coalesce normally. 10 updates during run 1 → exactly **2 runs** with final state.
- Cancellation (unmount/room change) sets a cancelled flag, clears pending timer/dirty and prevents trailing reads. Builder guards report application with a mounted/room-identity check so a late in-flight report never writes into another room/unmounted tree.
- Rejections are swallowed inside the task (no unhandled rejection, no automatic retry loop); a later schedule can request one bounded follow-up. Language/UI, self-paced semantics, R07 CORS and guards unchanged.

## Fail-first regressions
- **RED before fix** (`evidence/coalesce-red.log`): deferred read1 held >150ms-scaled timer, version2 scheduled while in-flight → only `readVersions:[1]`, pending false; also unhandled rejection in the rejection case. **GREEN after fix** (`evidence/coalesce-green.log`):
  1. invalidation during in-flight run yields exactly one trailing run; pending false after settlement;
  2. ten updates during run1 coalesce into one bounded run2 and final state (version 10) is read;
  3. cancel during in-flight prevents trailing run; rejected run does not loop or produce unhandled error.
- **Mounted workspace final-text case** (`evidence/mounted-final-text.log`): real BuilderApp, report read 2 delayed with stale revision-6 text while frame revision 7 arrives during it → trailing read 3 returns “Latest final text”; UI shows final text only, stale in-flight text removed, bounded reads (initial/dashboard + burst + trailing ≤4). Covers stale in-flight ordering, not only a burst-before-request unit test.
- Full suite `bun test tests` → **194 pass / 0 skip / 0 fail** (194 tests, 26 files; 1047 expects). Typecheck 0; default web build 0; cloud-configured build 0; API image builds (tagged `lead-d-lab-api:r10`).
- Request-count evidence is local/controlled: pure test shows 10 updates → 2 reads; mounted shows a bounded burst+trailing sequence. Not cloud click-to-paint.

## NOT RUN / limits
- Mobile screenshots/geometry at 320/375/390/430 and physical iPhone remain **NOT RUN** (no browser/iPhone automation); no visual PASS. Cloud Add/Save paint and independent QA remain NOT RUN. No push/deploy, no DB reset, no paid infra; coordinator/protected artifacts untouched.

## Changed paths
`apps/web/src/coalesce.ts`, `apps/web/src/builder.tsx` (mounted/room guard), `tests/r10-coalesce.test.ts` (new), `tests/findings-client.test.tsx` (mounted final-text), `docs/results/WORKSHOP-BUILDER-02/R10/**`, `docs/results/INDEX.md`.

## Next gate
Coordinator retest of trailing-latch/old-room/cancel behavior, then user-assisted mobile/cloud verification. No publication before independent retest passes.
