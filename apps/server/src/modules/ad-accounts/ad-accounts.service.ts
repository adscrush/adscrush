import { type adAccounts } from "@adscrush/db/schema"
import type { Database } from "@adscrush/db"
import { throwNotFound, throwInternalError } from "~/lib/helpers/errors"
import type { ListAdAccountsInput } from "./ad-accounts.types"
import * as repository from "./ad-accounts.repository"

// ─── List Ad Accounts ───────────────────────────────────────────────────────

export async function listAdAccounts(
  db: Database,
  input: ListAdAccountsInput
) {
  return repository.findAdAccountsPaginated(db, input)
}

// ─── Get Ad Account By ID ──────────────────────────────────────────────────

export async function getAdAccountById(
  db: Database,
  id: string
) {
  const result = await repository.findAdAccountById(db, id)

  if (!result) {
    throwNotFound("Ad account")
  }

  return result
}

// ─── Create Ad Account ─────────────────────────────────────────────────────

export async function createAdAccount(
  db: Database,
  data: typeof adAccounts.$inferInsert
) {
  const account = await repository.createAdAccount(db, data)

  if (!account) {
    throwInternalError("Failed to create ad account")
  }

  return account
}

// ─── Update Ad Account ─────────────────────────────────────────────────────

export async function updateAdAccount(
  db: Database,
  id: string,
  data: Partial<typeof adAccounts.$inferInsert>
) {
  const updated = await repository.updateAdAccount(db, id, data)

  if (!updated) {
    throwNotFound("Ad account")
  }

  return updated
}

// ─── Delete Ad Account ─────────────────────────────────────────────────────

export async function deleteAdAccount(
  db: Database,
  id: string
) {
  const deleted = await repository.deleteAdAccount(db, id)

  if (!deleted) {
    throwNotFound("Ad account")
  }

  return { success: true }
}

// ─── Get Spend ─────────────────────────────────────────────────────────────

export async function getAdAccountSpend(
  db: Database,
  id: string,
  dateFrom?: string,
  dateTo?: string
) {
  return repository.findAdAccountSpend(db, id, dateFrom, dateTo)
}

// ─── Bulk Import ───────────────────────────────────────────────────────────

export async function bulkImport(
  db: Database,
  accounts: Array<typeof adAccounts.$inferInsert>
) {
  return repository.bulkImport(db, accounts)
}

// ─── Bulk Operations ───────────────────────────────────────────────────────

export async function bulkUpdateStatus(
  db: Database,
  ids: string[],
  status: string
) {
  return repository.bulkUpdateStatus(db, ids, status)
}

export async function bulkUpdateMediaBuyer(
  db: Database,
  ids: string[],
  mediaBuyerId: string | null
) {
  return repository.bulkUpdateMediaBuyer(db, ids, mediaBuyerId)
}

export async function bulkDelete(
  db: Database,
  ids: string[]
) {
  return repository.bulkDelete(db, ids)
}
