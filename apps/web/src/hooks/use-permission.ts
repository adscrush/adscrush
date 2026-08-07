"use client"

import { useSession } from "@/lib/auth/client"
import { isAtLeastRole } from "@adscrush/shared/utils/roles"
import { ROLES } from "@adscrush/shared/constants/roles"
import type { Permission } from "@adscrush/shared/constants/permissions"
import { trpc } from "@/lib/trpc/client"

/**
 * Fetches and caches the current user's full permission set.
 * Returns an empty array for admins (they bypass the permission system)
 * and for unauthenticated users.
 *
 * Use this when you need to inspect multiple permissions at once,
 * e.g. rendering a permissions management UI.
 */
export function useMyPermissions(): Permission[] {
  const { data: session } = useSession()
  const user = session?.user
  const isAdmin = !!user && isAtLeastRole(user.role, ROLES.ADMIN)

  const { data } = trpc.employees.getMyPermissions.useQuery(undefined, {
    enabled: !!user && !isAdmin,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  return (data ?? []) as Permission[]
}

/**
 * Returns whether the current user holds a specific permission key.
 *
 * - Admin/super_admin: always true, no API call made
 * - Employee: checks against the cached permission set (fetched once, shared across all callers)
 * - Unauthenticated / loading: false
 *
 * Use this for single boolean gates, e.g. conditionally showing a button or page section.
 */
export function useHasPermission(permission: Permission): boolean {
  const { data: session } = useSession()
  const user = session?.user
  const isAdmin = !!user && isAtLeastRole(user.role, ROLES.ADMIN)

  const { data } = trpc.employees.getMyPermissions.useQuery(undefined, {
    enabled: !!user && !isAdmin,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  if (!user) return false
  if (isAdmin) return true

  return ((data ?? []) as Permission[]).includes(permission)
}
