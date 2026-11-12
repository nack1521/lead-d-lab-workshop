# Evidence — WORKSHOP-BUILDER-02 / R01
| File | Proves |
|---|---|
| `builder-targeted.log` | 9 real API/PostgreSQL/WS tests: admin/HR auth, rooms, 3 question types, lifecycle, idempotency, live snapshot vs DB, locks, choice/text counts and >5 cursor pagination without duplicates, HR read-only |
| `builder-live-flow.json` | Fresh real-API room flow: draft→open, participant rating accepted, report n=1 mean=4, re-login reload persistence, HR read 200/write 403, ended |
| `mode-a-regression.log` | Full native suite 145 pass / 1 skip / 0 fail (legacy facilitator-UI test retired, counted as skip not pass) |
| `typecheck.log`, `build-web.log`, `build-lan.log` | Typecheck and default/LAN builds exit 0 |
No browser screenshots: no browser automation/image capability in this environment; real visual/mobile checks are NOT RUN. No secrets/grants stored.
