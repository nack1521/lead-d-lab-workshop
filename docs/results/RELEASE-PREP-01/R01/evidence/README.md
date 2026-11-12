# Evidence — RELEASE-PREP-01 / R01
No secret values, grants or connection strings are stored here.
| File | Proves |
|---|---|
| `env-cloud-red.log` / `env-cloud-green.log` | TDD for PORT/0.0.0.0 cloud bind, local defaults and precedence; invalid PORT fails closed |
| `api-image-build.log` / `api-image-runtime.log` | Dedicated API image builds; runtime with PORT=8080: /health,/ready 200, API route 401, migrations, 0.0.0.0 bind; test container removed |
| `build-public.log` / `public-build-checks.log` | Public candidate built with reserved .invalid hosts; 0 loopback/private-IP/DB/token literals |
| `local-services.log` | Local API health/ready and SPA deep links /join,/room,/facilitator,/hr |
| `public-safety-audit.log` | Pattern audit: 0 private keys/AWS/GitHub/sk/JWT; 5 placeholder DB-URL lines; 0 real-like; ignore/dockerignore coverage |
| `mode-a-regression.log`, `mode-b-regression.log`, `typecheck.log`, `build-default-web.log`, `build-lan-web.log` | Native 137/0; Mode B 137/0 with 9 declared skips; typecheck/builds 0 |
Runbook: `docs/deployment/RELEASE-PREP-01.md`. Cloud execution NOT RUN.
