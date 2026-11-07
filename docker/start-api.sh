#!/bin/sh
# Container entrypoint: wait for PostgreSQL, apply migrations, then serve.
# A simultaneous `docker compose restart db api` must not leave the API dead.
set -e

attempt=0
until bun run apps/api/src/migrate.ts; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 30 ]; then
    echo "c1 api: database not reachable after $attempt attempts" >&2
    exit 1
  fi
  echo "c1 api: waiting for database (attempt $attempt)" >&2
  sleep 2
done

exec bun run apps/api/src/index.ts
