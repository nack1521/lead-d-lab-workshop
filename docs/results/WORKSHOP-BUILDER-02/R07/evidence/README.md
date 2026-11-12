# Evidence — WORKSHOP-BUILDER-02 / R07
| File | Proves |
|---|---|
| `cors-red.log` | Fail-first: real Bun.serve PATCH/DELETE preflight missing methods before fix |
| `cors-green.log` | 6 real-server tests: PATCH/DELETE preflight exact origin/headers, denied/null origins, readable 401 follow-ups, authenticated PATCH/DELETE persistence, guards |
| `mode-a-regression.log` | Full suite 177 pass / 0 skip / 0 fail |
| `typecheck.log`, `api-image-build.log` | Typecheck 0; API image builds successfully |
Production/browser verification NOT RUN (local-only writer run). No secrets or production rows in evidence.
