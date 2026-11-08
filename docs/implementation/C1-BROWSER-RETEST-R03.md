# C1 local build — Coordinator targeted retest R03

**Targeted result:** the three previously runtime-reproduced residuals (R02-QA-01/02/04) pass the executed checks in both modes. No new functional failure was observed in this subset. This is not C1 acceptance or closure of untested security/concurrency scenarios; canonical Senior QA retest remains separate.

## Provenance and evidence ownership
- Observed 2026-11-08 (+07); submitted report `730ca02ff68b6bb6bcc00040c8c0740fcc58c8d9`, app/build `cce8db1ac194f2ea6d9d23b707c0c05a5841b6d0`.
- Existing untracked `docs/implementation/evidence/C1-RETEST-R03/` contained earlier evidence dated 2026-11-07. Its provenance was not assumed from filenames; it was not overwritten, staged, or used as this review's direct execution proof. Its file hashes are preserved in the new regression record.
- This review owns only this report and [C1-RETEST-R03-20261108 evidence](evidence/C1-RETEST-R03-20261108/coordinator-regression.json). Source/tests/config and protected pending work were not edited.

## Current execution
- Mode A API/web were not listening at first observation. Existing local commands started API at `127.0.0.1:3000` and the rebuilt production frontend at `127.0.0.1:5173`; no unrelated process was killed. Production build exited 0. Background job handles: `proc_1af282dc9aad` (API), `proc_6b4bac4b3cc7` (web).
- Both API readiness endpoints (3000/3001) and both web join endpoints (5173/5174) returned 200 after setup. Mode B's existing containers were left running; no service/DB restart or volume removal.
- Mode A `bun test tests`: **84 pass / 0 fail**, exit 0, ten files. `bun run typecheck`: exit 0.
- Mode B: inspected, existing `sh tests/run-in-docker.sh c1b_default`, private environment forwarded by name, project-local TMPDIR: **84 pass / 0 fail**, exit 0, ten files. Its temporary source/dependency directory was empty after execution and the owned empty parent directory was removed. No secret was expanded into runner argv, no host Bun/node_modules were reused, and no production image was modified.

## Direct residual retests
| ID | Targeted outcome | Evidence |
|---|---|---|
| R02-QA-01 | RESOLVED_API_DB in A/B | Oversized-comment POST 422; own receipt GET 200 with stored rejected outcome, terminal/replay true and VALIDATION_FAILED. No 500. |
| R02-QA-02 | RESOLVED_API_DB in A/B | Accept under key A; new key B deduplicates against the same answer; same B payload replays; changed B payload returns 409 IDEMPOTENCY_CONFLICT. DB: one response, two accepted receipts and one separate rejected receipt. |
| R02-QA-04 | RESOLVED_BROWSER_DB in A/B | Lose a real join response after commit, edit nickname, retry: complete original payload is unchanged; UI, server response and direct DB all retain the original label. |

- [Receipt API/DB ledger](evidence/C1-RETEST-R03-20261108/receipt-retest.jsonl), [browser ledger](evidence/C1-RETEST-R03-20261108/browser-ledger.jsonl), [direct browser-record DB readback](evidence/C1-RETEST-R03-20261108/db-readback.jsonl).
- Native Enter preserves a multiline comment in UI and DB; HTML-like text renders literally; accepted score 4 is read-only. Each browser test participant has exactly one response and one receipt.
- In both modes the real participant socket reconnects: two socket instances, latest socket open, and equal-revision authoritative state received after the prior saved state (A revision 26 repeated; B revision 20 repeated). UI retains saved score 4. This proves the observed reconnect journey, not every possible same-version/concurrent-read interleaving.
- Screenshots: [Mode A](evidence/C1-RETEST-R03-20261108/A-join-label-and-reconnect.png), [Mode B](evidence/C1-RETEST-R03-20261108/B-join-label-and-reconnect.png). No credential was typed into a browser form; join grants were issued by the real anonymous API and remained private.

## Remaining review boundaries
- R02-QA-03 and the C1-RV-02 gate have new real-PostgreSQL/WS tests in the executed suite. Timed held-lock, revoke/expiry and scaled sweep/grace cases passed. Canonical QA must assess the source/serialization and authorization boundary; passing timed tests are not a universal zero-race proof.
- R02-QA-05 now routes participant fields through one repeatable-read transaction; the same-version reconnect and existing concurrent-read regression passed. Deterministic mid-read commit injection was not independently achieved and is not relabeled PASS.
- Authenticated facilitator browser control, physical mobile, full accessibility/security certification, 30-client load/SLA, real crash-before-broadcast and host/Docker-engine reboot remain outside this subset. Question-transition browser evidence from R02 is historical; this R03 browser subset did not re-exercise facilitator-driven transitions.
- Runtime fault wrapping discarded real join responses rather than fabricating success; fetch wrappers were restored. Synthetic rows remain for traceability. No app DB reset or destructive cleanup was used.
- Protected dirty AI-PROGRESS/original C1 handoff and the earlier R02 live-log append are preserved and excluded from staging. This report records current AI progress. No coding-tool dispatch, push/deploy, paid service or global configuration change occurred.

Next gate: read the canonical R03 QA report, consolidate original IDs and remaining evidence limits, then determine whether user trial is justified. No producer FIXED/PASS label or earlier run result grants implementation acceptance.
