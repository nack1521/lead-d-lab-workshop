# Evidence — WORKSHOP-BUILDER-02 / R02
| File | Proves |
|---|---|
| `web-api-base.log` | 5 seam tests: native local 127.0.0.1:3000, explicit cloud wins, secure same-origin LAN, builder imports shared API_BASE (no local default), HTML 200 rejected as non-JSON |
| `builder-targeted.log` | Builder API/DB/WS cases still 9 pass / 0 fail |
| `mode-a-regression.log` | Full native suite 150 pass / 1 skip / 0 fail (skip is the retired legacy facilitator-UI test, not a pass) |
| `typecheck.log`, `build-web-default.log`, `build-web-lan.log`, `build-web-public.log` | Typecheck/builds 0; native fallback present; public build 0 loopback refs |
Browser roundtrip/phone viewport are NOT RUN. No secrets/grants stored.
