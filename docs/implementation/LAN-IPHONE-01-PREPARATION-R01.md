# LAN-IPHONE-01 — Coordinator preparation R01

- Date: 2026-11-08 (+07); observed baseline c30164f6fb5e363c59107b27a0af6507a63bf402.
- User approved preparing an English prompt/handoff for testing their iPhone over private Wi-Fi without a public tunnel. This does not delegate coding-tool control to Hermes or authorize automatic device/system trust changes.
- Read current AGENTS, coding workflow, README, frontend endpoint defaults, API server wrapper and static host. Frontend currently defaults to loopback API/WS and the server wrapper has no TLS configuration.
- Prepared docs/handoffs/LAN-IPHONE-01.md and its concise English START text; copy UI lives only in the Coordinator profile cache. No application, tests or deployment config written by Hermes.
- TLS approach is a dev-only project mode, with a user-assisted certificate-trust boundary if a local CA is used. Real 30-manager delivery must not depend on certificate-profile onboarding.
- New task is NOT DISPATCHED; LAN listeners, firewall, routing, certificates and iPhone trust were not changed by this preparation. No IP, port availability, script, package pin or successful phone session is invented.
- C1 R03 remains PARTIAL with C1-EG-01/02 open. LAN evidence uses its own task/run, not fabricated C1 closure. Single-writer sequencing remains mandatory.
- Shared progress is recorded here because docs/AI-PROGRESS.md and the original C1 handoff contain protected pending work; both remain untouched, as do prior evidence and the R02 live-log append.
- References reviewed: Apple manual certificate trust https://support.apple.com/en-us/102390 and MDN crypto.randomUUID https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID.
- Verification: browser rendered the Copy UI; its text exactly matched the canonical START file. Isolated clipboard stubs exercised success, fallback selection and manual-copy messaging without changing the system clipboard or dispatching a coding prompt. Relative links, LAN-01..07 inventory, English prompt, targeted secret patterns and protected-file hashes passed. No application tests were rerun for documentation-only preparation.
- Next gate: user pastes START into the active coding tool; it implements/verifies project-local setup and requests explicit device assistance when needed. Physical iPhone tests remain NOT RUN until actual user/device execution.
