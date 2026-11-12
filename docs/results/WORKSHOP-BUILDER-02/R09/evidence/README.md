# Evidence — WORKSHOP-BUILDER-02 / R09
| File | Proves |
|---|---|
| `ws-wire-self-paced.log` | Real Bun server WS auth frame equals HTTP /api/me for answer_mode/progress/question/revision with receiving=false |
| `mounted-ws-delete.log` | Mounted container consumes equal-revision self-paced frame (controls enabled) + completion; mounted builder DELETE removes question |
| `coalesce-merge-delete.log` | 10 WS frames → 1 report read; equal/older snapshot ignored; newer rating/poll merge; text untouched; delete reducer selection |
| `mode-a-regression.log` | Full suite 190 pass / 0 skip / 0 fail |
| `typecheck.log`, `build-web.log`, `build-cloud.log` | Typecheck 0; default and cloud-configured builds 0 |
Mobile screenshots/physical iPhone remain NOT RUN (no automation); no visual PASS.
