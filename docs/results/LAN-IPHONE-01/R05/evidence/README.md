# Evidence — LAN-IPHONE-01 / R05
| File | Proves |
|---|---|
| `lan-reconcile-tests.log` | 4 controlled real-PostgreSQL tests: committed-but-ack-lost divergence detected/restored; rejected/no-op leaves revision unchanged; divergence rules; unknown session fail-closed |
| `mode-a-regression.log`, `mode-b-regression.log`, `typecheck.log` | Native 137/0; Mode B 137/0 with 9 declared skips; typecheck 0 |
Live LAN verifier was not run on the known fixtures. No keys/grants/tokens stored.
