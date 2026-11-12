# Evidence — WORKSHOP-BUILDER-02 / R03
| File | Proves |
|---|---|
| `builder-views.log` | 7 UI seam tests: Create dialog/cancel/confirm, one 3-control type group, per-question ended score chart with no Open, latest-three text + distinct additional action, expanded dialog without latest duplicates, zero-state chart, End confirmation |
| `builder-targeted.log` | 9 API/DB/WS tests including latest-three + older cursor feed without duplicates, HR read-only, locks |
| `report-after-end.json` | Live fresh-room flow: publish/open 200 (no ROOM_ENDED), 4 text answers, report latest 3 newest-first + older feed only answer 1, read-only revision unchanged, ended report retains score/choice/text charts, ended open 409, HR report 200/write 403 |
| `mode-a-regression.log` | Full suite 157 pass / 1 skip / 0 fail (skip = retired legacy facilitator-UI test, not a pass) |
| `typecheck.log`, `build-web.log`, `build-lan.log` | Typecheck and both builds exit 0 |
No browser screenshots: no browser automation in this environment; real desktop/phone visual flows are NOT RUN.
