FROM node:24-bookworm-slim AS base

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

COPY apps/web apps/web
COPY packages/shared-types packages/shared-types
COPY packages/shared-ui packages/shared-ui
COPY packages/shared-worker-runtime packages/shared-worker-runtime

RUN pnpm install --offline --frozen-lockfile=false
RUN pnpm --filter @audio-suite/web build

FROM node:24-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
