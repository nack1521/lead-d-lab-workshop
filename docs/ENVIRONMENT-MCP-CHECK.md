# Environment and MCP check — 2026-11-04

User reports tools mostly prepared and MCPs installed through Hermes dashboard. Read-only checks were performed; no login flow, install, cloud resource change or MCP configuration edit was performed.

## Tool observations
- docker/bun/gh/railway not found by command lookup in this agent shell; zsh login/interactive lookup also did not locate them. This is a session/PATH observation, not proof they are absent everywhere.
- Docker.app exists. Absolute Docker CLI works: client 29.9.2. Connection to selected default unix:///var/run/docker.sock fails because socket is absent; no server version verified.
- Bundled Compose exists and runs directly: v5.6.1. `docker compose` not discoverable in checked CLI environment. No desktop socket at ~/.docker/run/docker.sock in this check.
- gh not found in checked PATH or /opt/homebrew/bin, /usr/local/bin, ~/.local/bin. Installation/login not verified. Do not print tokens or run automatic authentication.
- Bun not found in checked PATH or ~/.bun/bin, /opt/homebrew/bin, /usr/local/bin. Ask for actual executable location or IDE terminal output rather than reinstall blindly.
- No DB/container/image was created or started; pgAdmin presence/DB connectivity not verified.

## Actual native MCP inventory
Located in default profile (read-only inspection explicitly requested by user), not lead-d-setup/product/qa:
| Configured name | Test result | Notes |
|---|---|---|
| figma | Connected; tools discovered: 43 | Read/design tools and use_figma available in discovery; exact supplied file edit/read access not yet proven |
| cloudflare | No cached OAuth token in noninteractive test | Configuration includes codemode=false and tool exclusions; not identical to hosted connector |
| railway | No cached OAuth token in noninteractive test | Installed/enabled is not authenticated |
| supabase | Connected; tools discovered: 31 | Optional; does not change chosen Railway/PostgreSQL architecture |
| prisma-postgres | No cached OAuth token in noninteractive test | Alternative managed PostgreSQL integration, not a generic viewer for local/Railway DB |

Lead-d-setup, product and QA each report no native MCP configured. Hosted connector status is a different system and reports disconnected for relevant services even though native default Figma/Supabase tests pass. Do not conflate tool catalog availability, server configuration, successful OAuth discovery and exact file/resource authorization.
Playwright not present in native list checked; current browser tools can cover early exploratory work. It is not a blocker for design preparation.
No MCP names were renamed, copied or enabled in other profiles. If routing Figma into Product/Coordinator is requested, use supported MCP approval/configuration flow; do not hand-edit another profile or copy OAuth tokens.

## Figma target — preserve original URL
https://www.figma.com/design/RUOnC9Q15LA7DCc6rzhZtN/Lead-D-Lab-%E2%80%94-Workshop-MVP?node-id=1-3&t=Wzmpg91DodYLXiKd-1

File key: RUOnC9Q15LA7DCc6rzhZtN. URL node-id: 1-3.
Attachment reports WebGL problem in extractor. Separate browser attempt returned request-not-satisfied error. Desktop preview open call returned success but subsequent read returned no preview tab/bridge timeout. None is proof that the user's Figma file is broken, empty or inaccessible to their own account.
Default Figma MCP connection/discovery succeeded, but no get_design_context/get_screenshot/file metadata tool was invoked on this exact file. No canvas edits were made and no design has been inspected or verified.
Next: approve which Lead+D bot gets access to existing Figma connection, then read exact file/node before design writes. Do not make file public solely to work around tooling.
