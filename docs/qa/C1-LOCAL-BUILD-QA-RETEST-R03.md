# C1-LOCAL-BUILD R03 — Independent targeted QA retest

**Verdict: PARTIAL — targeted fixes supported; evidence gates remain.** No new confirmed defect was found within the assigned residual scope. This is not release approval, human acceptance, or task closure. Coordinator owns real-browser/API and Mode B confirmation.

Reviewer `lead-d-qa`; 2026-11-08 13:28 +0700. Report HEAD `730ca02ff68b6bb6bcc00040c8c0740fcc58c8d9`; app commit `cce8db1ac194f2ea6d9d23b707c0c05a5841b6d0`. The checked `apps tests db package.json bun.lock compose.yaml Dockerfile` diff between those commits was empty; this check does not establish all possible configuration files are unchanged. Pre-existing dirty files `docs/AI-PROGRESS.md`, `docs/handoffs/ANTIGRAVITY-C1.md`, `docs/results/C1-LOCAL-BUILD/R02/evidence/mode-a-api.log` and untracked Coordinator evidence were left alone.

## Independent execution, Mode A

| Command | Exit | Actual |
|---|---:|---|
| `bun run typecheck` | 0 | TypeScript project check completed. |
| `bun test tests` | 0 | Bun 1.4.4: 84 pass, 0 fail, 407 expect calls, 10 files; 11.37 s. Includes the targeted cases below and existing regressions. |

Primary independent execution evidence: tool stdout from this review, summarized above. `tests/helpers.ts:47–79,97–100` creates uniquely named `c1_test_*` databases, migrates/seeds them and drops those test databases on normal cleanup; `tests/findings-r02.test.ts` operates on its own test contexts. No ROOM-01/02 live fixture mutation, browser, Docker test, service restart, installation, app/test/config edit or new test code was performed by this reviewer. Although `DATABASE_URL` was absent from the invoking shell environment, the Bun suite successfully connected; configuration provenance was not inspected and no credentials were recorded. Mode B was **NOT RUN by this reviewer**. Producer's separate results, not independent QA: `docs/results/C1-LOCAL-BUILD/R03/result.md` and `docs/results/C1-LOCAL-BUILD/R03/evidence/README.md`.

## Residuals and security gate

| ID / severity from R02 | Targeted disposition | Independent evidence and remaining boundary |
|---|---|---|
| R02-QA-01 / High | **RESOLVED_TARGETED** | `tests/findings-r02.test.ts:25–102` passed: rejected POST, authenticated GET of stored rejection, same-key replay, end-grace read and revoke denial. `apps/api/src/app.ts:528–565` serializes rejected and accepted outcomes separately. Real API proof assigned to Coordinator. |
| R02-QA-02 / High | **RESOLVED_TARGETED** | `tests/findings-r02.test.ts:104–158` passed: key B bound to accepted response/fingerprint, stable replay, changed-payload 409, one response/two receipts. Insert and fingerprint check at `apps/api/src/app.ts:365–394,449–460`. |
| R02-QA-03 / High | **RESOLVED_TARGETED** | `tests/findings-r02.test.ts:161–244` passed blocked submission vs revoke/expiry and facilitator open vs expiry. Submission and lifecycle controls lock session then grant (`apps/api/src/app.ts:340–363,594–601,633–641,673–681`); revoke locks facilitator grant then participant grants without session lock (`:693–712`), avoiding an obvious reversed session-lock order in these paths. Tests use timed sleeps to arrange ordering, not an instrumented deterministic barrier for every interleaving. |
| R02-QA-04 / High in QA source; Coordinator calibrated Medium | **RESOLVED_AT_CLIENT_SEAM; browser pending** | `tests/findings-client.test.tsx:360–392` passed with happy-dom, mocked fetch and fake WS: pending key and original nickname are resent and stored label shown. `apps/web/src/join-attempt.ts:24–30`, `apps/web/src/containers.tsx:81–103`. Not a real browser or independent live DB proof; Coordinator owns that check. |
| R02-QA-05 / High | **STRUCTURAL FIX VERIFIED; deterministic interleave NOT RUN** | `apps/api/src/snapshot.ts:148–198` uses one repeatable-read transaction for revision/question/own answer/identity; WS uses that view (`apps/api/src/ws.ts:79–94`). Existing concurrent read/submit and equal-revision tests passed (`tests/findings-r02.test.ts:246–308`, `tests/findings-client.test.tsx:395–412`). Stress scheduling does not establish that a commit happened between individual snapshot reads; a controlled mid-read commit and verification of both old/new coherent views would close this specific evidence gap. Do not call that interleaving PASS. |
| C1-RV-02 security gate | **PARTIAL — tested lifetime paths pass; exact concurrent boundary not proven** | Existing full suite passed idle expiry sweep, past-grace resync and revoked socket vs later broadcast (`tests/findings-r02.test.ts:311–376`) and expired resync/broadcast (`tests/findings-api.test.ts`). `apps/api/src/ws.ts:96–110,123–136,222–245` builds payload, revalidates immediately before send, sweeps, and actively disconnects revoked participants. Test sleeps 1.2 s for a 1 s grace; it does not prove the precise equality boundary. The stated check/send linearization admits an already-in-flight frame; no post-revoke disclosure was reproduced. A controlled revoke/expiry around revalidation/send and explicit evaluation of the approved boundary would close that concurrency evidence gap without inventing a zero-network-race policy. |

Previously verified C1-RV-05 question-transition progress is not reopened: existing happy-dom transition regressions passed; real-browser retest is Coordinator-owned. Statuses above are scoped to named cases, not full C1-01–16 re-certification.

## Runner hygiene and limitations

Static inspection only: `tests/run-in-docker.sh:21–36` now invokes `docker run` without `exec`, allowing its EXIT trap to run on ordinary completion, and passes environment names rather than expanded values in Docker arguments. The runner was not executed; this does not prove cleanup under process kill or secrecy from privileged local/container inspection.

No independent real-browser/mobile/accessibility, 30-client load, crash-before-broadcast, service restart, full security certification or Mode B run was performed here. Preserve producer evidence as producer evidence; current Coordinator results should be read separately. `independent-runtime-qa` was read and applied for this review. Human acceptance and Coordinator gate decisions remain outstanding.
