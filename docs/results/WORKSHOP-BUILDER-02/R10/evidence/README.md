# Evidence — WORKSHOP-BUILDER-02 / R10
| File | Proves |
|---|---|
| `coalesce-red.log` | Fail-first: invalidation during in-flight read lost (readVersions [1], pending false) + unhandled rejection |
| `coalesce-green.log` | Trailing latch: in-flight invalidation runs once after settlement; 10 updates during run1 → exactly 2 runs incl final state; cancel prevents trailing; rejection bounded/no loop |
| `mounted-final-text.log` | Mounted BuilderApp: stale revision-6 text in delayed read while revision 7 arrives → trailing read shows only 'Latest final text', bounded reads |
| `mode-a-regression.log` | Full suite 194 pass / 0 skip / 0 fail |
| `typecheck.log`, `build-web.log`, `build-cloud.log`, `api-image-build.log` | Typecheck/dev+cloud builds/API image 0 |
Mobile screenshots/physical iPhone remain NOT RUN; no visual PASS.
