# C1-LOCAL-BUILD / R05 — C1-FU-01 concurrent-send verification and wording correction

- **Task/run:** C1-LOCAL-BUILD / R05 (`main`, build `42e7bb8`, not pushed)
- **Producer:** DeepSeek Harness (single active coding writer); baseline `3ab71c4`
- **Reported:** 2026-11-08T17:24:40+07:00 (Asia/Bangkok)
- **Status:** **READY_FOR_REVIEW** (verification + documentation correction; no policy change)

## C1-FU-01 (QA-R04-01) — verification first, then wording correction: **ADDRESSED**
- Controlled test added at the real per-socket authorization/send seam: three concurrent facilitator `open` broadcasts build payloads and pass per-socket revalidation, then the participant grant is expired before release. **Observed: 3 already-admitted frames delivered** after expiry, then `resync` returned `UNAUTHORIZED` and the socket closed 4401 with no further frames.
- Therefore the earlier "at most one in-flight frame" statement is **not supported under concurrent sends**. Code comments and `docs/implementation/C1-WS-AUTHORIZATION-BOUNDARY.md` now state: a revoke/expiry after the revalidation point can interleave with **any already-admitted concurrent send** (one per in-flight send); no later send passes revalidation, explicit revocation closes the socket, and no zero-network-race guarantee is claimed.
- The test hook is awaited **only when present**, removing an unconditional scheduling yield from production sends.
- Approved auth decision point, TTL/grace/revoke semantics, C1-EG-01/02 schedules and all resolved receipt/join/UI contracts are unchanged.

## Regression (current build)
- Mode A `bun test tests`: **103 pass / 0 fail**, 491 expect, 12 files; `bun x tsc --noEmit` exit 0.
- Mode B Docker-only runner: **0 fail**, **103 tests with 4 skipped** host-tooling-dependent LAN guards (no openssl/active cert/private fixtures in the archive-only container); api+db restart healthy.
- Default and LAN web builds exit 0.
- C1 case dispositions unchanged from R04: C1-01..C1-14 and C1-16 PASS in required modes; **C1-15 PARTIAL** (real-browser NOT RUN); C1-EG-01/02 still PASS with their prior evidence.

## Evidence
- `evidence/mode-a-regression.log`, `evidence/mode-b-regression.log` (copy of the same build's runner output), `evidence/typecheck.log`
- Test source: `tests/evidence-gates.test.ts` (C1-FU-01 case; prints admitted-frame count)
- Boundary documentation: `docs/implementation/C1-WS-AUTHORIZATION-BOUNDARY.md`
