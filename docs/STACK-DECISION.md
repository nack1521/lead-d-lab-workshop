# Stack decision — approved direction

User decision: 2026-11-04 (+07)
- React frontend on Cloudflare
- Elysia backend with Bun runtime on Railway
- PostgreSQL persistent database
- Native WebSocket for realtime; no Redis/BullMQ in initial MVP

Stack selection is not authorization to install system software, connect accounts, create cloud resources, deploy or publish.
ORM (Drizzle proposed), exact versions, origin topology, auth policy and cloud region remain open; compatibility must be exercised in Antigravity IDE.

## Local development decision
User selected native Bun + PostgreSQL in Docker. Repository must additionally provide Docker-only setup without host Bun for fresh clones; acceptance contract: docs/REPRODUCIBLE-SETUP-REQUIREMENTS.md.

## Local recommendation
Docker Desktop for Apple silicon with Compose: PostgreSQL local + production-image build verification. Run React/Elysia natively for iteration, then test backend container. No Kubernetes/Redis/queue required.
Figma-first design is feasible. Approve user flow and wireframes before visual polish. Remote write capability depends on supported MCP client, account entitlement and file edit access. User supplied a Figma file URL; exact target access/design content is not yet verified. See docs/ENVIRONMENT-MCP-CHECK.md.
