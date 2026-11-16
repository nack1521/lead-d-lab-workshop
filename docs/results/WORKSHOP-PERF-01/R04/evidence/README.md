# Evidence — WORKSHOP-PERF-01 / R04
Sanitized aggregate summaries only; no tokens/credentials/DB URLs.
| File | Proves |
|---|---|
| `group1-summary.txt` | lifecycle + r10 + r09 focused group exit 0, 10 pass / 0 fail |
| `findings-summary.txt` | mounted findings file exit 0, 19 pass / 0 fail |
| `group3-summary.txt` | builder/self-paced/builder-views exit 0, 23 pass / 0 fail |
| `typecheck-summary.txt` | typecheck compile evidence only |

RED was observed by QA before the mounted synchronization fix; corrected tests GREEN. Whole suite/browser/HR-ended/room-switch/load/cloud NOT RUN. DB calls used existing helpers' unique c1_test_* loopback DBs only; no production/known DB reset.
