# Tooling, MCP และ Figma-first preparation

Read-only machine check: 2026-11-04T13:33:48+07:00
Architecture: arm64. Antigravity.app exists in /Applications.
Docker, Bun, gh, psql, railway, wrangler, brew not found on this tool session PATH. Docker.app/OrbStack.app/Figma.app not found in standard /Applications or ~/Applications; Docker CLI absent in checked common paths including ~/.docker/bin. This is not an exhaustive disk search.
Node v26.12.1 and Git 2.54.0 available in this session. Node/npm resolve inside Hermes-managed tools; IDE terminal may have a different PATH. Do not modify Hermes-managed runtime for application setup.
Hermes MCP list for lead-d-setup: no servers configured. Does not establish Antigravity MCP state.

## Recommended tools
Required before local backend spike: Docker Desktop (Apple silicon) + Compose; Bun; Git; Node LTS available to the IDE where Vite/Wrangler/Playwright toolchains require it (pin supported versions after compatibility check).
Use local PostgreSQL in Docker, with project-named volume, loopback-only published port, development-only credentials. No host Postgres installation required. Application setup/Compose/Dockerfile are Antigravity coding tasks, not authored here.
Project dev dependencies later: Vite, Elysia, Drizzle/migration tooling (proposal), Wrangler, Playwright. Railway CLI and gh helpful for deployment/repo operations later; not required to design UI.
Optional: DBeaver/Postico for DB inspection; psql can run inside DB container; Bruno/Postman optional because curl and tests may suffice.
Avoid Kubernetes, Redis, BullMQ and a Docker MCP daemon-control interface for this MVP.
Docker Desktop licensing depends on usage/organisation; review terms before installing. Installing outside project folder needs explicit scope exception. No system tools installed in this round.

Verification after authorized install: docker version (client+server), docker compose version, docker info, bun --version, node --version in IDE terminal. Later build actual app image, start DB, test persistence/restart; version output alone is not app verification.

## MCP shortlist — recommendations, not connections
| MCP | Who/when | Security/limits |
|---|---|---|
| Cloudflare Docs | Lead/Antigravity during research | Start with docs-only, no account mutation required where public endpoint allows |
| Figma official remote | Product design / Antigravity design context | https://mcp.figma.com/mcp; OAuth, supported-client eligibility, edit permissions and write entitlement must be checked; not every Figma MCP has canvas write |
| Playwright official | Senior Tester exploratory QA; Antigravity browser debugging | May duplicate host browser tools; not a substitute for committed automated regression tests or physical iPhone Safari |
| Railway official | Coordinator deploy inspection/Antigravity debug after staging exists | https://mcp.railway.com or railway mcp; CLI >=5.44.0 per current docs. Can deploy/change resources/expose variables; authorize selected project only and approve writes individually |
| Cloudflare API/Observability | Deployment stage | https://mcp.cloudflare.com/mcp and product-specific observability endpoint; API grants can be broad, scope carefully |
| GitHub | PR/issues stage | Optional; gh may suffice. Restrict target repo. No publish authorization from connection |
| PostgreSQL MCP | Deferred | Prefer local/read-only role with DB-enforced permissions, no unrestricted production SQL. psql/GUI may suffice |

Host configuration is separate: connecting Hermes does not connect Antigravity or every bot. Avoid installing all MCPs in all profiles. Use official sources, pin versions for local servers, review actual tools and permission scopes, redact secrets/logs, and read back external writes.
Figma remote docs state client eligibility through Figma MCP catalog; MCP protocol support alone is not proof Hermes/Antigravity can authorize. Verify actual client connection before promising direct canvas editing; never spoof a different client identity.
No servers installed/authorized or accounts accessed in this round.

## Figma-first cycle proposal
1. Local brief: participant mobile, facilitator desktop/projector, HR desktop; decide flow before styling.
2. File pages: Brief & Flows, Foundations, Participant, Facilitator, HR Insights, Prototype & Handoff.
3. Wireframes include join/wait/rating/poll/submitting/saved/error/reconnect/closed, facilitator lobby/question control/live result, HR coverage/distribution/blockers/empty data.
4. Foundations: Thai-readable typography, spacing, semantic colours, focus/error/disabled states, touch targets and text alternative to charts. Use auto layout, components and variants rather than detached pictures.
5. Clickable vertical flow: join → answer → live result → HR summary. Design fixtures labelled as sample; Figma prototype is not DB/realtime evidence.
6. Product reviews flow; Senior Tester reviews ambiguous/error/recovery/accessibility states; user approves direction.
7. Handoff selected frame/node URLs, tokens, responsive rules and state specs to Antigravity. Inspect real browser output against approved design.
Runtime compatibility spike may occur separately before full UI implementation; Figma-first does not prove backend/deployment viability.

To write Figma: obtain user-selected draft/editable file URL, confirm ownership and edit scope, connect a supported client and test capability, then write and read back the exact file. If unavailable, produce local design specification for manual Figma work; do not claim a Figma artifact exists.

## Sources checked
- https://docs.docker.com/desktop/setup/install/mac-install/
- https://antigravity.google/docs/mcp
- https://developers.figma.com/docs/figma-mcp-server/remote-server-installation/
- https://developers.figma.com/docs/figma-mcp-server/write-to-canvas/
- https://docs.railway.com/ai/mcp-server
- https://developers.cloudflare.com/agents/model-context-protocol/cloudflare/servers-for-cloudflare/
- https://github.com/microsoft/playwright-mcp
