import "server-only"
import { cache } from "react"
import { auth } from "@/lib/auth/server"
import { isAtLeastRole } from "@adscrush/shared/utils/roles"
import { ROLES } from "@adscrush/shared/constants/roles"
import {
  filterValidPermissions,
  MEDIA_BUYER_PERMISSIONS,
  type Permission,
} from "@adscrush/shared/constants/permissions"
import { db } from "@/lib/db"
import { employees, mediaBuyers } from "@adscrush/db/schema"
import { eq } from "@adscrush/db/drizzle"
import type { Role } from "@adscrush/shared/constants/roles"
import { ALL_NAV_GATE_PERMISSIONS } from "../config/sidebar-nav-config"

/**
 * A permission-keyed visibility map.
 *
 * Each key is a gate permission from the nav config. The value is `true` when
 * the current user holds that permission (or is an admin), `false` otherwise.
 *
 * The sidebar builder and NavSection use this to decide what to render.
 * Consumers call `can(permission)` rather than reading the map directly.
 */
export type SidebarVisibilityConfig = {
  readonly [K in Permission]?: boolean
} & {
  readonly role: Role
}

/**
 * Convenience accessor — returns true if the user holds the given permission,
 * or if the permission has no gate (null → always visible).
 */
export function can(
  config: SidebarVisibilityConfig,
  permission: Permission | null,
): boolean {
  if (permission === null) return true
  return config[permission] === true
}

/**
 * Pure logic layer — no I/O. Accepts role + permissions, returns config.
 * Exported separately so it can be unit-tested without DB or HTTP.
 *
 * Only gate permissions that appear in the nav config are included in the
 * output — the map stays minimal and self-documenting.
 */
export function buildSidebarVisibility(
  role: Role,
  permissions: Permission[],
): SidebarVisibilityConfig {
  const isAdmin = isAtLeastRole(role, ROLES.ADMIN)
  const permSet = new Set(permissions)

  return {
    role,
    ...Object.fromEntries(
      [...ALL_NAV_GATE_PERMISSIONS].map((gate) => [
        gate,
        isAdmin ? true : permSet.has(gate),
      ]),
    ),
  } as SidebarVisibilityConfig
}

/**
 * Fetches the current user's live permissions directly from the DB.
 *
 * Intentionally bypasses any session-level permission cache — the DB is the
 * single source of truth. This ensures that:
 *   - When an admin updates an employee's permissions, the sidebar reflects
 *     the change on the next page load without requiring a sign-out.
 *   - When an admin impersonates an employee, the sidebar shows the
 *     impersonated user's actual permissions, not the admin's.
 *
 * Wrapped with React.cache() so multiple calls within the same render pass
 * (e.g. layout + page both calling this) are deduplicated to a single DB query.
 */
export const resolveSidebarVisibility = cache(
  async (requestHeaders: Headers): Promise<SidebarVisibilityConfig> => {
    const session = await auth.api.getSession({ headers: requestHeaders })
    if (!session?.user) return buildSidebarVisibility("employee", [])

    const role = session.user.role as Role

    // Admins and super admins always see everything — no DB query needed.
    // Note: during impersonation, session.user reflects the impersonated user,
    // so an admin impersonating an employee will correctly fall through to the
    // employee permission check below.
    if (isAtLeastRole(role, ROLES.ADMIN)) {
      return buildSidebarVisibility(role, [])
    }

    // Media buyers: query DB for their actual permissions; fall back to defaults
    if (role === ROLES.MEDIA_BUYER) {
      const buyer = await db.query.mediaBuyers.findFirst({
        where: eq(mediaBuyers.userId, session.user.id),
        columns: { permissions: true },
      })

      if (buyer && buyer.permissions && buyer.permissions.length > 0) {
        const validPermissions = filterValidPermissions(
          buyer.permissions as string[],
        )
        return buildSidebarVisibility(role, validPermissions)
      }

      // Fall back to default permissions when none are explicitly set
      return buildSidebarVisibility(role, [...MEDIA_BUYER_PERMISSIONS])
    }

    // Always query the DB directly — never rely on session-cached permissions.
    // This guarantees the sidebar reflects the employee's current permissions
    // even if they were updated after the session was created.
    const employee = await db.query.employees.findFirst({
      where: eq(employees.userId, session.user.id),
      columns: { permissions: true },
    })

    if (!employee) return buildSidebarVisibility("employee", [])

    const validPermissions = filterValidPermissions(
      (employee.permissions ?? []) as string[],
    )

    return buildSidebarVisibility(role, validPermissions)
  },
)
