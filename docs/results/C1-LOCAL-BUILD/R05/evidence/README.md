# Evidence — C1-LOCAL-BUILD / R05
| File | Proves |
|---|---|
| `mode-a-regression.log` | 103 pass / 0 fail including the C1-FU-01 concurrent-send test (prints 3 admitted frames) |
| `mode-b-regression.log` | Docker-only runner: 0 fail, 4 host-tooling skips |
| `typecheck.log` | TypeScript exit 0 (empty output on success) |
Test source and corrected wording: `tests/evidence-gates.test.ts`, `apps/api/src/ws.ts`, `docs/implementation/C1-WS-AUTHORIZATION-BOUNDARY.md`.
