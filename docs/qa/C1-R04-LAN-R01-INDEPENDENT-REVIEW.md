# C1 R04 + LAN-IPHONE-01 R01 — Independent targeted review

**Verdict: CHANGES_REQUESTED for LAN safety and inaccurate boundary assurance; C1-EG-01/02 scheduled cases pass within their tested scope.** Findings below include concrete source/documentation defects and explicitly identified, unproven runtime risks. Physical iPhone is NOT RUN / BLOCKED_PENDING_USER_ACTION, not a code failure. No acceptance or task closure.

Observed 2026-11-08 15:45 +0700: report HEAD `d2d09c29ef8a020d06348407a8e8493085394604`; C1 seam build `62bfa8d54c4f01a54a2d08648032637c16f6e850`; LAN build `f7b2006db0e9e161278c5080129f8409d6c8d1bf`. Relevant `apps tests db lan package.json bun.lock compose.yaml Dockerfile` diff from LAN build to HEAD was empty. The same paths differ from C1 build by the LAN web/proxy/cert/verify/package changes. Existing dirty progress, handoff, R02 live-log append and untracked Coordinator evidence were preserved.

## Independent execution — Mode A

| Command | Exit | Actual |
|---|---:|---|
| `bun run typecheck` | 0 | Project typecheck completed. |
| `bun test tests` | 0 | Bun 1.4.4; 91 pass, 0 fail, 455 expect calls, 11 files, 14.07 s. Includes seven evidence-gate tests and existing regression. |

Evidence is this review's actual tool stdout and the bounded summary here, not the producer's logs. Before execution reviewed `tests/helpers.ts:48–84,102–105`: unique `c1_test_*` databases, isolated test server and normal test-DB cleanup. No existing ROOM fixtures were touched by this reviewer. Mode B, browser, live LAN/TLS/API checks, physical phone, `lan/verify.ts`, service restarts and Docker writes were NOT RUN here; Coordinator owns their separate checks. The suite does not test the LAN proxy itself.

## C1 controlled evidence

- **C1-EG-01: PASS for controlled HTTP and WS schedules.** `tests/sql-barrier.ts:33–48` pauses after the real repeatable-read session query; `tests/evidence-gates.test.ts:66–169` commits an actual submission while paused and asserts old/new revision, question and own response, plus HTTP participant identity and database count. Independent suite passed both cases. Not an exhaustive scheduler or crash-before-broadcast proof; WS frame contract does not include identity.
- **C1-EG-02: PASS for the specified single-send schedules and equality seam, not a general one-frame proof.** `tests/evidence-gates.test.ts:172–383` exercises real DB grant rows at chosen TTL/grace instants, an allowed send, a paused expiry with one admitted frame and subsequent 4401, and revoke/disconnect while paused. No production-duration wait or every interleaving is established. See QA-R04-01 below.
- **Seam scope:** `apps/api/src/index.ts:5–7` calls `startServer` without hooks; `tests/helpers.ts:74–84` is the observed caller supplying test hooks/SQL wrapper. `apps/api/src/ws.ts:118,243` nevertheless executes `await` on an optional hook even when absent, adding an asynchronous yield. Thus the injected hook is absent in the normal entrypoint, but claiming literally no scheduling effect in production is stronger than the source demonstrates. No functional failure from the yield was reproduced.

## Findings

### QA-R04-01 — Medium, static contract/evidence gap: single in-flight-frame upper bound is not established

`docs/implementation/C1-WS-AUTHORIZATION-BOUNDARY.md:19–28` says at most one in-flight frame after the per-socket revalidation boundary. `apps/api/src/ws.ts:104–119,193–198,231–245` has separate asynchronous `sendCurrent` and `broadcast` calls, without visible per-socket serialization; more than one concurrent call can potentially pass revalidation before expiry/revoke and each proceed to send. The optional-hook await adds another scheduling point. The test `tests/evidence-gates.test.ts:279–331` controls exactly one send, not concurrent sends. This is a source-level risk and over-broad assurance, **not a reproduced post-revocation disclosure** or a demand for zero network races. Have the active coding tool/Coordinator verify with a controlled multiple-send schedule; if borne out, align the documented bound and implementation with the existing approved lifetime semantics and obtain any policy decision needed. Preserve the successful single-send evidence.

### QA-LAN-01 — High, static security/availability risk: unbounded pre-upstream WebSocket queue

`lan/lan-entry.ts:99–106,149–187` upgrades the client before upstream Origin/auth decisions and queues incoming messages while the upstream is not OPEN. There is no explicit queue count/byte budget, application-level 4 KB frame check, connection/handshake deadline, or backpressure in this proxy path; the API's later `apps/api/src/ws.ts:148–160` limit cannot protect memory consumed before forwarding. A peer able to reach the private listener could accumulate queued frames during a delayed upstream connection. This is a concrete missing guard with a plausible availability impact; **no resource-exhaustion exploit/load run was performed**. Request bounded frame/queue/connection handling and tests including delayed/unavailable upstream, denial and close, without exposing grants or weakening upstream Origin/auth. Severity assesses potential impact, not measured load.

### QA-LAN-02 — Medium, concrete documentation conflict: initial certificate warning bypass suggested

`docs/results/LAN-IPHONE-01/R01/result.md:70–74` and `README.md:89–90` offer downloading the public CA after proceeding past the initial HTTPS warning. This conflicts with `docs/handoffs/LAN-IPHONE-01.md:19–23`, which forbids bypassing certificate warnings. The historical R01 report must remain immutable; add a current correction through the authorized owner and update active instructions via the coding writer. Use an authenticated out-of-band transfer of **only the public CA certificate**, user-reviewed installation/trust and removal; never transfer private keys. Do not claim a phone was tested.

### QA-LAN-03 — Medium, static exposure risk: auto-detection does not enforce private LAN

`lan/lan-entry.ts:25–37` selects the first non-internal IPv4 from the preferred or any other interface, without validating private address space or restricting explicit bind values. `lan/generate-certs.sh:8–12` separately defaults to en0. On a different host/network the proxy could bind a public/VPN interface or mismatched certificate/interface despite the handoff's private-LAN constraint. The producer's current private-address observation does not demonstrate such exposure happened. Require explicit validated private-interface selection or fail closed, and test changed/missing interface and SAN agreement; no network configuration changes by QA.

## Other review observations and integrity

- LAN proxy forwards original Origin upstream (`lan/lan-entry.ts:151–154`); HTTP forwards request headers (`:65–78`); upstream must still enforce exact Origin/auth. This source review does not prove denial, close-code handling, frame limits or backpressure through the new proxy. Upstream abnormal close codes may not be valid downstream close codes (`:166–171`); close exceptions are swallowed, so verify abnormal upstream termination/client reconnect and no orphan sockets. No runtime failure claimed here.
- `apps/web/src/api.ts:1–15` preserves explicit VITE overrides, selects same-origin HTTPS/WSS when unset, and retains loopback HTTP fallback. The actual served bundle, Mac trusted TLS and phone Safari network behavior need separate real runtime proof. Producer's `docs/results/LAN-IPHONE-01/R01/evidence/README.md` indexes its own automated checks; not this review's execution. Physical Safari, secure-context UUID, network isolation, Thai/keyboard accessibility and CA removal remain pending user action/NOT RUN.
- `lan/generate-certs.sh:14–16,24–40,61–71` stores generated CA/server keys in the selected cert directory and chmods keys 600 after issuance; LAN source exposes the public CA route only (`lan/lan-entry.ts:120–125`). Did not inspect keys, filesystem permissions, listener bindings or live path responses. Verify those independently before relying on them.
- Historical integrity: `git diff --stat d35d372 HEAD -- docs/results/C1-LOCAL-BUILD/R04` was empty; R04 artifacts were not changed after their report commit in the checked range. R01 LAN artifacts first appear after `f7b2006` in report commit `d2d09c2`; no post-report commit exists in this observed HEAD range. The earlier tracked R02 live-log append remains dirty; no archived report was overwritten. This is a bounded Git check, not a cryptographic audit of external copies.
- Prior R03 residual statuses and C1-RV-05 progress remain as documented in `docs/implementation/C1-REVIEW-SUMMARY-R03.md`; this review does not erase them or certify C1-01–16, 30-client load, all mobile/accessibility/security, restart or crash recovery. `independent-runtime-qa` was read and applied. No human acceptance, publication or deployment is implied.
