# Evidence — HR-SUMMARY-01 / R02
Aggregate-only, sanitized; no grants, tokens, nicknames, comments or connection strings.
| File | Proves |
|---|---|
| `hr-red.log` / `hr-green.log` | TDD RED (known-zero copy failed) and GREEN (11 pass) for HR-QA-01/02 |
| `hr-overlap-30.log` | Fresh owned session; bounded overlapping phases (10 in-flight, 60 ms waves): 30/30 joins, 30/30 ratings, 27/27 polls, unique ids 30; per-bucket DB equality; committed revision 89 matched by fresh WS frame; exact summary shares; sockets settled; exit 0 |
| `mode-a-regression.log` | Native 124 pass / 0 fail |
| `mode-b-regression.log` | Mode B Docker-only: 0 fail, 9 declared skips |
| `typecheck.log`, `build-web.log`, `build-web-lan.log` | Typecheck + both builds exit 0 |
