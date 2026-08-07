export const ROLES = {
  USER: "user",
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  EMPLOYEE: "employee",
  ADVERTISER: "advertiser",
  MEDIA_BUYER: "media_buyer",
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const ALL_ROLES = Object.values(ROLES)
export const ADMIN_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN] as const
export const INTERNAL_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.EMPLOYEE] as const
export const EXTERNAL_ROLES = [ROLES.ADVERTISER, ROLES.MEDIA_BUYER, ROLES.USER] as const
