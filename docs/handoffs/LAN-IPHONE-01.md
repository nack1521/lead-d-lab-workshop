# LAN-IPHONE-01 — Private-Wi-Fi iPhone test mode

Status: **HANDOFF_PREPARED / NOT_DISPATCHED / DEVICE_TRUST_REQUIRES_USER_ACTION**. The user approved preparing this English handoff and copyable prompt after asking to test on their iPhone. Hermes has not changed listeners, certificates, firewall, device trust or application code. Pasting the start prompt is user-operated; one coding writer only.

## Outcome and entry
Make the existing prototype usable in Safari on the user's own iPhone over the same trusted private Wi-Fi, with HTTPS the phone actually trusts. This is development-device testing, not public deployment or a 30-manager onboarding solution. Do not require workshop participants to install a CA in the eventual production service.

1. Read AGENTS.md, docs/CODING-WORKFLOW.md and the current C1 summary at docs/implementation/C1-REVIEW-SUMMARY-R03.md. C1 remains PARTIAL with C1-EG-01/02 open; this task neither closes nor replaces those gates.
2. Inspect Git, running work and relevant source before editing. If another C1 coding/evidence run is active, finish or explicitly checkpoint/stop it before this task. Preserve protected dirty progress/handoff, the R02 live-log append and pre-existing untracked evidence; do not bootstrap over current sessions or database volumes.
3. Inspect actual interfaces, private LAN address, ports and installed tooling when starting. Do not hardcode an observed IP, assume an interface name, expose a VPN/public interface, or claim the iPhone shares the same network without confirmation. Report guest-network/AP isolation, VPN and firewall blockers rather than changing router/system settings.

## Smallest maintainable transport
- Prefer one HTTPS LAN entry forwarding web, /api and /ws to ONE selected existing API instance. A small project-local TLS/reverse-proxy mode over an existing stack is preferable to exposing the DB or adding another API process for the same sessions. Document which Mode A/B stack backs it; facilitator and participant must use that same authority.
- Choose the smallest approach supported by discovered Bun/Docker tooling. A new dev-only proxy/image must be justified, exactly pinned and checked for the actual platform; no global installer/daemon or production-stack migration. This handoff supplies no invented commands or package versions.
- Bind the new entry only to the selected private LAN address where feasible, on a checked unprivileged port. Keep API/DB ports private or internal; keep existing local modes usable. Do not simply bind every service to 0.0.0.0.
- HTTPS Safari must use the Mac LAN entry, not localhost/127.0.0.1 as an API address. Prefer same-origin API and WSS routing. Preserve explicit existing VITE_API_BASE_URL / VITE_WS_URL behavior; use a separate LAN env/build if needed rather than replacing defaults globally or leaving stale build-time loopback URLs. VITE_* values are public: URLs/settings only, never keys or grants.
- Forward WS upgrades and the real browser Origin correctly. Configure only exact intended origins, including the existing local origins still needed; preserve first-message WS authentication, session/role isolation and all negative-origin checks. No wildcard Origin, grant in URL, or proxy auth bypass.

## HTTPS and trust boundary
- Use a user-supplied suitable trusted certificate, or a narrowly scoped local development CA with a server certificate whose SAN matches the exact LAN IP/name. Keep cert keys/CA keys and generated secrets under private ignored project storage, never Git/images/public web roots/logs. Local-only CA issuance is not public ACME/DNS issuance.
- The user must review and manually authorize any certificate/profile installation and SSL trust on the iPhone. Do not install profiles, enroll MDM, modify the Mac keychain, change system/browser trust, disable TLS checks, bypass certificate warnings or disable a firewall. If device assistance is required, deliver the ready project setup and mark the phone test BLOCKED/PENDING_USER_ACTION rather than claiming it works.
- Transfer at most the PUBLIC CA certificate when appropriate, never a private key or the contents of .local/.env/fixtures. Give clear user-controlled trust and removal instructions, identifying the local CA and its dev-only scope. Avoid requiring Mac trust changes unnecessarily: the facilitator may keep using an existing localhost entry to the same selected API.
- Do not silently downgrade to unencrypted LAN HTTP or add a weak UUID fallback. Safari must have a trusted secure context and working crypto.randomUUID; the current app relies on it.

## Acceptance and evidence
| ID | Required verification |
|---|---|
| LAN-01 | Actual chosen LAN URL and startup/readiness commands are reported without secrets. iPhone and Mac use the same trusted private network; no public tunnel, port-forward or cloud resource. |
| LAN-02 | After the user's explicit device-trust action, real iPhone Safari opens HTTPS without certificate bypass; secure context/UUID capability works. A Mac-only or desktop-emulated run is not iPhone PASS. |
| LAN-03 | Anonymous join, optional nickname, rating/poll and multiline Thai/emoji comment work through the real API and PostgreSQL. All submission/idempotency/unknown rules remain unchanged. |
| LAN-04 | A separate facilitator context on the same backing API sees committed live aggregates; close/reconnect behavior works. Private facilitator grants stay out of chat, screenshots and URLs. |
| LAN-05 | Browser API/WS traffic uses the intended reachable LAN HTTPS/WSS origin, not loopback or mixed content. Unauthorized origin/role/session requests still fail. |
| LAN-06 | Existing local Mode A/B tests and relevant builds pass on the changed source. Preserve database state; document safe normal stop and return to loopback-only mode without down -v/prune. |
| LAN-07 | Generated keys/credentials stay ignored; no private files served; only intended listener is exposed on the private LAN. Document limitations and clean shutdown/device certificate-removal steps. |

Use synthetic data only. Record actual iPhone model/iOS/Safari information supplied or observed, user actions, results and limitations; unknown values remain unknown. Physical-phone steps not performed are NOT RUN or BLOCKED. One phone test is not full mobile, accessibility, load or security certification.

## Permitted scope and unchanged boundaries
Active coding tool owns the minimal application/dev-config/tests/README changes needed for this LAN mode; Hermes remains non-coding. No HR features, Redis/queues/AI, public hosting, tunnels, port forwarding, external DNS/certificate issuance, paid services, global installs, router/firewall changes, destructive reset or automatic tool switch. Ask for a separate decision if any of these becomes necessary. Project-local setup does not authorize device/system trust changes.

Task: LAN-IPHONE-01; select a genuinely unused run from docs/results/INDEX.md. Write immutable docs/results/LAN-IPHONE-01/<RUN>/result.md and result.json with LAN-01..07 evidence, exact changed paths/commands/exits, chosen topology, private-key exclusions and pending user actions; update INDEX last. Do not change C1 case/finding verdicts merely because the phone mode runs. Use meaningful owned local commits, no push. Before budget exhaustion save the existing workflow's transfer checkpoint.

## Reference facts
- Current frontend source defaults to http://127.0.0.1:3000 and ws://127.0.0.1:3000/ws; current server wrapper supplies no TLS configuration. Changing the address bar alone is insufficient. Reinspect before editing.
- MDN secure-context requirement: https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID
- Apple manual certificate trust guidance: https://support.apple.com/en-us/102390 — installing a certificate profile does not automatically enable SSL trust. Trust is a separate user action under Settings > General > About > Certificate Trust Settings when applicable.
