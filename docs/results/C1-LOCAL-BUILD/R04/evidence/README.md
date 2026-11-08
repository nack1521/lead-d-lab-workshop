# Evidence index — C1-LOCAL-BUILD / R04 (verification-only: C1-EG-01, C1-EG-02)

Sanitized evidence from commands actually run on build `62bfa8d`. No capability tokens, passwords or real personal data are stored here.

| Path | What it proves | Command / exit |
|---|---|---|
| `evidence-gates.log` | The seven verification tests for C1-EG-01 and C1-EG-02 pass on the current build | `bun test tests/evidence-gates.test.ts`, exit 0 |
| `mode-a-full-regression.log` | Current-build Mode A full suite: **91 pass / 0 fail**, 455 expect, 11 files | `bun test tests`, exit 0 |
| `mode-b/container-suite.log` | Same suite inside a throwaway Docker container from committed source (Docker-only; production images untouched) | `tests/run-in-docker.sh c1b_default`, exit 0 |
| `mode-b/verify.log` | Mode B api+db restart healthy after the runner, runner has no `exec`/inline secret argument, image has no tests/happy-dom | `docker compose`, `curl`, exit 0 |

Method notes (not evidence gaps):
- C1-EG-01 uses a test-boundary barrier around the application's existing PostgreSQL client, pausing the snapshot reader after its repeatable-read session read while a real submission commits. No sleeps, table locks or mocked persistence are used for the proof.
- C1-EG-02 uses real database rows for equality semantics plus a minimal inert `beforeSend` test hook to place expiry/revocation exactly between per-socket revalidation and send. Production server construction never passes hooks.
- Both gates are verification work: no application behavior, attempt policy or lifetime policy changed in this run.
