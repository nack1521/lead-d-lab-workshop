# WORKSHOP-BUILDER-02 R01 — Coordinator bounded retest

Status: CHANGES_REQUESTED / WB2-LOCAL-API-01. Source HEAD fae05e9. Producer report recorded baseline 537d700, not final commit; preserve it as immutable self-report.

Executed independently:
- `bun run typecheck`: exit 0.
- `bun test tests/builder.test.ts`: exit 0; 9 pass / 0 fail / 72 expects. Existing helper creates/drops a fresh test database; no known ROOM fixture mutation. Backend evidence, not browser UI certification.
- Local API http://127.0.0.1:3000/ready: ready/db ok.
- Browser http://127.0.0.1:5173/facilitator: new admin demo entry renders, original logo present. No authenticated browser flow completed.

## WB2-LOCAL-API-01 — blocking local browser flow
`apps/web/src/builder.tsx:11` defaults its own API_BASE to empty string when VITE_API_BASE_URL is absent. Existing participant API module instead defaults HTTP local pages to http://127.0.0.1:3000. Vite config has no /api proxy. On existing native local run, builder requests therefore target Vite port 5173, not API port 3000.
Actual browser probes from facilitator page:
- GET /api/admin/rooms on port 5173: HTTP 200, Content-Type text/html;charset=utf-8, HTML body (Vite fallback), not room API JSON.
- POST /api/admin/login with empty JSON (no credentials): HTTP 405, text/plain;charset=utf-8.
- Direct API port 3000 GET /api/admin/rooms: HTTP 401 JSON UNAUTHORIZED (correct unauthenticated API behavior).
These are route probes, not a claim of an entered-password attempt. Source and response show default native local builder login cannot reach the intended API. Existing production VITE_API_BASE_URL may avoid this; cloud regression NOT RUN and no cloud failure claimed.

## Follow-up for sole coding writer
Fix local builder base resolution by sharing the existing API base policy, retaining explicit cloud VITE_API_BASE_URL and secure same-origin LAN behavior. Do not add an unconditional loopback default to HTTPS, silently point local at production, or require undocumented manual env edits to recover established native mode. Add a regression at this frontend integration seam, not only API login unit tests. Verify frontend error handling never interprets HTML success as an authenticated JSON result. Preserve current room authoring/server tests and R02 visual contract. Use fresh synthetic rooms for actual browser roundtrip admin -> create room -> question -> open -> participant answer -> live result. Browser credential entry, if needed, is user/vault-assisted. Also verify text/latest-five/pagination, HR read-only and phone viewport; do not declare those passed from API-only tests.
Produce immutable WORKSHOP-BUILDER-02/R02 result.md/result.json and update INDEX last. No push/deploy yet. No app/test/config code edited by Coordinator. Protected existing work preserved.

Remaining visual acceptance, authenticated browser flow, mobile, full-suite/Mode B, public deployment remain NOT RUN in this bounded retest.
