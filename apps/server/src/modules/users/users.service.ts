import { eq } from "@adscrush/db/drizzle"
import { users } from "@adscrush/db/schema"
import { ROLES } from "@adscrush/shared/constants/roles"
import { canManageRole } from "@adscrush/shared/utils/roles"
import { TRPCError } from "@trpc/server"
import type { Database } from "@adscrush/db"
import * as repository from "./users.repository"
import type { UpdateRoleInput } from "./users.types"

export async function listUsers(db: Database, input: Parameters<typeof repository.listUsers>[1]) {
  return repository.listUsers(db, input)
}

export async function getUserById(db: Database, id: string) {
  const user = await repository.getUserById(db, id)
  if (!user) {
    throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
  }
  return user
}

export async function revokeSession(db: Database, sessionId: string) {
  const deleted = await repository.revokeSession(db, sessionId)
  if (!deleted) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" })
  }
  return { success: true }
}

export async function updateUserRole(
  db: Database,
  input: UpdateRoleInput,
  currentUser: { id: string; role: string }
) {
  const { userId, role: targetRole } = input

  // Only super_admin can change user roles
  if (currentUser.role !== ROLES.SUPER_ADMIN) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only super admins can change user roles",
    })
  }

  // Hierarchical role check
  if (!canManageRole(currentUser.role, targetRole)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `You don't have permission to assign the ${targetRole} role`,
    })
  }

  // Prevent changing your own role
  if (userId === currentUser.id) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You cannot change your own role",
    })
  }

  const targetUser = await repository.getTargetUser(db, userId)
  if (!targetUser) {
    throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
  }

  await db.transaction(async (tx) => {
    // Update the user's role
    await tx.update(users).set({ role: targetRole }).where(eq(users.id, userId))

    // Auto-create entity record if switching to a role that requires one
    if (targetRole === ROLES.EMPLOYEE) {
      const existing = await repository.findExistingEmployee(tx, userId)
      if (!existing) {
        await repository.createEmployee(tx, userId)
      }
    } else if (targetRole === ROLES.ADVERTISER) {
      if (!targetUser.email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User must have an email address to become an advertiser",
        })
      }
      const existing = await repository.findExistingAdvertiser(tx, userId)
      if (!existing) {
        try {
          await repository.createAdvertiser(tx, userId, targetUser.name || "", targetUser.email)
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : ""
          if (message.includes("advertisers_email")) {
            throw new TRPCError({
              code: "CONFLICT",
              message: `Email "${targetUser.email}" is already in use by another advertiser. Update the user's email first or choose a different email.`,
            })
          }
          throw error
        }
      }
    } else if (targetRole === ROLES.MEDIA_BUYER) {
      if (!targetUser.email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User must have an email address to become a media buyer",
        })
      }
      const existing = await repository.findExistingMediaBuyer(tx, userId)
      if (!existing) {
        try {
          await repository.createMediaBuyer(tx, userId, targetUser.name || "", targetUser.email)
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : ""
          if (message.includes("media_buyers_email")) {
            throw new TRPCError({
              code: "CONFLICT",
              message: `Email "${targetUser.email}" is already in use by another media buyer. Update the user's email first or choose a different email.`,
            })
          }
          throw error
        }
      }
    }
  })

  return { success: true }
}
