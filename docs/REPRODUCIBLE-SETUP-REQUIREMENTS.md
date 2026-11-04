# Dual-mode setup — acceptance contract for Antigravity

Status: user requested native Bun + Docker PostgreSQL for daily development, plus a no-host-Bun Docker path for repository consumers. This document specifies acceptance criteria; Dockerfile/Compose/CI implementation is still an Antigravity task.

## Mode A: daily development
- React and Elysia run natively with pinned Bun/toolchain versions; PostgreSQL uses a project-scoped Docker Compose service and named volume.
- DB reachable from host via loopback-only mapped port; native app DATABASE_URL uses host address, not Compose service DNS.
- pgAdmin 4 is an acceptable DB viewer; it does not replace the database. If pgAdmin is native, connect to 127.0.0.1 and the mapped port; if containerised on the same network, use the PostgreSQL service name and container port. pgAdmin login is separate from PostgreSQL credentials.

## Mode B: fresh clone, Docker-only
- A new user needs Git and working Docker Desktop/Engine + Compose, but no Bun or PostgreSQL installed on host.
- Compose must start frontend, API and DB, not only Bun image. Use official Bun image with exact version/digest; same Bun version as Mode A and production Dockerfile.
- Include reproducible dependency installation with committed lockfile, healthchecks/readiness, migrations and explicitly labelled synthetic demo bootstrap.
- Provide project-named volumes; separate container node_modules from host dependencies; no reuse of macOS native packages inside Linux container.
- API listens on 0.0.0.0 inside container; publish dev interfaces to 127.0.0.1 by default. Between containers use service DNS, not localhost.
- PostgreSQL remains private where possible; pgAdmin optional rather than required for app startup.
- Configure Vite/container host access, API origins, WS URL and upgrade, graceful shutdown and restart reconciliation.
- Exclude secrets, interview PDF, .research clones and unnecessary context from Docker build and Git. Use .env.example with safe placeholders and separate local .env; no host credential files mounted by default.
- Document working commands (after they exist), expected URLs, dev credentials flow, stop/restart and safe reset. Clearly warn that volume deletion destroys data; normal shutdown must preserve data.

## Verification gates
1. Actual fresh checkout/new directory with no pre-existing node_modules/DB; prove Mode B runs with no host Bun using documented commands.
2. Real join → answer → persisted read-back → live aggregate, including two clients and reconnect.
3. Restart runtime/DB without deleting volume; acknowledged data remains readable. Duplicate retry counts once.
4. Run same acceptance cases in Mode A, including CORS/WS Origin checks and frontend deep-link reload.
5. On Apple silicon use supported ARM64 images; verify deployment target architecture separately in build/CI rather than assuming local binaries are portable.
6. Record exact commit/runtime/image versions, commands, exit codes and limitations in README/evidence. No claim that setup works until executed.

## GitHub delivery wording
Publish source + Dockerfile/Compose + lockfile + .env.example + README, not local Docker caches, node_modules or DB volumes. Users build/pull images via documented path; a prebuilt GHCR image is optional and requires separate publication approval. GitHub itself does not install Bun for users.
