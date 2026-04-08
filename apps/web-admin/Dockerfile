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
  && pnpm --filter @medstudy/ui-kit build \
  && pnpm --filter @medstudy/web-admin build

FROM node:22-bookworm-slim AS runner

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_ENV="production"
ENV PORT="3001"
ENV HOSTNAME="0.0.0.0"

RUN corepack enable

WORKDIR /workspace

COPY --from=builder /workspace /workspace

EXPOSE 3001

CMD ["pnpm", "--filter", "@medstudy/web-admin", "start"]
