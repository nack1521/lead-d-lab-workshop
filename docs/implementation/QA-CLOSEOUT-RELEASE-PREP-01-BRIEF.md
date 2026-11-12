# QA closeout / release preparation — Coordinator brief

User authorized targeted QA cleanup and release/deployment preparation. This does not authorize cloud-account access, resource creation, publication, costs, push or a global install. Current local user-confirmed HR usability is retained; no repeated login request.

## Verified preparation, not implemented fixes
Observed source/report baseline c707d6b. Read current Dockerfile, .dockerignore, .env.example, Vite config, frontend URL selection, API server/config and container startup. Retrieved Railway Bun/Dockerfile/healthcheck and Cloudflare SPA serving documentation. Wrote docs/handoffs/QA-CLOSEOUT-RELEASE-PREP-01.md plus its English starter for the user-operated DeepSeek writer. No app/test/config changes or coding dispatch by Coordinator.

Concrete readiness traps found: root Dockerfile ends in web stage; API defaults to loopback and reads API_PORT rather than provider PORT; empty secure-page Vite URLs assume same-origin, unsuitable for static Pages plus separate Railway API. Deployment preparation must test chosen API image/port behavior locally and build public frontend candidates with explicit safe HTTPS/WSS placeholders. These are preparation requirements, not observed cloud failures.

QA carry-forward: singleton poll and rendered caveat; fresh WS bucket equality; final verdict/exit after cleanup with a controlled failure; separate LAN verifier unknown-control-outcome reconciliation. Keep bounded ten-request overlap terminology, any-positive-n user decision, and already-passing product behavior. No generic rewrite or new features.

Tool discovery only: Bun and gh resolve on the checked PATH. gitleaks, trufflehog, railway and wrangler do not resolve on that PATH; this is not proof of absence everywhere. No account auth or installation attempted. Full-history secret safety is NOT VERIFIED; the writer must use an approved reviewed available scanner or explicitly scoped alternative, and block publication on unresolved sensitive findings. No raw secret output or autonomous history rewrite.

## Required outputs and stop
Local QA results are separate next HR/LAN runs; deployment preparation is RELEASE-PREP-01 next unused run. Require actual local tests/build/container output and a runbook, not stub config or invented cloud success. The next gate is independent review plus user decisions on account/project, region, budget, valid evaluator access and publication. Public service creation/deployment and live phone acceptance remain NOT RUN.

Shared dirty progress/handoff/live log, historical reports and unattributed work are preserved; progress recorded here. Only this brief/new handoff/starter are owned by this preparation. The Copy widget is profile-cache chat utility, not application code and not an automatic command sender.
