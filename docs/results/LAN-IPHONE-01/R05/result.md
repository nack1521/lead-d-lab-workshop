# LAN-IPHONE-01 / R05 — Verifier possibly-committed control reconciliation

- **Task/run:** LAN-IPHONE-01 / R05 (`main`, HEAD `9a909bf`, not pushed); baseline LAN R04
- **Producer:** DeepSeek Harness (single writer); **Reported:** 2026-11-12T08:09:49+07:00
- **Status:** **READY_FOR_REVIEW** (narrow verifier fix); live verifier run on known fixtures and device/CA work remain NOT RUN.

## R04-QA-01 disposition: **FIXED**
- The verifier no longer trusts a control acknowledgement. It captures the prior lifecycle (session status, active question, receiving/closed_at per question), executes controls, and in `finally` reads the **authoritative current lifecycle** and decides restoration via `needsRestoration(prior,current)`.
- If divergence is found (including a control committed with a lost/discarded acknowledgement), the supported prior lifecycle is restored through the approved control API, then re-read and asserted equal (`sameLifecycle`). A control that committed but whose response was lost therefore cannot silently leave the synthetic fixture altered.
- If no divergence exists (early failure/rejected control), no restore call is made — an unchanged fixture is not reopened and its revision is not advanced.
- Unavailable/unsupported prior state fails closed (no blind restore); restoration uses isolated synthetic fixtures only. Existing early-refusal/no-op, exact post-mutation restoration and control-revision/DB correlation are retained.

## Controlled evidence (isolated synthetic DB/API only)
- `tests/lan-verifier-reconcile.test.ts` **4 pass / 0 fail**: real poll-open commit with discarded ack detected as active-question divergence and exactly restored; rejected control committing nothing leaves revision unchanged and needs no restore; divergence rules for status/active/receiving/closed_at/question-set; unknown session yields null lifecycle (fail closed).
- Verifier code: `lan/verify.ts` (reconcile in finally), `lan/lifecycle-support.ts` (read/compare); typecheck 0.
- **Live LAN verifier NOT RUN on known ROOM fixtures** by instruction/safety; the old unsafe run was not repeated. The controlled tests are real PostgreSQL/API on isolated `c1_test_*` databases.
- Native `bun test tests` → 137 pass / 0 fail (745 expects); Mode B Docker-only runner → 137 tests, 0 fail, 9 declared skips; typecheck/builds 0.
- Preserved: C1/CA/proxy/default-store dispositions, strict TLS/leaf/CA identity, real participant/facilitator behavior; no TLS regeneration, network/device trust or LAN rewrite. Physical iPhone/Safari remains NOT RUN.

Evidence: `evidence/` (LAN reconcile log, regression/build logs, README).
