export type Role =
  | "super_admin"
  | "admin"
  | "employee"
  | "advertiser"
  | "media_buyer"

export interface AuthUser {
  id: string
  name: string
  email: string
  role: Role
  /**
   * The user's media-buyer profile id, or null. Populated by customSession.
   * "Is a media buyer" is the existence of this profile — not `role`, so it
   * also covers in-house employees who run traffic (employee + buyer hats).
   */
  mediaBuyerId?: string | null
  emailVerified: boolean
  image?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface AuthSession {
  id: string
  userId: string
  expiresAt: Date
}

export interface SessionContext {
  user: AuthUser
  session: AuthSession
}

// Helper to check role
export function isAdmin(user: AuthUser): boolean {
  return user.role === "super_admin" || user.role === "admin"
}

export function isEmployee(user: AuthUser): boolean {
  return user.role === "employee"
}

export function isInternal(user: AuthUser): boolean {
  return isAdmin(user) || isEmployee(user)
}

/**
 * Whether the user holds the media-buyer hat. Capability-based: true for both
 * external partners and in-house employees who also run traffic. Prefer this
 * over `user.role === "media_buyer"`, which misses internal buyers.
 */
export function isMediaBuyer(user: AuthUser): boolean {
  return Boolean(user.mediaBuyerId)
}
