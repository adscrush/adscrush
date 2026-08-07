import { type Role, ROLES } from "../constants/roles"

export const ROLE_HIERARCHY: Record<Role, number> = {
  [ROLES.SUPER_ADMIN]: 100,
  [ROLES.ADMIN]: 80,
  [ROLES.EMPLOYEE]: 60,
  [ROLES.ADVERTISER]: 40,
  [ROLES.MEDIA_BUYER]: 40,
  [ROLES.USER]: 20,
}

/**
 * Checks if an actor with a given role can manage a target with another role.
 * A role can manage itself and any role below it in the hierarchy.
 */
export function canManageRole(actorRole: Role | string, targetRole: Role | string): boolean {
  const actorWeight = ROLE_HIERARCHY[actorRole as Role] || 0
  const targetWeight = ROLE_HIERARCHY[targetRole as Role] || 0
  return actorWeight >= targetWeight
}

/**
 * Returns a list of roles that an actor with the given role can manage/assign.
 */
export function getManageableRoles(actorRole: Role | string): Role[] {
  const actorWeight = ROLE_HIERARCHY[actorRole as Role] || 0
  return (Object.entries(ROLE_HIERARCHY) as [Role, number][])
    .filter(([, weight]) => actorWeight >= weight)
    .map(([role]) => role)
}

/**
 * Checks if a role is at or above the minimum required role.
 */
export function isAtLeastRole(currentRole: Role | string, minRole: Role): boolean {
  const currentWeight = ROLE_HIERARCHY[currentRole as Role] || 0
  const minWeight = ROLE_HIERARCHY[minRole] || 0
  return currentWeight >= minWeight
}
