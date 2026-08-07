import { and, asc, desc, eq, ilike, inArray, or, sql } from "@adscrush/db/drizzle"
import { filterColumns, getColumn } from "@adscrush/db/lib/filter-columns"
import { mediaBuyers, employees, users, type MediaBuyer } from "@adscrush/db/schema"
import type { Database } from "@adscrush/db"
import type { ListMediaBuyersInput } from "./media-buyers.types"
import { MEDIA_BUYER_KIND } from "@adscrush/shared/constants/status"
import { MEDIA_BUYER_PERMISSIONS } from "@adscrush/shared/constants/permissions"
import type { Permission } from "@adscrush/shared/constants/permissions"

// ─── Media Buyer Queries ─────────────────────────────────────────────────────

export async function findMediaBuyers(
  db: Database,
  input: ListMediaBuyersInput,
  scope: { isAllMediaBuyers: boolean; mediaBuyerIds: string[] }
) {
  const { page, perPage, sort, filters, joinOperator, search, status } = input
  const offset = (page - 1) * perPage

  const tableWithJoinedColumns = {
    ...mediaBuyers,
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
                ilike(mediaBuyers.name, `%${search}%`),
                ilike(mediaBuyers.email, `%${search}%`)
              )
            : undefined,
          status && status.length > 0 ? inArray(mediaBuyers.status, status) : undefined
        )
      : undefined

  const where = and(
    filters.length > 0 ? advancedWhere : simpleWhere,
    !scope.isAllMediaBuyers
      ? inArray(mediaBuyers.id, scope.mediaBuyerIds.length > 0 ? scope.mediaBuyerIds : ["-1"])
      : undefined
  )

  const orderBy =
    sort.length > 0
      ? sort.map((item) =>
          item.desc
            ? desc(getColumn(tableWithJoinedColumns, item.id))
            : asc(getColumn(tableWithJoinedColumns, item.id))
        )
      : [desc(mediaBuyers.createdAt)]

  const [items, countResult] = await Promise.all([
    db
      .select({
        id: mediaBuyers.id,
        userId: mediaBuyers.userId,
        kind: mediaBuyers.kind,
        employeeId: mediaBuyers.employeeId,
        name: mediaBuyers.name,
        email: mediaBuyers.email,
        phoneNumber: mediaBuyers.phoneNumber,
        trafficSources: mediaBuyers.trafficSources,
        paymentMethod: mediaBuyers.paymentMethod,
        paymentDetails: mediaBuyers.paymentDetails,
        accountManagerId: mediaBuyers.accountManagerId,
        status: mediaBuyers.status,
        internalNotes: mediaBuyers.internalNotes,
        createdAt: mediaBuyers.createdAt,
        updatedAt: mediaBuyers.updatedAt,
        accountManager: {
          id: employees.id,
          name: users.name,
          email: users.email,
          image: users.image,
        },
      })
      .from(mediaBuyers)
      .leftJoin(employees, eq(mediaBuyers.accountManagerId, employees.id))
      .leftJoin(users, eq(employees.userId, users.id))
      .where(where)
      .limit(perPage)
      .offset(offset)
      .orderBy(...orderBy),
    db
      .select({ count: sql<number>`count(*)` })
      .from(mediaBuyers)
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

export async function findMediaBuyerById(db: Database, id: string) {
  const result = await db
    .select({
      id: mediaBuyers.id,
      userId: mediaBuyers.userId,
      kind: mediaBuyers.kind,
      employeeId: mediaBuyers.employeeId,
      name: mediaBuyers.name,
      email: mediaBuyers.email,
      phoneNumber: mediaBuyers.phoneNumber,
      trafficSources: mediaBuyers.trafficSources,
      paymentMethod: mediaBuyers.paymentMethod,
      paymentDetails: mediaBuyers.paymentDetails,
      accountManagerId: mediaBuyers.accountManagerId,
      status: mediaBuyers.status,
      internalNotes: mediaBuyers.internalNotes,
      createdAt: mediaBuyers.createdAt,
      updatedAt: mediaBuyers.updatedAt,
      accountManager: {
        id: employees.id,
        name: users.name,
        email: users.email,
        image: users.image,
      },
    })
    .from(mediaBuyers)
    .leftJoin(employees, eq(mediaBuyers.accountManagerId, employees.id))
    .leftJoin(users, eq(employees.userId, users.id))
    .where(eq(mediaBuyers.id, id))
    .limit(1)

  const mediaBuyer = result[0]
  if (!mediaBuyer) return null

  return {
    ...mediaBuyer,
    accountManager:
      mediaBuyer.accountManager && typeof mediaBuyer.accountManager.id === "string"
        ? {
            id: mediaBuyer.accountManager.id,
            name: mediaBuyer.accountManager.name,
            email: mediaBuyer.accountManager.email,
            image: mediaBuyer.accountManager.image,
          }
        : null,
  }
}

export async function findMediaBuyerPopover(db: Database, id: string) {
  const [result] = await db
    .select({
      id: mediaBuyers.id,
      name: mediaBuyers.name,
      email: mediaBuyers.email,
      status: mediaBuyers.status,
      accountManager: {
        name: users.name,
        email: users.email,
      },
    })
    .from(mediaBuyers)
    .leftJoin(employees, eq(mediaBuyers.accountManagerId, employees.id))
    .leftJoin(users, eq(employees.userId, users.id))
    .where(eq(mediaBuyers.id, id))
    .limit(1)

  return result ?? null
}

export async function searchMediaBuyers(
  db: Database,
  scope: { isAllMediaBuyers: boolean; mediaBuyerIds: string[] },
  options: { q?: string; ids?: string[] }
) {
  const { q, ids } = options

  return db
    .select({
      id: mediaBuyers.id,
      name: mediaBuyers.name,
      email: mediaBuyers.email,
      image: users.image,
    })
    .from(mediaBuyers)
    .innerJoin(users, eq(mediaBuyers.userId, users.id))
    .where(
      and(
        q
          ? or(
              ilike(mediaBuyers.name, `%${q}%`),
              ilike(mediaBuyers.email, `%${q}%`)
            )
          : undefined,
        ids && ids.length > 0 ? inArray(mediaBuyers.id, ids) : undefined,
        !scope.isAllMediaBuyers
          ? inArray(mediaBuyers.id, scope.mediaBuyerIds.length > 0 ? scope.mediaBuyerIds : ["-1"])
          : undefined
      )
    )
    .limit(ids && ids.length > 0 ? ids.length : 20)
}

export async function resolveMediaBuyersByNames(
  db: Database,
  scope: { isAllMediaBuyers: boolean; mediaBuyerIds: string[] },
  names: string[]
) {
  const loweredNames = Array.from(
    new Set(names.map((n) => n.trim().toLowerCase()).filter(Boolean))
  )

  if (loweredNames.length === 0) return []

  return db
    .select({
      id: mediaBuyers.id,
      name: mediaBuyers.name,
    })
    .from(mediaBuyers)
    .where(
      and(
        inArray(sql`lower(${mediaBuyers.name})`, loweredNames),
        !scope.isAllMediaBuyers
          ? inArray(
              mediaBuyers.id,
              scope.mediaBuyerIds.length > 0 ? scope.mediaBuyerIds : ["-1"]
            )
          : undefined
      )
    )
}

export async function getStatusCounts(
  db: Database,
  scope: { isAllMediaBuyers: boolean; mediaBuyerIds: string[] }
) {
  const where = !scope.isAllMediaBuyers
    ? inArray(mediaBuyers.id, scope.mediaBuyerIds)
    : undefined

  const counts = await db
    .select({
      status: mediaBuyers.status,
      count: sql<number>`count(*)`,
    })
    .from(mediaBuyers)
    .where(where)
    .groupBy(mediaBuyers.status)

  const result: Record<string, number> = {}
  counts.forEach((item) => {
    result[item.status] = Number(item.count)
  })

  return result
}

export async function getPendingMediaBuyers(
  db: Database,
  scope: { isAllMediaBuyers: boolean; mediaBuyerIds: string[] },
  options: { page: number; perPage: number }
) {
  const { page, perPage } = options
  const offset = (page - 1) * perPage

  const where = and(
    eq(mediaBuyers.status, "pending"),
    !scope.isAllMediaBuyers
      ? inArray(mediaBuyers.id, scope.mediaBuyerIds.length > 0 ? scope.mediaBuyerIds : ["-1"])
      : undefined
  )

  const [items, countResult] = await Promise.all([
    db
      .select({
        id: mediaBuyers.id,
        name: mediaBuyers.name,
        email: mediaBuyers.email,
        createdAt: mediaBuyers.createdAt,
      })
      .from(mediaBuyers)
      .where(where)
      .limit(perPage)
      .offset(offset)
      .orderBy(desc(mediaBuyers.createdAt)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(mediaBuyers)
      .where(where),
  ])

  return {
    items,
    total: Number(countResult[0]?.count ?? 0),
  }
}

// ─── Mutation Queries ────────────────────────────────────────────────────────

export async function createMediaBuyer(
  db: Database,
  data: {
    name: string
    email: string
    userId: string
    phoneNumber?: string
    trafficSources?: string[]
    paymentMethod?: string
    paymentDetails?: string
    accountManagerId?: string
    status?: MediaBuyer["status"]
    internalNotes?: string
  }
) {
  const [mediaBuyer] = await db
    .insert(mediaBuyers)
    .values({
      ...data,
      kind: MEDIA_BUYER_KIND.EXTERNAL,
      permissions: [...MEDIA_BUYER_PERMISSIONS] as Permission[],
    })
    .returning()

  return mediaBuyer ?? null
}

export async function createInternalMediaBuyer(
  db: Database,
  data: {
    userId: string
    employeeId: string
    name: string
    email: string
    phoneNumber?: string
    trafficSources?: string[]
    internalNotes?: string
    status?: MediaBuyer["status"]
  }
) {
  const [mediaBuyer] = await db
    .insert(mediaBuyers)
    .values({
      ...data,
      kind: MEDIA_BUYER_KIND.INTERNAL,
      permissions: [...MEDIA_BUYER_PERMISSIONS] as Permission[],
    })
    .returning()

  return mediaBuyer ?? null
}

export async function findMediaBuyerByUserId(db: Database, userId: string) {
  const buyer = await db.query.mediaBuyers.findFirst({
    where: eq(mediaBuyers.userId, userId),
    columns: { id: true },
  })

  return buyer ?? null
}

export async function findEmployeeById(db: Database, employeeId: string) {
  const employee = await db.query.employees.findFirst({
    where: eq(employees.id, employeeId),
    columns: { id: true, userId: true },
  })

  return employee ?? null
}

export async function findUserById(db: Database, userId: string) {
  const account = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { name: true, email: true },
  })

  return account ?? null
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
  const [mediaBuyer] = await db
    .update(mediaBuyers)
    .set(data)
    .where(eq(mediaBuyers.id, id))
    .returning()

  return mediaBuyer ?? null
}

export async function updateUser(db: Database, userId: string, data: { name?: string; email?: string }) {
  await db
    .update(users)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
}

export async function bulkUpdateStatus(db: Database, ids: string[], status: MediaBuyer["status"]) {
  await db.update(mediaBuyers).set({ status }).where(inArray(mediaBuyers.id, ids))
  return { success: true }
}

export async function deleteMediaBuyer(db: Database, id: string) {
  const [deleted] = await db.delete(mediaBuyers).where(eq(mediaBuyers.id, id)).returning()
  return deleted ?? null
}

export async function bulkDeleteMediaBuyers(db: Database, ids: string[]) {
  const rows = await db
    .select({ id: mediaBuyers.id, userId: mediaBuyers.userId, kind: mediaBuyers.kind })
    .from(mediaBuyers)
    .where(inArray(mediaBuyers.id, ids))

  await db.delete(mediaBuyers).where(inArray(mediaBuyers.id, ids))

  return rows
}

export async function deleteUser(db: Database, userId: string) {
  await db.delete(users).where(eq(users.id, userId))
}

export async function bulkDeleteUsers(db: Database, userIds: string[]) {
  await db.delete(users).where(inArray(users.id, userIds))
}

// ─── Permissions Queries ─────────────────────────────────────────────────────

export async function findMediaBuyerPermissions(db: Database, mediaBuyerId: string) {
  const buyer = await db.query.mediaBuyers.findFirst({
    where: eq(mediaBuyers.id, mediaBuyerId),
    columns: { id: true, permissions: true },
  })

  return buyer ?? null
}

export async function updateMediaBuyerPermissions(
  db: Database,
  mediaBuyerId: string,
  permissions: Permission[]
) {
  const [updated] = await db
    .update(mediaBuyers)
    .set({ permissions })
    .where(eq(mediaBuyers.id, mediaBuyerId))
    .returning({ id: mediaBuyers.id })

  return updated ?? null
}
