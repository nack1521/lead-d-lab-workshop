# syntax=docker/dockerfile:1
# Pinned base image digests recorded after local `docker pull` (2026-11-07).
FROM oven/bun:1.4.4-alpine@sha256:4cf82f5686b196504fe119db3fcd9185b191f82ece82c40680e597228ec6070a AS build
WORKDIR /app
COPY package.json bun.lock tsconfig.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN bun install --frozen-lockfile
COPY apps ./apps
COPY db ./db
ARG VITE_API_BASE_URL
ARG VITE_WS_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_WS_URL=${VITE_WS_URL}
RUN cd apps/web && bunx vite build

FROM oven/bun:1.4.4-alpine@sha256:4cf82f5686b196504fe119db3fcd9185b191f82ece82c40680e597228ec6070a AS api
WORKDIR /app
COPY package.json bun.lock ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN bun install --frozen-lockfile --production
COPY apps/api ./apps/api
COPY db ./db
USER bun
EXPOSE 3000
CMD ["sh", "-c", "bun run apps/api/src/migrate.ts && bun run apps/api/src/index.ts"]

FROM oven/bun:1.4.4-alpine@sha256:4cf82f5686b196504fe119db3fcd9185b191f82ece82c40680e597228ec6070a AS web
WORKDIR /app
COPY --from=build /app/apps/web/dist ./apps/web/dist
COPY docker/web-serve.ts ./docker/web-serve.ts
USER bun
EXPOSE 5173
CMD ["bun", "run", "docker/web-serve.ts"]
