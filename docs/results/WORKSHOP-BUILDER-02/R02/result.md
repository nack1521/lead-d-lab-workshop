# WORKSHOP-BUILDER-02 / R02 — Shared frontend API base policy (WB2-LOCAL-API-01)

- **Task/run:** WORKSHOP-BUILDER-02 / R02 (`main`, HEAD `fae05e9`, not pushed/deployed)
- **Producer:** DeepSeek Harness (sole coding writer); **Reported:** 2026-11-12T18:17:16+07:00
- **Trigger:** Coordinator R01 bounded retest — WB2-LOCAL-API-01 (builder defaulted API base to `''` on native local HTTP, so requests hit Vite :5173 instead of API :3000). R01 report is preserved unchanged.
- **Status:** **FIXED_LOCAL / READY_FOR_REVIEW.** Visual/browser flow remains **NOT RUN**; no cloud regression claim.

## Fix
- New shared module `apps/web/src/api-base.ts` owns the single browser base policy:
  - explicit `VITE_API_BASE_URL`/`VITE_WS_URL` always wins (cloud unchanged);
  - native HTTP local page → `http://127.0.0.1:3000` and `ws://127.0.0.1:3000/ws` (existing participant behaviour);
  - secure page with no explicit URL → same-origin `''` API and `wss://<host>/ws` (LAN verifier entry unchanged; no loopback baked into HTTPS/public builds).
- `apps/web/src/api.ts` now delegates to `resolveApiBase`/`resolveWsUrl`; `apps/web/src/builder.tsx` imports **`API_BASE` from the participant API module** instead of defining its own default. No Vite proxy, no manual env step, no silent production fallback.
- Hardened the frontend seam: builder responses go through shared `readJsonBody`; an HTML 200 (dev-server fallback) is never treated as an authenticated JSON result — it throws the local network/API-base error instead of returning null/HTML.
- Unslop R02 visual contract untouched (no layout/CSS/logo changes).

## Regression at the frontend integration seam
`tests/web-api-base.test.ts` — **5 pass / 0 fail**:
1. native local HTTP → API `http://127.0.0.1:3000` / WS `ws://127.0.0.1:3000/ws`;
2. explicit cloud URLs win unchanged;
3. secure page without explicit URL → same-origin API + `wss://host/ws` (no loopback);
4. static integration guard: builder imports `API_BASE, connectSocket` from `./api.ts`, has **no** own `const API_BASE`, no direct `VITE_API_BASE_URL`, and uses `readJsonBody(response)`;
5. HTML 200 → rejected as non-JSON; JSON 200 parsed normally.

Build-level verification: default native build contains the `http://127.0.0.1:3000` fallback; public build with reserved `.invalid` hosts still has **0** loopback refs. Direct `GET :3000/api/admin/rooms` unauthenticated → **401 JSON**; `GET :5173/api/admin/rooms` → 200 HTML fallback, which the builder no longer dials by default.

## Verification (actual)
- `bun test tests/web-api-base.test.ts` → **5/5**.
- `bun test tests/builder.test.ts` → **9/9** (room authoring/answers/WS/HR/locks/pagination unchanged).
- `bun test tests` → **150 pass / 1 skip / 0 fail** (151 tests, 19 files; skip is the previously retired legacy facilitator-UI test, not a pass).
- `bun x tsc --noEmit` → 0; `bun run build:web` → 0; `bun run build:web:lan` → 0; public candidate build → 0 with 0 loopback refs.
- Protected dirty files and untracked Coordinator/design assets untouched; no secrets/grants committed.

## NOT RUN / limits
- **Actual browser roundtrip** (admin → create room → question → open → participant answer → live result), text/latest-five/pagination, HR read-only and phone viewport were **NOT RUN** in this environment (no browser automation; credential entry remains user/vault-assisted). API/DB/WS and the seam tests above are not browser certification.
- Mobile/keyboard/reduced-motion visual checks and independent QA remain NOT RUN. No push/deploy/public verification.

## Changed paths
`apps/web/src/api-base.ts` (new), `apps/web/src/api.ts`, `apps/web/src/builder.tsx`, `tests/web-api-base.test.ts` (new), `docs/results/WORKSHOP-BUILDER-02/R02/**`, `docs/results/INDEX.md`.

## Next gate
User-assisted browser roundtrip on native local (admin `admin`), then cloud/LAN smoke and independent QA. Unslop R02 visual direction remains approved and unchanged.
