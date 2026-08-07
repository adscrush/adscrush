"use client"

import type { Permission } from "@adscrush/shared/constants/permissions"
import { useHasPermission } from "@/hooks/use-permission"

interface PermissionGateProps {
  permission: Permission
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Conditionally renders children based on whether the current user holds
 * the specified permission. Renders `fallback` (or nothing) when denied.
 *
 * Admin/super_admin users always see children (admin bypass).
 */
export function PermissionGate({
  permission,
  children,
  fallback = null,
}: PermissionGateProps) {
  const hasPermission = useHasPermission(permission)
  return hasPermission ? <>{children}</> : <>{fallback}</>
}
