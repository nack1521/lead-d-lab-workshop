# Evidence — LAN-IPHONE-01 / R03
| File | Proves |
|---|---|
| `lan-guards.log` | 15 guard tests: fail-closed selection/issuer, strict leaf + non-forced reuse + partial-CA fail-closed, pre-open caps, post-open bidirectional backpressure (slow raw client/upstream), fail-closed verifier |
| `lan-verify.log` | Trusted HTTPS verifier exit 0: prior state snapshot, exact restoration, fresh push = control revision 118 with matching question + DB total, sockets closed |
| `issuer-tls-evidence.log` | Real issuer CLI refuses public/wildcard LAN_IP (exit 2, zero files); curl/Bun/openSSL-strict TLS unchanged; CA fingerprint unchanged |
| `mode-a-regression.log` | Mode A 107 pass / 0 fail |
| `mode-b-regression.log` | Mode B Docker-only runner 100 pass / 7 skip / 0 fail |
| `typecheck.log`, `build-default-web.log`, `build-lan-web.log` | typecheck 0; both builds 0 |
