import type { Auth } from "@adscrush/auth"
import { ROLES } from "@adscrush/shared/constants/roles"
import type { Database } from "@adscrush/db"
import type { Advertiser } from "@adscrush/db/schema"
import type { ListAdvertisersInput } from "./advertisers.types"
import * as repository from "./advertisers.repository"
import { validateAdvertiserAccess, throwNotFound, throwInternalError, throwConflict } from "~/lib/helpers"

// ─── Query Operations ────────────────────────────────────────────────────────

export async function listAdvertisers(
  db: Database,
  input: ListAdvertisersInput,
  scope: { isAllAdvertisers: boolean; advertiserIds: string[] }
) {
  return repository.findAdvertisers(db, input, scope)
}

export async function getAdvertiserById(
  db: Database,
  id: string,
  scope: { isAllAdvertisers: boolean; advertiserIds: string[] }
) {
  validateAdvertiserAccess(scope, id)

  const advertiser = await repository.findAdvertiserById(db, id)

  if (!advertiser) {
    throwNotFound("Advertiser")
  }

  return advertiser
}

export async function searchAdvertisers(
  db: Database,
  scope: { isAllAdvertisers: boolean; advertiserIds: string[] },
  options: { q?: string; ids?: string[] }
) {
  return repository.searchAdvertisers(db, scope, options)
}

export async function getStatusCounts(
  db: Database,
  scope: { isAllAdvertisers: boolean; advertiserIds: string[] }
) {
  return repository.getStatusCounts(db, scope)
}

// ─── Mutation Operations ─────────────────────────────────────────────────────

export async function createAdvertiser(
  db: Database,
  auth: Auth,
  req: Request,
  input: {
    name: string
    companyName?: string
    email: string
    password?: string
    website?: string
    country?: string
    accountManagerId?: string
    status?: Advertiser["status"]
  }
) {
  const { name, email, password, ...advertiserData } = input

  // Create user account
  const userResult = await auth.api.createUser({
    body: {
      name,
      email,
      password: password,
      role: ROLES.ADVERTISER,
    },
    headers: req.headers,
  })

  if (!userResult || !userResult.user) {
    throwInternalError("Failed to create user account for advertiser")
  }

  const advertiser = await repository.createAdvertiser(db, {
    ...advertiserData,
    name,
    email,
    userId: userResult.user.id,
  })

  if (!advertiser) {
    throwInternalError("Failed to create advertiser record")
  }

  return advertiser
}

export async function updateAdvertiser(
  db: Database,
  id: string,
  data: {
    name?: string
    companyName?: string
    email?: string
    website?: string
    country?: string
    accountManagerId?: string
    status?: Advertiser["status"]
  }
) {
  // Update advertiser
  const advertiser = await repository.updateAdvertiser(db, id, data)

  if (!advertiser) {
    throwNotFound("Advertiser")
  }

  // Sync name/email with users table if updated
  if (data.name || data.email) {
    await repository.updateUser(db, advertiser.userId, {
      ...(data.name ? { name: data.name } : {}),
      ...(data.email ? { email: data.email } : {}),
    })
  }

  return advertiser
}

export async function bulkUpdateStatus(db: Database, ids: string[], status: Advertiser["status"]) {
  return repository.bulkUpdateStatus(db, ids, status)
}

export async function deleteAdvertiser(db: Database, id: string) {
  // Check if advertiser has products
  const existingProduct = await repository.findProductByAdvertiserId(db, id)

  if (existingProduct) {
    throwConflict("Cannot delete advertiser with existing products. Remove or reassign all products first.")
  }

  const deleted = await repository.deleteAdvertiser(db, id)

  if (!deleted) {
    throwNotFound("Advertiser")
  }

  return { success: true }
}

export async function bulkDelete(db: Database, ids: string[]) {
  return repository.bulkDeleteAdvertisers(db, ids)
}
