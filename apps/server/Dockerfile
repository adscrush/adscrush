# ─── Server (Bun + Elysia + tRPC) — Production Dockerfile ───────────────────
# Multi-stage build using Turborepo's prune for minimal final image.
# Build stages use Node.js (pnpm ecosystem); runner uses Bun for minimal runtime.

# ─── Base ───────────────────────────────────────────────────────────────────
FROM node:22-alpine AS base
RUN npm install -g pnpm@10.8.1 turbo@2.8.17
WORKDIR /app

# ─── Pruner ─────────────────────────────────────────────────────────────────
FROM base AS pruner
ARG APP=server
COPY . .
RUN turbo prune @adscrush/${APP} --docker

# ─── Installer ──────────────────────────────────────────────────────────────
FROM base AS installer
ARG APP=server
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

# ─── Builder ────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
ARG APP=server

# Install pnpm, turbo, and bun for the build step
RUN npm install -g pnpm@10.8.1 turbo@2.8.17 bun

COPY --from=pruner /app/out/full/ .
COPY turbo.json turbo.json
COPY --from=installer /app .
RUN pnpm turbo build --filter=@adscrush/${APP}

# ─── Runner ─────────────────────────────────────────────────────────────────
FROM oven/bun:1.3 AS runner

WORKDIR /app

# Copy built output + dependencies
COPY --from=builder /app/apps/server/package.json ./apps/server/package.json
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/server/node_modules ./apps/server/node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/node_modules ./node_modules

# Security: drop root privileges — image already has `bun` user (uid 1000)
RUN chown -R bun:bun /app
USER bun

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

CMD ["bun", "run", "apps/server/dist/index.js"]
