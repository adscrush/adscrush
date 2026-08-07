import "server-only"
import { headers } from "next/headers"
import { auth } from "./server"
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

/**
 * Server-side permission check for Next.js page components.
 *
 * Returns `true` if the current user holds the required permission. Pass an
 * array for an any-of check (e.g. `["campaigns.edit", "campaigns.create"]`)
 * so multiple related permissions resolve the user's permission set once.
 * - admin / super_admin: always true (bypass)
 * - media buyer: checks stored per-buyer permissions, falls back to defaults
 * - employee: checks the permissions column from the DB
 * - unauthenticated: false
 *
 * Usage in a server page:
 *   const allowed = await checkPagePermission("offer.view")
 *   if (!allowed) return <PermissionDenied />
 */
export async function checkPagePermission(permission: Permission | Permission[]): Promise<boolean> {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) return false

  // Admin bypass — covers admin (80) and super_admin (100)
  if (isAtLeastRole(session.user.role, ROLES.ADMIN)) return true

  const required = Array.isArray(permission) ? permission : [permission]

  // Media buyer — check stored per-buyer permissions, fall back to defaults
  if (session.user.role === ROLES.MEDIA_BUYER) {
    const buyer = await db.query.mediaBuyers.findFirst({
      where: eq(mediaBuyers.userId, session.user.id),
      columns: { permissions: true },
    })

    const rawPermissions = (buyer?.permissions ?? []) as string[]
    const effectivePermissions = rawPermissions.length > 0 ? rawPermissions : [...MEDIA_BUYER_PERMISSIONS]

    return required.some((p) => effectivePermissions.includes(p))
  }

  // Load employee permissions directly from DB (no cache needed for SSR — one request per page load)
  const employee = await db.query.employees.findFirst({
    where: eq(employees.userId, session.user.id),
    columns: { permissions: true },
  })

  if (!employee) return false

  const permissionSet = filterValidPermissions((employee.permissions ?? []) as string[])
  return required.some((p) => permissionSet.includes(p))
}
