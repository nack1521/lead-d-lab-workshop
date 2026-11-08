# C1 R04 + LAN-IPHONE-01 R01 — Coordinator runtime/browser review

- Date: 2026-11-08 (+07). Observed report HEAD `d2d09c29ef8a020d06348407a8e8493085394604`; current app `f7b2006db0e9e161278c5080129f8409d6c8d1bf`; C1 seam/test base `62bfa8d54c4f01a54a2d08648032637c16f6e850`.
- Scope: existing controlled C1 tests in Mode B, isolated-output builds, current local participant UI in A/B, real LAN HTTPS/API/PostgreSQL/WSS, certificate/tooling checks. Canonical Senior QA is reviewing Mode A and static semantics separately; its report is not claimed here.
- **Result:** executed C1 controlled tests and targeted local-browser paths PASS; no new C1 core defect confirmed in this subset. LAN mode exists and normal explicit-CA TLS/API/WS works, but has open verification-tooling/certificate compatibility findings. Physical iPhone is **NOT RUN / PENDING_USER_ACTION**. Neither task is human-accepted or published.

## Executed evidence
| Check | Actual result | Evidence |
|---|---|---|
| Mode B existing Docker-only suite | Exit 0, 91 pass / 0 fail / 455 expects; includes C1-EG-01/02. Exact committed source, private inherited DB env, temporary source cleanup verified. | [runner summary](evidence/C1-R04-LAN-R01-20261108/mode-b-regression.json), [log](evidence/C1-R04-LAN-R01-20261108/mode-b-regression.log) |
| Production and LAN builds | Both exit 0; separate private output directories, no replacement of the currently served dist. | [production](evidence/C1-R04-LAN-R01-20261108/build-production.log), [LAN](evidence/C1-R04-LAN-R01-20261108/build-lan.log) |
| Mode A real Chromium participant | Anonymous join; rating 4 + native-Enter Thai/emoji multiline save; next poll editable and saved; actual socket close/reconnect; return to prior saved rating restores 4 and multiline content with effectively disabled controls. No captured JS errors. | [browser ledger](evidence/C1-R04-LAN-R01-20261108/browser-ledger.jsonl), [restored screenshot](evidence/C1-R04-LAN-R01-20261108/A-restored-after-reconnect.png) |
| Mode B real Chromium participant | Join, rating 3 + comment, accepted saved state and native state frames; no captured JS errors. Real DB readback: one response for that participant/question. | [browser ledger](evidence/C1-R04-LAN-R01-20261108/browser-ledger.jsonl), [DB](evidence/C1-R04-LAN-R01-20261108/mode-b-db-readback.json), [screenshot](evidence/C1-R04-LAN-R01-20261108/B-rating-saved.png) |
| Real TLS/LAN private paths | curl with explicit project CA and hostname verification: /join,/ready,/lan-health 200; missing auth 401; bad Origin 403; private env/key paths 404; public CA endpoint exactly matches local public cert. No -k or system trust changes. | [TLS/readiness](evidence/C1-R04-LAN-R01-20261108/tls-readiness.json) |
| Existing LAN verifier, normal state | Exit 0 with actual 201 rating/poll, stable replay 200, auth/origin negatives 401/403 and DB readback. Do not treat its ok flag alone as proof (finding below). | [actual output](evidence/C1-R04-LAN-R01-20261108/lan-verifier-rerun.json) |
| Independent fresh LAN facilitator WS | Real control commit 200, initial snapshot revision 53, new snapshot revision 54 with a strictly-new predicate; participant label absent from aggregate. DB confirms exact browser multiline rating and poll rows. This independently proves fresh fanout in the tested path, unlike the verifier's cached-frame predicate. | [fresh frame and DB](evidence/C1-R04-LAN-R01-20261108/fresh-lan-ws-and-db.json) |

## Open findings
Open Coordinator inventory: 2 Medium, 1 Low; no Critical/High finding confirmed by this Coordinator subset. Peer review may add distinct findings; do not merge counts before reading it.

### LAN-COORD-01 — Medium / Functional: verifier can return false green
- Source: `lan/verify.ts` sets `results.ok=true` after collecting statuses without required success assertions. The catch path sets ok=false but does not set a nonzero process exit. Its live-push predicate can reuse the initial cached snapshot.
- Runtime reproduction: opened the real fixture poll, then ran the existing rating-first verifier against real HTTPS/API/DB. Rating returned 409, accepted_rating null, multiline false and own-question match false, yet **ok=true and exit 0**. The verifier restored rating open afterward. No fake server/response, source edit or fixture-file replacement.
- Separate real unavailable-target run returned ok=false/ETIMEDOUT but still exit 0. Expected: failed required checks and exceptions must signal failure, and fresh push must require a post-action frame/revision.
- Evidence: [false green](evidence/C1-R04-LAN-R01-20261108/lan-verifier-false-green.json), [failure exit](evidence/C1-R04-LAN-R01-20261108/lan-verifier-failure-exit.json). CLI evidence; screenshot not applicable. This finding does not mean the application's correct 409 rejection is broken.

### LAN-COORD-02 — Medium / TLS compatibility: missing Authority Key Identifier
- Default Python 3.14 `ssl.create_default_context(cafile=project_CA)` rejects the active leaf certificate with `SSLCertVerificationError: Missing Authority Key Identifier`. Certificate SAN does match the chosen LAN IP.
- Normal curl with explicit CA, LibreSSL verify and Bun verifier succeed. This is a specific strict-client compatibility failure, **not evidence that Safari has failed**. Python strict verification was not disabled to hide it.
- Inspect `lan/generate-certs.sh` leaf extensions; add standards-compatible identifiers and verify with strict validation through the active coding tool. Preserve the existing CA/device-trust identity unless a separately explained change is necessary.
- Evidence: [TLS result](evidence/C1-R04-LAN-R01-20261108/tls-readiness.json). CLI evidence; screenshot not applicable.

### LAN-COORD-03 — Low / Setup portability: unsupported SAN reuse probe
- Host LibreSSL 3.3.6 returns exit 1, `unknown option -ext`, for the exact `openssl x509 ... -noout -ext subjectAltName` probe used by the generator. The branch then cannot recognize the existing matching certificate and selects reissue.
- Command failure reproduced without regenerating or replacing certificates. Repeated reissue is a code-path consequence, not a claimed rerun. Use a supported inspection method and test matching-IP reuse versus changed-IP renewal.
- Evidence: [non-mutating compatibility probe](evidence/C1-R04-LAN-R01-20261108/certificate-generator-compatibility.json).

## User safety and pending device proof
- Active LAN entry observed on `192.168.1.98:8443`; Mac API/web/DB remain loopback. Phone URL: `https://192.168.1.98:8443/join`, synthetic room `ROOM-01`. Actual iPhone network membership/model/iOS/trust status is unknown from current reports.
- Corrected README's certificate-bootstrap instruction to trusted out-of-band PUBLIC CA transfer (e.g. AirDrop), without proceeding past an HTTPS warning. Immutable producer R01 report retains historical wording; this correction supersedes that instruction. Never transfer private keys or install a profile automatically. Development CA trust is user-controlled and must be removed after testing.
- Physical Safari, browser HTTPS/WSS under user-installed trust, facilitator browser UI, full accessibility, 30-client load, host reboot/crash-before-broadcast and exhaustive scheduler interleavings are not certified by this subset.

## Preservation, limitations and progress
- No application/tests/config changes, service restarts, global trust/keychain/firewall/router changes, public tunnel or publication by Coordinator. Existing verifier and real synthetic room controls added synthetic rows and restored rating open; no reset or row deletion.
- Existing tests isolate disposable test databases. Builds stayed under ignored `.local/coordinator-C1-R04-LAN-R01`. Private grants were generated/read only inside local processes and never printed.
- Protected shared progress/handoff, pre-existing unattributed R03 evidence and immutable producer R04/LAN R01 files matched the captured baseline (26 files). R02 live-log append remains unowned and unstaged.
- Tooling correction notes: initial native Enter probe needed explicit focus/text; an unquoted numeric CSS selector and an incorrect readback column name were corrected. Effective disabledness uses `:disabled` because fieldset inheritance does not change each input's `.disabled` property. These were probe issues, not application defects.
- Current next gate: canonical Senior QA consolidation, narrow LAN tooling/certificate fixes through the active coding tool if upheld, and actual user-assisted iPhone evidence. No blanket C1 rewrite and no human acceptance inferred from the user's completion notification.
