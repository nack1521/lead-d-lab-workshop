# Evidence — LAN-IPHONE-01 / R04
| File | Proves |
|---|---|
| `lan-guards.log` | 21 host branch tests: flush/direct budget, slow peers, issuer override confinement + real mismatched-SAN CLI refusal, preflight states, CONNECTING/OPEN cleanup, incomplete-cleanup failure |
| `lan-verify.log` | Trusted HTTPS verifier exit 0: supported preflight, exact restoration, control revision 146 = pushed with matching question + DB total, 3/3 socket attempts settled |
| `tls-and-verify.log` | Current LAN URL, curl/Bun/openssl-strict TLS success, verifier exit 0 |
| `cert-renewal.log` | Leaf renewed for current address 192.168.4.97; CA identity preserved |
| `entry-san-mismatch-refusal.log` | Stale-SAN startup refused before bind |
| `mode-a-regression.log` | Mode A 113 pass / 0 fail |
| `mode-b-regression.log`, `mode-b-skips.txt` | Mode B 104 pass / 0 fail / 9 declared skips; restart ready 200 |
| `typecheck.log`, `build-default.log`, `build-lan.log` | typecheck 0; both builds 0 |
