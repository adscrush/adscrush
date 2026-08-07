# ─── Web (Next.js) — Production Dockerfile ──────────────────────────────────
# Multi-stage build using Turborepo's prune for minimal final image.

# ─── Base ───────────────────────────────────────────────────────────────────
FROM node:22-alpine AS base
RUN npm install -g pnpm@11.17.0 turbo@2.8.17
WORKDIR /app

# ─── Pruner ─────────────────────────────────────────────────────────────────
FROM base AS pruner
ARG APP=web
COPY . .
RUN turbo prune @adscrush/${APP} --docker

# ─── Installer ──────────────────────────────────────────────────────────────
FROM base AS installer
ARG APP=web
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

# ─── Builder ────────────────────────────────────────────────────────────────
FROM base AS builder
ARG APP=web

# Build-time args for NEXT_PUBLIC_* values (Next.js inlines these at build time)
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_TRPC_API_URL
ARG NEXT_PUBLIC_TRACKING_DOMAIN
ARG NEXT_PUBLIC_BUNNY_CDN_URL

ENV NODE_ENV=production
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_TRPC_API_URL=${NEXT_PUBLIC_TRPC_API_URL}
ENV NEXT_PUBLIC_TRACKING_DOMAIN=${NEXT_PUBLIC_TRACKING_DOMAIN}
ENV NEXT_PUBLIC_BUNNY_CDN_URL=${NEXT_PUBLIC_BUNNY_CDN_URL}

COPY --from=pruner /app/out/full/ .
COPY turbo.json turbo.json
COPY --from=installer /app .
RUN pnpm turbo build --filter=@adscrush/${APP}

# ─── Runner ─────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
RUN addgroup --system --gid 1001 nextjs && \
    adduser --system --uid 1001 nextjs

WORKDIR /app

# Copy standalone build output (includes server.js + minimal node_modules)
COPY --from=builder /app/apps/web/.next/standalone ./

# Copy static assets (must be done separately in standalone mode)
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static

# Security: drop root privileges
RUN chown -R nextjs:nextjs /app
USER nextjs

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["node", "apps/web/server.js"]
