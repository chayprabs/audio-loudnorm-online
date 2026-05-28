FROM node:24-bookworm-slim

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
COPY packages/shared-ui/package.json packages/shared-ui/package.json
COPY packages/shared-worker-runtime/package.json packages/shared-worker-runtime/package.json

RUN pnpm install --frozen-lockfile=false

COPY apps/web apps/web
COPY packages/shared-types packages/shared-types
COPY packages/shared-ui packages/shared-ui
COPY packages/shared-worker-runtime packages/shared-worker-runtime

WORKDIR /app/apps/web

EXPOSE 3000

CMD ["pnpm", "dev", "--hostname", "0.0.0.0", "--port", "3000"]
