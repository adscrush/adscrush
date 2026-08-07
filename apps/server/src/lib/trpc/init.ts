import { initTRPC, TRPCError } from "@trpc/server"
import type { Context } from "./context"
import superjson from "superjson"
import { ROLES } from "@adscrush/shared/constants/roles"
import type { Permission } from "@adscrush/shared/constants/permissions"
import { MEDIA_BUYER_PERMISSIONS } from "@adscrush/shared/constants/permissions"
import { isAtLeastRole } from "@adscrush/shared/utils/roles"
import { permissionsCache } from "~/lib/permissions-cache"
import { getScope } from "~/lib/scope"
import { employees, mediaBuyers } from "@adscrush/db/schema"
import { eq } from "@adscrush/db/drizzle"
import { logger } from "~/lib/logger"

const t = initTRPC.context<Context>().create({
  transformer: superjson,
})

// ── Request logging middleware ────────────────────────────────────────────
const requestLogger = t.middleware(async ({ ctx, path, type, next }) => {
  const start = Date.now()
  const log = logger({ userId: ctx.user?.id, path, type })
  log.info(`→ ${type} ${path}`)

  const result = await next()

  const duration = Date.now() - start
  if (result.ok) {
    log.info(`← ${type} ${path} (${duration}ms)`)
  } else {
    log.error(`✗ ${type} ${path} (${duration}ms)`, {
      code: result.error.code,
      message: result.error.message,
    })
  }

  return result
})

export const router = t.router
export const mergeRouters = t.mergeRouters
export const publicProcedure = t.procedure.use(requestLogger)

/**
 * Reusable middleware that enforces users are logged in before running the
 * procedure.
 */
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" })
  }
  return next({
    ctx: {
      // infers the `session` and `user` as non-nullable
      session: ctx.session,
      user: ctx.user,
    },
  })
})

/**
 * Middleware that enforces users are admins or super admins
 */
const isAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" })
  }

  if (ctx.user.role !== ROLES.ADMIN && ctx.user.role !== ROLES.SUPER_ADMIN) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    })
  }

  return next({
    ctx: {
      session: ctx.session,
      user: ctx.user,
    },
  })
})

export const protectedProcedure = t.procedure.use(requestLogger).use(isAuthed)
export const adminProcedure = t.procedure.use(requestLogger).use(isAdmin)

const isMediaBuyer = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session || !ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" })
  }

  const buyer = await ctx.db.query.mediaBuyers.findFirst({
    where: eq(mediaBuyers.userId, ctx.user.id),
  })

  if (!buyer) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Media buyer profile not found" })
  }

  if (buyer.status !== "active") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Account suspended" })
  }

  return next({
    ctx: {
      session: ctx.session,
      user: ctx.user,
      mediaBuyer: buyer,
    },
  })
})

export const mediaBuyerProcedure = t.procedure.use(requestLogger).use(isMediaBuyer)

/**
 * Pure permission check function — extracted for testability.
 * Returns true if the user is an admin/super_admin OR holds the permission key.
 */
export function checkPermission(
  user: { role: string },
  permissionSet: Permission[],
  permission: Permission,
): boolean {
  if (isAtLeastRole(user.role, ROLES.ADMIN)) return true
  return permissionSet.includes(permission)
}

/**
 * Creates a tRPC procedure that requires the caller to hold a specific
 * Permission key. Admins and super_admins bypass the check entirely via
 * isAtLeastRole(role, ROLES.ADMIN).
 *
 * Usage:
 *   permissionProcedure("report.conversion_log_access")
 *     .query(async ({ ctx }) => { ... })
 */
export function permissionProcedure(permission: Permission) {
  return t.procedure.use(requestLogger).use(async ({ ctx, next }) => {
    // 1. Must be authenticated
    if (!ctx.session || !ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" })
    }

    // 2. Admin bypass — isAtLeastRole covers both admin (80) and super_admin (100)
    if (isAtLeastRole(ctx.user.role, ROLES.ADMIN)) {
      return next({ ctx: { session: ctx.session, user: ctx.user } })
    }

    // 3. Media buyer — check per-buyer permissions, fall back to defaults
    if (ctx.user.role === ROLES.MEDIA_BUYER) {
      const buyer = await ctx.db.query.mediaBuyers.findFirst({
        where: eq(mediaBuyers.userId, ctx.user.id),
        columns: { permissions: true },
      })

      // Get effective permission set: stored overrides or hardcoded defaults
      const rawPermissions = (buyer?.permissions ?? []) as string[]
      const effectivePermissions =
        rawPermissions.length > 0 ? rawPermissions : [...MEDIA_BUYER_PERMISSIONS]

      if (effectivePermissions.includes(permission)) {
        return next({ ctx: { session: ctx.session, user: ctx.user } })
      }
      throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" })
    }

    // 4. Resolve employee record for the current user
    const employee = await ctx.db.query.employees.findFirst({
      where: eq(employees.userId, ctx.user.id),
      columns: { id: true },
    })

    if (!employee) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Employee record not found",
      })
    }

    // 5. Load permission set from cache (Redis → in-memory → DB)
    const permissionSet = await permissionsCache.getPermissions(employee.id, ctx.db)

    // 6. Check membership
    if (!permissionSet.includes(permission)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Missing required permission: ${permission}`,
      })
    }

    return next({ ctx: { session: ctx.session, user: ctx.user } })
  })
}

export function scopedProcedure(permission: Permission) {
  return permissionProcedure(permission).use(async ({ ctx, next }) => {
    const scope = await getScope(ctx.db, ctx.user.id, ctx.user.role)
    return next({ ctx: { ...ctx, scope } })
  })
}
