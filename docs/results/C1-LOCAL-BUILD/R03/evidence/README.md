# Evidence index — C1-LOCAL-BUILD / R03 (R02 residual fixes + C1-RV-02 gate)

Sanitized evidence from commands actually run on build `cce8db1`. No capability tokens, passwords, raw DATABASE_URLs or real personal data are stored here.

| Path | What it proves | Command / exit |
|---|---|---|
| `R03-evidence-red.log` | Genuine RED before the R02-QA-01..03/05 and C1-RV-02 fix: 7 of 11 API/DB/WS finding tests fail (rejected receipt GET, dedup key binding, blocked-write revocation/expiry, idle sweep) | `bun test tests/findings-r02.test.ts`, exit 1 |
| `R03-evidence-green.log` | Same suite after fixes: 11 pass | exit 0 |
| `R03-client-red.log` | Genuine RED at the React-container seam: 3 fail (edited nickname payload/label, equal-revision reconciliation) while the already-passing join/question-transition regressions stay green | `bun test tests/findings-client.test.tsx`, exit 1 |
| `R03-client-green.log` | Same suite after fixes: 8 pass (including unchanged-join and question-transition regressions) | exit 0 |
| `mode-a-full-regression.log` | Current-build Mode A suite: **84 pass / 0 fail**, 407 expect, 10 files | `bun test tests`, exit 0 |
| `mode-a-qa01-02-evidence.log` | Live Mode A API: rejected POST 422 then authenticated receipt GET 200 with the stored rejection; deduplicated key B bound to the accepted response; same key B changed payload 409; DB shows two accepted receipts pointing at one response | `curl` + `docker exec psql`, exit 0 |
| `mode-b/container-suite.log` | Same 84-test suite inside a throwaway Docker container from committed source (Docker-only, production images untouched) | `tests/run-in-docker.sh c1b_default`, exit 0 |
| `mode-b/verify.log` | Mode B registry/schema state, restart health, authoritative join label, rejected receipt GET 200, image hygiene; runner static check shows no `exec` and no inline secret argument | `docker compose`, `curl`, `psql`, exit 0 |
| `c1-16-and-hygiene.log` | No tracked DB password, no grant/nickname/comment logging, runner cleanup trap and env-by-name forwarding, production image has no tests/happy-dom/.env, tracked R02 live-log append left unstaged | shell scans, exit 0 |

Honest limits kept in `result.md`: real-browser flows are NOT RUN in this session (no browser automation), and the authorization/send boundary is the documented per-socket revalidation point rather than a claim of zero network race windows.
