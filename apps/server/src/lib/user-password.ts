import type { Auth } from "@adscrush/auth"
import { and, eq } from "@adscrush/db/drizzle"
import { accounts } from "@adscrush/db/schema"
import { TRPCError } from "@trpc/server"
import { db } from "~/lib/db"

/**
 * Set a new password for any user.
 *
 * Better Auth's admin `setUserPassword` endpoint only updates an EXISTING
 * `credential` account (the `password` column on the `account` table). Users
 * created or imported without a password — e.g. external media buyers or
 * employees provisioned without credentials — have no such row, so the update
 * matches zero rows and the password is silently never set.
 *
 * This mirrors what Better Auth's own core `setPassword` endpoint does for the
 * self-service case: hash the new password and `linkAccount` when no
 * `credential` account is present.
 *
 * The caller must already have verified admin permissions (via
 * `auth.api.userHasPermission({ permissions: { user: ["set-password"] } })`).
 */
export async function setUserPassword(
  auth: Auth,
  headers: Headers,
  userId: string,
  newPassword: string
): Promise<void> {
  const ctx = await auth.$context

  // Mirror the length checks Better Auth applies on its own password
  // endpoints so both branches behave identically (the zod input schema
  // already covers the minimum; this also enforces the maximum).
  const { minPasswordLength, maxPasswordLength } = ctx.password.config
  if (newPassword.length < minPasswordLength) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Password must be at least ${minPasswordLength} characters`,
    })
  }
  if (newPassword.length > maxPasswordLength) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Password must be at most ${maxPasswordLength} characters`,
    })
  }

  const credentialAccount = await db.query.accounts.findFirst({
    where: and(eq(accounts.userId, userId), eq(accounts.providerId, "credential")),
    columns: { id: true },
  })

  // Existing credential account -> use the official admin endpoint (hashes + updates).
  if (credentialAccount) {
    await auth.api.setUserPassword({
      body: { userId, newPassword },
      headers,
    })
    return
  }

  // No credential account -> create one (same shape Better Auth's createUser uses).
  const hashedPassword = await ctx.password.hash(newPassword)
  await ctx.internalAdapter.linkAccount({
    userId,
    providerId: "credential",
    accountId: userId,
    password: hashedPassword,
  })
}
