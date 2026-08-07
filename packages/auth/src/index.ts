export { createAuth, type Auth, type AuthConfig } from "./server"
export { createAuthClient } from "./client"
export type { BetterAuthOptions, User, Session, Account } from "better-auth"

export function isAdmin(user: { role?: string }): boolean {
  return user.role === "admin"
}

export function isEmployee(user: { role?: string }): boolean {
  return user.role === "employee" || user.role === "admin"
}
