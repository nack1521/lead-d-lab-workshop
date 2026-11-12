# WORKSHOP-BUILDER-02 / R07 — Real-server CORS methods for builder PATCH/DELETE

- **Task/run:** WORKSHOP-BUILDER-02 / R07 (`main`, HEAD `0fd4de6`, not pushed/deployed)
- **Producer:** DeepSeek Harness (sole coding writer); **Reported:** 2026-11-12T22:44:34+07:00
- **Status:** **SOURCE FIX + REAL-SERVER REGRESSION PASS / READY_FOR_DEPLOY REVIEW.** Production/browser verification NOT RUN; no browser PASS claimed.
- Finding: **WB2-CLOUD-CORS-01** (confirmed production transport failure). Accepted UI and unrelated dirty work preserved.

## Root cause and narrow fix
- `apps/api/src/server.ts` OPTIONS preflight advertised only `GET, POST, OPTIONS`, while the builder sends **PATCH** (question edit) and **DELETE** (question delete). A cross-origin Pages browser therefore blocked the actual request → `TypeError: Failed to fetch`.
- Fix: explicit allowed methods are now **`GET, POST, PATCH, DELETE, OPTIONS`**; exact-origin allowlist, authorization/content-type allowed headers, max-age and `Vary: Origin` are unchanged. No wildcard origin, no CORS disable, no method tunneling, no auth weakening.
- All real server routes using these methods are the guarded admin builders (`PATCH/DELETE /api/admin/rooms/:id/questions/:qid`); no unnecessary methods added.

## Regression at the real Bun.serve boundary (not app.handle)
`tests/cors-preflight.test.ts` — fail-first: before the fix PATCH/DELETE preflight failed; after the fix **6 pass / 0 fail**:
1. PATCH preflight from a separate Pages-like origin → 204, exact ACAO, allow-methods contains GET/POST/OPTIONS/PATCH/DELETE, allow-headers includes authorization/content-type, Vary: Origin.
2. DELETE preflight → 204 with DELETE advertised.
3. Denied/non-allowed and null/missing origins remain 403 without ACAO.
4. Credential-free PATCH/DELETE follow-ups reach the endpoint and return **readable 401 JSON** (`UNAUTHORIZED`) — the browser transport failure is reproduced/fixed at the server boundary.
5. Authenticated isolated test DB: PATCH label persists (verified via GET); DELETE removes a fresh unanswered draft question (verified via GET and DB row count).
6. Guards preserved: active question delete → 409 QUESTION_ACTIVE; HR scope mutation → 403; answered question dangerous PATCH → 409 QUESTION_LOCKED; ended room delete → 409 ROOM_ENDED.
- Tests use fresh `c1_test_*` databases; no production/reviewer question deleted or mutated.

## Verification (actual)
- `bun test tests/cors-preflight.test.ts` → RED before fix (2 preflight failures), GREEN **6/6**.
- Full suite `bun test tests` → **177 pass / 0 skip / 0 fail** (177 tests, 23 files; 952 expects). English UI/error mapping, latest-three/full-all text, header/alignment and lifecycle guards unchanged.
- `bun x tsc --noEmit` 0.
- API image build `DOCKER_BUILDKIT=0 docker build -f Dockerfile.api -t lead-d-lab-api:r07 .` → 0 (successfully tagged). No deployment.

## NOT RUN / limits
- **Actual production/browser verification is NOT RUN** (writer run is local-only; no push/deploy). Deployment, cloud preflight recheck, real Pages browser delete/edit and coordinator retest remain with the owner/coordinator. Do not infer browser PASS from these Bun.serve tests.
- No data resets, no deletion of production/reviewer content, no unrelated UI changes.

## Changed paths
`apps/api/src/server.ts` (explicit PATCH/DELETE in allowed methods), `tests/cors-preflight.test.ts` (new real-server regressions), `docs/results/WORKSHOP-BUILDER-02/R07/**`, `docs/results/INDEX.md`.

## Next gate
Coordinator/user deploys this narrow hotfix under explicit approval, then rechecks production OPTIONS and browser-origin no-auth PATCH/DELETE → 401 JSON, then re-tests legitimate delete/PATCH on an unanswered draft question while an answered/inactive question stays protected.
