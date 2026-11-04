# Tool installation and Figma read verification

## Approved scope
User approved Bun and GitHub CLI installation, public GitHub repository `lead-d-lab-workshop`, Git identity from authenticated GitHub account, and Figma access for Product for reading only. No Figma canvas edits or application implementation are approved by this setup task.

## Installed / exercised
- Bun 1.4.4, revision 1.4.4+38afee6c8: `/Users/aiink/.bun/bin/bun`, symlink `/Users/aiink/.local/bin/bun`.
- GitHub CLI 2.103.3: `/Users/aiink/.local/bin/gh`.
- Both binaries downloaded from official GitHub releases for macOS ARM64. Download SHA-256 checked against official release API digests before installing:
  - Bun archive: c240d7f0ccb90c263a849fcdb09b7ee62630d921348ed6aafda86b9d577bc510
  - gh archive: d700207eae9ae98fe2b89535c2c087c07823d4628c56364695a5a07ef311c062
- Tested native execution: `bun --version`, `bun --revision`, simple Bun console smoke check, `gh --version`, and executable discovery from zsh login shell.
- No shell startup files changed: existing `.local/bin` PATH setup was sufficient.
- User completed gh login. CLI read-back confirms active GitHub account `nack1521`; public user metadata names `Apirach (Nack)`.
- Local Git identity set only for this repo to the verified display name and GitHub ID-based noreply email. No global Git identity changed.

## Figma verified read through Coordinator connection
Original file key: `RUOnC9Q15LA7DCc6rzhZtN`; original URL node-id `1-3`, represented as `1:3` per MCP schema.
The supported connection tool installed Figma into the current Coordinator profile and OAuth connection succeeded. Read-only get_metadata calls returned:
- 0:1 — 01 Brief & Foundations
- 1:2 — 02 Wireframes & Flows
- 1:3 — 03 UI & Handoff
Each queried page returned a canvas with no child elements in metadata. No implemented UI design was inspected, generated or written. No use_figma/create_session or other canvas write was called.

## Product connection — blocker resolved
Earlier Product provisioning was interrupted/not_connected; Coordinator installation did not provision Product automatically. The user subsequently completed Product authorization.
Verification on 2026-11-04 (+07): `hermes -p lead-d-product mcp list` lists enabled Figma; `mcp test figma` connected and discovered 43 tools. Product canonical Bot Chat then directly called get_metadata four times: list pages, then 0:1, 1:2 and 1:3 in file RUOnC9Q15LA7DCc6rzhZtN. All reads succeeded. Coordinator audited the exported last-turn tool calls and read back the generated report.
Evidence: docs/product/FIGMA-READ-VERIFICATION.md. The read-only access blocker is resolved for this file; no write capability/permission or canvas-edit approval is asserted. No credential files were copied or config hand-edited.

## GitHub MCP attempt
User asked whether their GitHub MCP could be used. Tool search and inspected profiles did not expose it. A supported MCP installation attempt for `github` returned unknown catalog entry. Do not install a guessed community server. Authenticated gh is available and sufficient for the authorized repository operations; GitHub MCP remains not installed in this profile.

## Remaining
No app tests, database migrations, Docker Engine test, deployment or Figma writes in this installation task. Repository creation/push results are tracked separately after actual execution/read-back.
