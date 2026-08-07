"use client"

import { createAuthClient } from "@adscrush/auth/client"
import { env } from "@/env"

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_API_URL,
  basePath: "/api/v1/auth",
})

/**
 * Ensures the callback URL is absolute and points to the frontend domain.
 * This is required when the auth server and frontend are on different domains.
 */
export const getCallbackURL = (path: string) => {
  if (path.startsWith("http")) return path
  const base = env.NEXT_PUBLIC_APP_URL
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`
}

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  requestPasswordReset,
  resetPassword,
  changePassword,
  listSessions,
  revokeSession,
  revokeOtherSessions,
  revokeSessions,
} = authClient
