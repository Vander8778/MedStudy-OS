FROM node:22-bookworm-slim AS builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /workspace

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json tsconfig.base.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/web-admin/package.json apps/web-admin/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/domain/package.json packages/domain/package.json
COPY packages/ai-schemas/package.json packages/ai-schemas/package.json
COPY packages/ui-kit/package.json packages/ui-kit/package.json

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm --filter @medstudy/contracts build \
  && pnpm --filter @medstudy/domain build \
  && pnpm --filter @medstudy/ai-schemas build \
  && pnpm --filter @medstudy/backend build \
  && pnpm --filter @medstudy/backend --prod --legacy deploy /out/backend

FROM node:22-bookworm-slim AS runner

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_ENV="production"

RUN corepack enable

WORKDIR /app

COPY --from=builder /out/backend /app

EXPOSE 3001

CMD ["pnpm", "start"]
