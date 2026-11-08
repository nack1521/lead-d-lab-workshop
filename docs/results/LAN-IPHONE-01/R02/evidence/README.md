# Evidence — LAN-IPHONE-01 / R02
| File | Proves |
|---|---|
| `lan-guards.log` | 11/11 host guard tests: fail-closed selection, strict leaf/reuse/renewal, bounded WS proxy (healthy/unavailable/delayed/oversize/queue), fail-closed verifier |
| `lan-verify.log` | Trusted HTTPS entry: API/DB/WS ok:true, fresh push 85→86 strictly newer, poll-first stale rating 409, negatives, DB readback, fixture restored |
| `cert-renewal.log` | Leaf renewed with AKI/SKI; development CA identity retained |
| `tls-and-verify-evidence.log` | curl 200, Bun fetch 200, `openssl verify -x509_strict` OK; exact OpenSSL-3.5 strict Python NOT RUN (host LibreSSL) |
| `entry-fail-closed.log` | Wildcard/public/loopback LAN_BIND refused with exit 2 |
| `mode-a-regression.log` | Mode A 103 pass / 0 fail |
| `mode-b-regression.log`, `mode-b-evidence.log` | Mode B Docker-only runner 0 fail / 4 host-tooling skips; restart ready 200 |
| `build-default-web.log`, `build-lan-web.log` | Both builds exit 0 |
