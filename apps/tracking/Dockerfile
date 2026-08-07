# ─── Tracking (Bun + Elysia) — Production Dockerfile ─────────────────────────
# Multi-stage build using Turborepo's prune for minimal final image.
# Build stages use Node.js (pnpm ecosystem); runner uses Bun for minimal runtime.

# ─── Base ───────────────────────────────────────────────────────────────────
FROM node:22-alpine AS base
RUN npm install -g pnpm@10.8.1 turbo@2.8.17
WORKDIR /app

# ─── Pruner ─────────────────────────────────────────────────────────────────
FROM base AS pruner
ARG APP=tracking
COPY . .
RUN turbo prune @adscrush/${APP} --docker

# ─── Installer ──────────────────────────────────────────────────────────────
FROM base AS installer
ARG APP=tracking
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

# ─── Builder ────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
ARG APP=tracking

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
COPY --from=builder /app/apps/tracking/package.json ./apps/tracking/package.json
COPY --from=builder /app/apps/tracking/dist ./apps/tracking/dist
COPY --from=builder /app/apps/tracking/node_modules ./apps/tracking/node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/node_modules ./node_modules

# GeoIP data (bind-mount via docker-compose volume or override at runtime)
# COPY --from=builder /app/data/GeoLite2-ASN.mmdb /var/lib/geoip/GeoLite2-ASN.mmdb

# Security: drop root privileges — image already has `bun` user (uid 1000)
RUN chown -R bun:bun /app
USER bun

ENV NODE_ENV=production
ENV TRACKING_PORT=3002
EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3002/health || exit 1

CMD ["bun", "run", "apps/tracking/dist/index.js"]
