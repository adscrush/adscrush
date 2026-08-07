# AGENTS.md

Compact operational guidance for OpenCode sessions in this monorepo.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, invoke the `skill` tool with `skill: "graphify"` before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## Prerequisites

```bash
# Start required services BEFORE running any app
pnpm docker:up

# Copy and configure environment
cp .env.example .env
# Edit .env with valid values (DATABASE_URL, BETTER_AUTH_SECRET, etc.)
```

## Dev Commands

```bash
# All services (Turbo filters by package name)
pnpm --filter @adscrush/web dev        # Dashboard: http://localhost:3000
pnpm --filter @adscrush/server dev     # API: http://localhost:4000
pnpm --filter @adscrush/tracking dev  # Tracking: http://localhost:3002
```

## Verified Port Assignments

- Web (Next.js): 3000
- API (Better Auth, tRPC, Elysia): 4000 (default, overridden by PORT env)
- Tracking (Elysia): 3002 (TRACKING_PORT env)

## Build Verification Order

```bash
pnpm lint && pnpm typecheck && pnpm build
```

## Database Changes

```bash
# After modifying packages/db/src/schema.ts
pnpm db:generate  # Generate Drizzle client
pnpm db:migrate   # Apply migrations
pnpm db:studio    # Inspect data (runs in browser)
```

## UI Component Addition

```bash
pnpm dlx shadcn@latest add <component> -c apps/web
```

Components land in `packages/ui/src/components`, used via `@adscrush/ui/components/<name>`.

## GSD Workflow

This repo uses GSD methodology with `.planning/`, `.agent/`, and milestone phases. See:

- `project-plan.md` - Active milestone and roadmap
- `./.agent/` - Active phase context
- `./.planning/` - Phase plans and artifacts

## Key Files

- `packages/db/src/schema.ts` - Database schema
- `apps/api/src/routes/` - API route modules
- `apps/web/app/(app)/` - Dashboard routes (Next.js app router)
- `apps/tracking/src/routes/` - Click/pixel/conversion tracking

## Style

- ESLint + Prettier enforced via Turbo
- `"use client"` required for React client components
- Zod for validation, React Hook Form for forms
- TanStack React Table (v8) for data tables
