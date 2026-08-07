import type { Auth } from "@adscrush/auth"
import { TRPCError } from "@trpc/server"
import { ROLES } from "@adscrush/shared/constants/roles"
import {
  ALL_PERMISSION_KEYS,
  PERMISSION_PRESETS,
  MEDIA_BUYER_PERMISSIONS,
  filterValidPermissions,
  type Permission,
} from "@adscrush/shared/constants/permissions"
import type { Database } from "@adscrush/db"
import type { MediaBuyer } from "@adscrush/db/schema"
import type { ListMediaBuyersInput } from "./media-buyers.types"
import * as repository from "./media-buyers.repository"
import { setUserPassword } from "~/lib/user-password"
import { validateMediaBuyerAccess, throwNotFound, throwInternalError, throwConflict, throwBadRequest, throwForbidden } from "~/lib/helpers"

// ─── Query Operations ────────────────────────────────────────────────────────

export async function listMediaBuyers(
  db: Database,
  input: ListMediaBuyersInput,
  scope: { isAllMediaBuyers: boolean; mediaBuyerIds: string[] }
) {
  return repository.findMediaBuyers(db, input, scope)
}

export async function getMediaBuyerById(
  db: Database,
  id: string,
  scope: { isAllMediaBuyers: boolean; mediaBuyerIds: string[] }
) {
  validateMediaBuyerAccess(scope, id)

  const mediaBuyer = await repository.findMediaBuyerById(db, id)

  if (!mediaBuyer) {
    throwNotFound("Media buyer")
  }

  return mediaBuyer
}

export async function getMediaBuyerPopover(
  db: Database,
  id: string,
  scope: { isAllMediaBuyers: boolean; mediaBuyerIds: string[] }
) {
  validateMediaBuyerAccess(scope, id)

  const result = await repository.findMediaBuyerPopover(db, id)

  if (!result) {
    throwNotFound("Media buyer")
  }

  return result
}

export async function searchMediaBuyers(
  db: Database,
  scope: { isAllMediaBuyers: boolean; mediaBuyerIds: string[] },
  options: { q?: string; ids?: string[] }
) {
  return repository.searchMediaBuyers(db, scope, options)
}

export async function resolveMediaBuyersByNames(
  db: Database,
  scope: { isAllMediaBuyers: boolean; mediaBuyerIds: string[] },
  names: string[]
) {
  return repository.resolveMediaBuyersByNames(db, scope, names)
}

export async function getStatusCounts(
  db: Database,
  scope: { isAllMediaBuyers: boolean; mediaBuyerIds: string[] }
) {
  return repository.getStatusCounts(db, scope)
}

export async function getPendingMediaBuyers(
  db: Database,
  scope: { isAllMediaBuyers: boolean; mediaBuyerIds: string[] },
  options: { page: number; perPage: number }
) {
  return repository.getPendingMediaBuyers(db, scope, options)
}

// ─── Mutation Operations ─────────────────────────────────────────────────────

export async function createMediaBuyer(
  db: Database,
  auth: Auth,
  req: Request,
  input: {
    name: string
    email: string
    password?: string
    phoneNumber?: string
    trafficSources?: string[]
    paymentMethod?: string
    paymentDetails?: string
    accountManagerId?: string
    status?: MediaBuyer["status"]
    internalNotes?: string
  }
) {
  const { name, email, password, ...mediaBuyerData } = input

  const userResult = await auth.api.createUser({
    body: {
      name,
      email,
      password: password,
      role: ROLES.MEDIA_BUYER,
    },
    headers: req.headers,
  })

  if (!userResult || !userResult.user) {
    throwInternalError("Failed to create user account for media buyer")
  }

  const mediaBuyer = await repository.createMediaBuyer(db, {
    ...mediaBuyerData,
    name,
    email,
    userId: userResult.user.id,
  })

  if (!mediaBuyer) {
    throwInternalError("Failed to create media buyer record")
  }

  return mediaBuyer
}

export async function linkEmployee(
  db: Database,
  input: {
    employeeId: string
    companyName?: string
    phoneNumber?: string
    trafficSources?: string[]
    internalNotes?: string
    status?: MediaBuyer["status"]
  }
) {
  const { employeeId, ...buyerData } = input

  const employee = await repository.findEmployeeById(db, employeeId)
  if (!employee) {
    throwNotFound("Employee")
  }

  const existing = await repository.findMediaBuyerByUserId(db, employee.userId)
  if (existing) {
    throwConflict("This user already has a media buyer profile")
  }

  const account = await repository.findUserById(db, employee.userId)
  if (!account) {
    throwInternalError("User account for employee not found")
  }

  const mediaBuyer = await repository.createInternalMediaBuyer(db, {
    ...buyerData,
    userId: employee.userId,
    employeeId: employee.id,
    name: account.name,
    email: account.email,
  })

  if (!mediaBuyer) {
    throwInternalError("Failed to create media buyer record")
  }

  return mediaBuyer
}

export async function updateMediaBuyer(
  db: Database,
  id: string,
  data: {
    name?: string
    email?: string
    phoneNumber?: string
    trafficSources?: string[]
    paymentMethod?: string
    paymentDetails?: string
    accountManagerId?: string
    status?: MediaBuyer["status"]
    internalNotes?: string
  }
) {
  // Update media buyer
  const mediaBuyer = await repository.updateMediaBuyer(db, id, data)

  if (!mediaBuyer) {
    throwNotFound("Media buyer")
  }

  // Update user if name or email changed
  if (data.name || data.email) {
    await repository.updateUser(db, mediaBuyer.userId, {
      ...(data.name ? { name: data.name } : {}),
      ...(data.email ? { email: data.email } : {}),
    })
  }

  return mediaBuyer
}

export async function bulkUpdateStatus(db: Database, ids: string[], status: MediaBuyer["status"]) {
  return repository.bulkUpdateStatus(db, ids, status)
}

export async function deleteMediaBuyer(db: Database, id: string) {
  const deleted = await repository.deleteMediaBuyer(db, id)

  if (!deleted) {
    throwNotFound("Media buyer")
  }

  // Delete user account for external media buyers (we created them)
  if (deleted.kind === "external") {
    await repository.deleteUser(db, deleted.userId)
  }

  return { success: true }
}

export async function bulkDelete(db: Database, ids: string[]) {
  const rows = await repository.bulkDeleteMediaBuyers(db, ids)

  // Delete user accounts for external media buyers (we created them)
  const externalUserIds = rows
    .filter((r) => r.kind === "external")
    .map((r) => r.userId)

  if (externalUserIds.length > 0) {
    await repository.bulkDeleteUsers(db, externalUserIds)
  }

  return { success: true }
}

// ─── Permissions Operations ──────────────────────────────────────────────────

export async function getPermissions(db: Database, mediaBuyerId: string) {
  const buyer = await repository.findMediaBuyerPermissions(db, mediaBuyerId)

  if (!buyer) {
    throwNotFound("Media buyer")
  }

  const raw = (buyer.permissions ?? []) as string[]
  if (raw.length === 0) return [...MEDIA_BUYER_PERMISSIONS]

  return filterValidPermissions(raw)
}

export async function updatePermissions(
  db: Database,
  mediaBuyerId: string,
  rawKeys: string[]
) {
  // Validate all keys exist in registry
  const invalidKeys = rawKeys.filter(
    (k) => !(ALL_PERMISSION_KEYS as string[]).includes(k)
  )
  if (invalidKeys.length > 0) {
    throwBadRequest(`Invalid permission keys: ${invalidKeys.join(", ")}`)
  }

  // Media buyers cannot have employee-related permissions
  const filtered = rawKeys.filter((k) => !k.startsWith("employees."))

  const updated = await repository.updateMediaBuyerPermissions(
    db,
    mediaBuyerId,
    filtered as Permission[]
  )

  if (!updated) {
    throwNotFound("Media buyer")
  }

  return { success: true }
}

export async function applyPreset(
  db: Database,
  mediaBuyerId: string,
  preset: "full" | "manager" | "readonly"
) {
  const presetKeys = (PERMISSION_PRESETS[preset] as Permission[])
    // Media buyers cannot have employee-related permissions
    .filter((k) => !k.startsWith("employees."))

  const updated = await repository.updateMediaBuyerPermissions(
    db,
    mediaBuyerId,
    presetKeys
  )

  if (!updated) {
    throwNotFound("Media buyer")
  }

  return { success: true }
}

// ─── Password Operations ─────────────────────────────────────────────────────

export async function changePassword(
  db: Database,
  auth: Auth,
  req: Request,
  mediaBuyerId: string,
  password: string
) {
  const mediaBuyer = await db.query.mediaBuyers.findFirst({
    where: (mediaBuyers, { eq }) => eq(mediaBuyers.id, mediaBuyerId),
    columns: { id: true, userId: true },
  })

  if (!mediaBuyer) {
    throwNotFound("Media buyer")
  }

  try {
    const hasPermission = await auth.api.userHasPermission({
      body: {
        permissions: { user: ["set-password"] },
      },
      headers: req.headers,
    })

    if (!hasPermission.success) {
      throwForbidden("You don't have permission to change password")
    }

    await setUserPassword(auth, req.headers, mediaBuyer.userId, password)
  } catch (error) {
    if (error instanceof TRPCError) throw error
    throwInternalError("Failed to change password")
  }

  return { success: true }
}
