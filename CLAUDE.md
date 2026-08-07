# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a **fast-growing monorepo for AdsCrush**, a digital advertising platform. It is managed with pnpm workspaces and Turbo. The primary stack is TypeScript, Next.js (app router), Elysia, Drizzle ORM, and PostgreSQL. Auth is handled by **Better Auth** (the two primary entrypoints for auth are in the `@adscrush/auth` package).

When answering architecture or codebase questions, consult the **graphify knowledge graph** at `graphify-out/` before reading raw files. Read `graphify-out/GRAPH_REPORT.md` for an overview of god nodes and community structure.

---

## Package Layout

| Package | Type | Description | Port | Key Files |
| :--- | :--- | :--- | :--- | :--- |
| `@adscrush/web` | App | Dashboard frontend (Next.js app router) | `3000` | `apps/web/` |
| `@adscrush/server` | App | API / tRPC / Elysia server | `4000` | `apps/server/` |
| `@adscrush/tracking` | App | Click, pixel, and conversion tracking | `3002` | `apps/tracking/` |
| `@adscrush/db` | Package | Drizzle ORM, schema, migrations | — | `packages/db/` |
| `@adscrush/auth` | Package | Better Auth configuration (client/server) | — | `packages/auth/` |
| `@adscrush/shared` | Package | Shared constants, types, validators, utils | — | `packages/shared/` |
| `@adscrush/ui` | Package | shadcn/ui components | — | `packages/ui/` |
| `@adscrush/email` | Package | Email templates (React Email) | — | `packages/email/` |
| `@adscrush/web-sdk` | Package | SDK for ad publishers | — | `packages/web-sdk/` |

---

## Common Commands

All commands should be run from the **repo root**.

**Setup:**
```bash
cp .env.example .env    # Define DATABASE_URL, BETTER_AUTH_SECRET, etc.
pnpm docker:up          # Start Postgres, Redis, etc. via docker-compose
```

**Development:**
```bash
# Run all apps in dev (from root)
pnpm dev

# Or run individual apps
pnpm --filter @adscrush/web dev        # localhost:3000
pnpm --filter @adscrush/server dev     # localhost:4000 (uses Bun)
pnpm --filter @adscrush/tracking dev   # localhost:3002 (uses Bun)
```

**Build:**
```bash
pnpm lint && pnpm typecheck && pnpm build
```

**Lint / Format / Typing:**
```bash
pnpm lint
pnpm format
pnpm typecheck
```

**Testing (Packages):**
```bash
# Run all tests
pnpm --filter @adscrush/shared test
pnpm --filter @adscrush/tracking test

# Run a single test (Vitest)
pnpm --filter @adscrush/shared test -- <test-name-pattern>
pnpm --filter @adscrush/tracking test -- <test-name-pattern>
```

**Database (via `@adscrush/db` package):**
```bash
pnpm db:generate    # Generate Drizzle client after schema changes
pnpm db:migrate     # Apply migrations
pnpm db:push        # Push schema changes directly (for dev)
pnpm db:studio      # Inspect data (runs Drizzle Studio in browser)
pnpm db:seed        # Seed the database with initial data
```

**UI Components:**
```bash
# Add shadcn/ui components
pnpm dlx shadcn@latest add <component> -c apps/web
```

---

## High-Level Architecture

### Data Flow

`Browser` (`@adscrush/web`) -> `@adscrush/server` (tRPC via Elysia) -> `@adscrush/db` (Drizzle/Postgres).

- **Dashboard**: Next.js app router app at `apps/web/app/(app)/`. Uses tRPC client via `@trpc/react-query` and Zustand for local state.
- **API**: Elysia-based tRPC router at `apps/server/src/routers/_app.ts`. Business logic lives in `apps/server/src/modules/`.
- **Auth**: Centralized in `packages/auth/src/`. Exports to web (`client.ts`) and server (`server.ts`). Uses Better Auth with organization, two-factor, and custom RBAC.
- **Tracking**: Standalone Elysia app (`apps/tracking/`) for click/conversion pixels. Reads and writes directly to the database and uses ioredis and bullmq for pub/sub data ingestion.
- **Worker**: Processes background jobs from queues defined in the tracking system.

### Key Architectural Conventions

- **Database Schema**: The single source of truth is `packages/db/src/schema/index.ts`. All apps and packages must import from `@adscrush/db` (do not reach into internal files).
- **tRPC**: Procedures are defined in `apps/server/src/routers/` and consumed via the (generated) Elysia-based tRPC router. The frontend should use tRPC's hooks; server actions are largely avoided.
- **Validation**: Use Zod for all runtime validation. Shared validation schemas live in `packages/shared/src/validators/`.
- **Data Tables**: Tabular views use TanStack React Table v8.
- **Forms**: Use React Hook Form with Zod resolvers for form handling.
- **Type Safety**: Prefer `tsc --noEmit` and `turbo typecheck` for catching type errors before build time.

### Testing Strategy

- **Web tests** (`apps/web`): Vitest with `environment: "node"`. Server-only and server-side modules are mocked in `vitest.config.ts` to keep client tests fast.
- **Shared tests** (`packages/shared`): Vitest with `environment: "node"`.
- **Tracking tests** (`apps/tracking`): Vitest with `environment: "node"`.
- To run a single test, use: `pnpm --filter <package> test -- <pattern>`.

---

## Technology Stack Summary

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS, shadcn/ui
- **Backend**: Elysia, tRPC 11, SuperJSON
- **Auth**: Better Auth 1.5+ (organizations, 2FA, RBAC)
- **Database**: PostgreSQL, Drizzle ORM, Drizzle Kit
- **Background**: BullMQ, ioredis
- **Geo/Targeting**: MaxMind GeoIP2
- **Build/Dev**: Bun (for server/tracking), pnpm, Turbo
- **Testing**: Vitest (all packages and apps)