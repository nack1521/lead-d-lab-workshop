# Evidence — HR-SUMMARY-01 / R01
Sanitized, aggregate-only. No grants, tokens, nicknames, comments or connection strings stored here.
| File | Proves |
|---|---|
| `hr-red.log` / `hr-green.log` | TDD RED (5 fail before implementation) and GREEN (5 pass) for HR API correctness/privacy/role cases |
| `hr-smoke-30.log` | Fresh owned session, 30 synthetic participants via real API, facilitator WS frames, ended session, HR summary, independent DB reconciliation, 732 ms observed |
| `hr-summary-live.json` | Live HR API response (aggregates only) after issuing a private HR grant |
| `hr-reload-check.log` | Reload persistence (`reload_persisted=true`) |
| `hr-live-evidence.log` | Live summary shape, reconciliation and raw-data scan (none) |
| `issue-hr-grant.log` | Private grant path only (token not printed) |
| `mode-a-regression.log` | Native 121 pass / 0 fail |
| `mode-b-regression.log` | Mode B Docker-only: 0 fail, 9 declared skips |
| `typecheck.log`, `build-web.log`, `build-web-lan.log` | Typecheck and both builds exit 0 |
