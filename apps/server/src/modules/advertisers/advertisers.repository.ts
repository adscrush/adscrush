import { and, asc, desc, eq, ilike, inArray, or, sql } from "@adscrush/db/drizzle"
import { filterColumns, getColumn } from "@adscrush/db/lib/filter-columns"
import { advertisers, products, employees, users, type Advertiser } from "@adscrush/db/schema"
import type { Database } from "@adscrush/db"
import type { ListAdvertisersInput } from "./advertisers.types"

// ─── Advertiser Queries ──────────────────────────────────────────────────────

export async function findAdvertisers(
  db: Database,
  input: ListAdvertisersInput,
  scope: { isAllAdvertisers: boolean; advertiserIds: string[] }
) {
  const { page, perPage, sort, filters, joinOperator, search, status } = input
  const offset = (page - 1) * perPage

  const tableWithJoinedColumns = {
    ...advertisers,
    accountManagerName: users.name,
  }

  const advancedWhere = filterColumns({
    table: tableWithJoinedColumns,
    filters,
    joinOperator,
    database: "postgres",
  })

  const simpleWhere =
    search || (status && status.length > 0)
      ? and(
          search
            ? or(
                ilike(advertisers.name, `%${search}%`),
                ilike(advertisers.companyName, `%${search}%`),
                ilike(advertisers.email, `%${search}%`)
              )
            : undefined,
          status && status.length > 0 ? inArray(advertisers.status, status) : undefined
        )
      : undefined

  const where = and(
    filters.length > 0 ? advancedWhere : simpleWhere,
    !scope.isAllAdvertisers
      ? inArray(advertisers.id, scope.advertiserIds.length > 0 ? scope.advertiserIds : ["-1"])
      : undefined
  )

  const orderBy =
    sort.length > 0
      ? sort.map((item) =>
          item.desc
            ? desc(getColumn(tableWithJoinedColumns, item.id))
            : asc(getColumn(tableWithJoinedColumns, item.id))
        )
      : [desc(advertisers.createdAt)]

  const [items, countResult] = await Promise.all([
    db
      .select({
        id: advertisers.id,
        userId: advertisers.userId,
        name: advertisers.name,
        companyName: advertisers.companyName,
        email: advertisers.email,
        website: advertisers.website,
        country: advertisers.country,
        phoneNumber: advertisers.phoneNumber,
        billingAddress: advertisers.billingAddress,
        paymentTermsDays: advertisers.paymentTermsDays,
        internalNotes: advertisers.internalNotes,
        accountManagerId: advertisers.accountManagerId,
        status: advertisers.status,
        createdAt: advertisers.createdAt,
        updatedAt: advertisers.updatedAt,
        accountManager: {
          id: employees.id,
          name: users.name,
          email: users.email,
          image: users.image,
        },
      })
      .from(advertisers)
      .leftJoin(employees, eq(advertisers.accountManagerId, employees.id))
      .leftJoin(users, eq(employees.userId, users.id))
      .where(where)
      .limit(perPage)
      .offset(offset)
      .orderBy(...orderBy),
    db
      .select({ count: sql<number>`count(*)` })
      .from(advertisers)
      .where(where),
  ])

  const total = Number(countResult[0]?.count ?? 0)

  return {
    items: items.map((item) => {
      const am = item.accountManager
      return {
        ...item,
        accountManager:
          am && typeof am.id === "string"
            ? {
                id: am.id,
                name: am.name,
                email: am.email,
                image: am.image,
              }
            : null,
      }
    }),
    pageCount: Math.ceil(total / perPage),
    total,
  }
}

export async function findAdvertiserById(db: Database, id: string) {
  const result = await db
    .select({
      id: advertisers.id,
      userId: advertisers.userId,
      name: advertisers.name,
      companyName: advertisers.companyName,
      email: advertisers.email,
      website: advertisers.website,
      country: advertisers.country,
      phoneNumber: advertisers.phoneNumber,
      billingAddress: advertisers.billingAddress,
      paymentTermsDays: advertisers.paymentTermsDays,
      internalNotes: advertisers.internalNotes,
      accountManagerId: advertisers.accountManagerId,
      status: advertisers.status,
      createdAt: advertisers.createdAt,
      updatedAt: advertisers.updatedAt,
      accountManager: {
        id: employees.id,
        name: users.name,
        email: users.email,
        image: users.image,
      },
    })
    .from(advertisers)
    .leftJoin(employees, eq(advertisers.accountManagerId, employees.id))
    .leftJoin(users, eq(employees.userId, users.id))
    .where(eq(advertisers.id, id))
    .limit(1)

  const advertiser = result[0]
  if (!advertiser) return null

  return {
    ...advertiser,
    accountManager:
      advertiser.accountManager && typeof advertiser.accountManager.id === "string"
        ? {
            id: advertiser.accountManager.id,
            name: advertiser.accountManager.name,
            email: advertiser.accountManager.email,
            image: advertiser.accountManager.image,
          }
        : null,
  }
}

export async function searchAdvertisers(
  db: Database,
  scope: { isAllAdvertisers: boolean; advertiserIds: string[] },
  options: { q?: string; ids?: string[] }
) {
  const { q, ids } = options

  const conditions = and(
    q
      ? or(
          ilike(advertisers.name, `%${q}%`),
          ilike(advertisers.companyName, `%${q}%`),
          ilike(advertisers.email, `%${q}%`)
        )
      : undefined,
    ids && ids.length > 0 ? inArray(advertisers.id, ids) : undefined,
    !scope.isAllAdvertisers
      ? inArray(advertisers.id, scope.advertiserIds.length > 0 ? scope.advertiserIds : ["-1"])
      : undefined
  )

  return db
    .select({
      id: advertisers.id,
      name: advertisers.name,
      email: advertisers.email,
      companyName: advertisers.companyName,
      image: users.image,
    })
    .from(advertisers)
    .innerJoin(users, eq(advertisers.userId, users.id))
    .where(conditions)
    .limit(ids && ids.length > 0 ? ids.length : 20)
}

export async function getStatusCounts(
  db: Database,
  scope: { isAllAdvertisers: boolean; advertiserIds: string[] }
) {
  const where = !scope.isAllAdvertisers
    ? inArray(advertisers.id, scope.advertiserIds)
    : undefined

  const counts = await db
    .select({
      status: advertisers.status,
      count: sql<number>`count(*)`,
    })
    .from(advertisers)
    .where(where)
    .groupBy(advertisers.status)

  const result = {
    active: 0,
    inactive: 0,
    pending: 0,
  }

  counts.forEach((item) => {
    if (item.status === "active") result.active = Number(item.count)
    if (item.status === "inactive") result.inactive = Number(item.count)
    if (item.status === "pending") result.pending = Number(item.count)
  })

  return result
}

// ─── Mutation Queries ────────────────────────────────────────────────────────

export async function createAdvertiser(
  db: Database,
  data: {
    name: string
    companyName?: string
    email: string
    userId: string
    website?: string
    country?: string
    accountManagerId?: string
    status?: Advertiser["status"]
  }
) {
  const [advertiser] = await db
    .insert(advertisers)
    .values(data)
    .returning()

  return advertiser ?? null
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
  const [advertiser] = await db
    .update(advertisers)
    .set(data)
    .where(eq(advertisers.id, id))
    .returning()

  return advertiser ?? null
}

export async function updateUser(db: Database, userId: string, data: { name?: string; email?: string }) {
  await db.update(users).set(data).where(eq(users.id, userId))
}

export async function bulkUpdateStatus(db: Database, ids: string[], status: Advertiser["status"]) {
  await db.update(advertisers).set({ status }).where(inArray(advertisers.id, ids))
  return { success: true }
}

export async function bulkDeleteAdvertisers(db: Database, ids: string[]) {
  await db.delete(advertisers).where(inArray(advertisers.id, ids))
  return { success: true }
}

export async function deleteAdvertiser(db: Database, id: string) {
  const [deleted] = await db.delete(advertisers).where(eq(advertisers.id, id)).returning()
  return deleted ?? null
}

export async function findProductByAdvertiserId(db: Database, advertiserId: string) {
  const [product] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.advertiserId, advertiserId))
    .limit(1)

  return product ?? null
}
