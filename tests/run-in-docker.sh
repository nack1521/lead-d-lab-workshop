#!/bin/sh
# Run the C1 integration suite in a throwaway Docker container, never in the
# production images. Source comes from the committed tree (git archive) so the
# host node_modules and the API/web images are not used or modified.
#
# Usage: tests/run-in-docker.sh [docker-network]
# Env:   DATABASE_URL      database reachable from that network
#        ALLOWED_ORIGINS   browser origin for the stack under test
set -eu

NETWORK="${1:-c1b_default}"
IMAGE="oven/bun:1.4.4-alpine@sha256:4cf82f5686b196504fe119db3fcd9185b191f82ece82c40680e597228ec6070a"
DATABASE_URL="${DATABASE_URL:-postgres://c1:${POSTGRES_PASSWORD:?set POSTGRES_PASSWORD or DATABASE_URL}@db:5432/c1}"
ALLOWED_ORIGINS="${ALLOWED_ORIGINS:-http://127.0.0.1:5174}"

WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT
git archive HEAD | tar -x -C "$WORKDIR"

exec docker run --rm \
  --network "$NETWORK" \
  -v "$WORKDIR:/app" \
  -w /app \
  -e "DATABASE_URL=$DATABASE_URL" \
  -e "ALLOWED_ORIGINS=$ALLOWED_ORIGINS" \
  "$IMAGE" sh -c 'bun install --frozen-lockfile && bun test tests'
