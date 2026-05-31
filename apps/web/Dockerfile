FROM node:26-bookworm-slim AS base

WORKDIR /app

RUN corepack enable

FROM base AS deps

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
COPY packages/shared-ui/package.json packages/shared-ui/package.json
COPY packages/shared-worker-runtime/package.json packages/shared-worker-runtime/package.json

RUN pnpm install --frozen-lockfile=false

FROM deps AS builder

ARG NEXT_PUBLIC_AUDIO_SUITE_API_BASE_URL=http://localhost:8000
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ENV NEXT_PUBLIC_AUDIO_SUITE_API_BASE_URL=$NEXT_PUBLIC_AUDIO_SUITE_API_BASE_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

COPY apps/web apps/web
COPY packages/shared-types packages/shared-types
COPY packages/shared-ui packages/shared-ui
COPY packages/shared-worker-runtime packages/shared-worker-runtime

RUN pnpm install --offline --frozen-lockfile=false
RUN pnpm --filter @audio-suite/web build

FROM node:26-bookworm-slim AS runner

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --retries=5 --start-period=30s \
  CMD curl -f http://127.0.0.1:3000/ || exit 1

CMD ["node", "apps/web/server.js"]
