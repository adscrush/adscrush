import { and, asc, desc, eq, ilike, inArray, isNotNull, sql } from "@adscrush/db/drizzle"
import { filterColumns, getColumn } from "@adscrush/db/lib/filter-columns"
import {
  adAccounts,
  adAccountSpend,
  mediaBuyers,
  users,
} from "@adscrush/db/schema"
import type { Database } from "@adscrush/db"
import type { ListAdAccountsInput, AdAccountOutput } from "./ad-accounts.types"

// ─── Select Shape ───────────────────────────────────────────────────────────

const adAccountSelectShape = {
  id: adAccounts.id,
  name: adAccounts.name,
  sourcePlatform: adAccounts.sourcePlatform,
  accountId: adAccounts.accountId,
  mediaBuyerId: adAccounts.mediaBuyerId,
  mediaBuyer: {
    id: mediaBuyers.id,
    name: mediaBuyers.name,
    image: users.image,
  },
  status: adAccounts.status,
  createdAt: adAccounts.createdAt,
  updatedAt: adAccounts.updatedAt,
}

// ─── Transform Helpers ──────────────────────────────────────────────────────

function transformMediaBuyer(mb: { id: string | null; name: string | null; image: string | null } | null): AdAccountOutput["mediaBuyer"] {
  return mb && typeof mb.id === "string"
    ? { id: mb.id, name: mb.name ?? "", image: mb.image }
    : null
}

function transformItem(item: { id: string; name: string; sourcePlatform: string; accountId: string; mediaBuyerId: string | null; mediaBuyer: { id: string | null; name: string | null; image: string | null } | null; status: "active" | "paused" | "disconnected" | "risk_control" | "disabled" | "not_in_use"; createdAt: Date; updatedAt: Date }): AdAccountOutput {
  return {
    ...item,
    mediaBuyer: transformMediaBuyer(item.mediaBuyer),
  }
}

// ─── List Query ─────────────────────────────────────────────────────────────

export async function findAdAccountsPaginated(
  db: Database,
  input: ListAdAccountsInput
) {
  const { page, perPage, sort, filters, joinOperator, search, status, requireMediaBuyer } = input
  const offset = (page - 1) * perPage

  // Build advanced filters
  const advancedWhere = filterColumns({
    table: adAccounts,
    filters: filters,
    joinOperator,
    database: "postgres",
  })

  // Build simple search/filter conditions
  const simpleWhere =
    search || (status && status.length > 0)
      ? and(
          search ? ilike(adAccounts.name, `%${search}%`) : undefined,
          status && status.length > 0 ? inArray(adAccounts.status, status) : undefined
        )
      : undefined

  // Combine where conditions
  const where = and(
    filters.length > 0 ? advancedWhere : simpleWhere,
    requireMediaBuyer ? isNotNull(adAccounts.mediaBuyerId) : undefined
  )

  // Build order by
  const orderBy =
    sort.length > 0
      ? sort.map((item) =>
          item.desc
            ? desc(getColumn(adAccounts, item.id))
            : asc(getColumn(adAccounts, item.id))
        )
      : [desc(adAccounts.createdAt)]

  const [items, countResult] = await Promise.all([
    db
      .select(adAccountSelectShape)
      .from(adAccounts)
      .leftJoin(mediaBuyers, eq(adAccounts.mediaBuyerId, mediaBuyers.id))
      .leftJoin(users, eq(mediaBuyers.userId, users.id))
      .where(where)
      .limit(perPage)
      .offset(offset)
      .orderBy(...orderBy),
    db
      .select({ count: sql<number>`count(*)` })
      .from(adAccounts)
      .where(where),
  ])

  const total = Number(countResult[0]?.count ?? 0)

  return {
    items: items.map(transformItem),
    pageCount: Math.ceil(total / perPage),
    total,
  }
}

// ─── By ID Query ────────────────────────────────────────────────────────────

export async function findAdAccountById(
  db: Database,
  id: string
) {
  const [result] = await db
    .select(adAccountSelectShape)
    .from(adAccounts)
    .leftJoin(mediaBuyers, eq(adAccounts.mediaBuyerId, mediaBuyers.id))
    .leftJoin(users, eq(mediaBuyers.userId, users.id))
    .where(eq(adAccounts.id, id))
    .limit(1)

  if (!result) return null

  return transformItem(result)
}

// ─── Create ─────────────────────────────────────────────────────────────────

export async function createAdAccount(
  db: Database,
  data: typeof adAccounts.$inferInsert
) {
  const [account] = await db.insert(adAccounts).values(data).returning()
  return account ?? null
}

// ─── Update ─────────────────────────────────────────────────────────────────

export async function updateAdAccount(
  db: Database,
  id: string,
  data: Partial<typeof adAccounts.$inferInsert>
) {
  const [updated] = await db
    .update(adAccounts)
    .set(data)
    .where(eq(adAccounts.id, id))
    .returning()

  return updated ?? null
}

// ─── Delete ─────────────────────────────────────────────────────────────────

export async function deleteAdAccount(
  db: Database,
  id: string
) {
  const [deleted] = await db.delete(adAccounts).where(eq(adAccounts.id, id)).returning()
  return deleted ?? null
}

// ─── Spend Queries ──────────────────────────────────────────────────────────

export async function findAdAccountSpend(
  db: Database,
  id: string,
  dateFrom?: string,
  dateTo?: string
) {
  const conditions = and(
    eq(adAccountSpend.adAccountId, id),
    dateFrom ? sql`date >= ${dateFrom}` : undefined,
    dateTo ? sql`date <= ${dateTo}` : undefined
  )

  return db
    .select({
      date: adAccountSpend.date,
      spend: adAccountSpend.spend,
    })
    .from(adAccountSpend)
    .where(conditions)
    .orderBy(asc(adAccountSpend.date))
}

// ─── Bulk Operations ────────────────────────────────────────────────────────

export async function bulkUpdateStatus(
  db: Database,
  ids: string[],
  status: string
) {
  await db.update(adAccounts).set({ status: status as typeof adAccounts.$inferInsert.status }).where(inArray(adAccounts.id, ids))
  return { success: true }
}

export async function bulkUpdateMediaBuyer(
  db: Database,
  ids: string[],
  mediaBuyerId: string | null
) {
  await db.update(adAccounts).set({ mediaBuyerId }).where(inArray(adAccounts.id, ids))
  return { success: true }
}

export async function bulkDelete(
  db: Database,
  ids: string[]
) {
  await db.delete(adAccounts).where(inArray(adAccounts.id, ids))
  return { success: true }
}

// ─── Bulk Import ────────────────────────────────────────────────────────────

export async function bulkImport(
  db: Database,
  accounts: Array<typeof adAccounts.$inferInsert>
) {
  let imported = 0
  let skipped = 0
  let errors = 0

  const seen = new Set<string>()

  for (const account of accounts) {
    const compositeKey = `${account.sourcePlatform}::${account.accountId}`

    if (seen.has(compositeKey)) {
      skipped++
      continue
    }
    seen.add(compositeKey)

    const existing = await db
      .select({ id: adAccounts.id })
      .from(adAccounts)
      .where(
        and(
          eq(adAccounts.sourcePlatform, account.sourcePlatform),
          eq(adAccounts.accountId, account.accountId)
        )
      )
      .limit(1)

    if (existing.length > 0) {
      skipped++
      continue
    }

    try {
      await db.insert(adAccounts).values(account)
      imported++
    } catch {
      errors++
    }
  }

  return { imported, skipped, errors }
}
