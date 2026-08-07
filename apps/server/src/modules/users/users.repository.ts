import { and, asc, desc, eq, ilike, isNull, or, sql } from "@adscrush/db/drizzle"
import { filterColumns, getColumn } from "@adscrush/db/lib/filter-columns"
import { accounts, advertisers, employees, mediaBuyers, sessions, users } from "@adscrush/db/schema"
import type { Database } from "@adscrush/db"
import type { ListUsersInput } from "./users.types"

/**
 * Flexible DB type that works with both Database and Drizzle transactions.
 * This is needed because Drizzle's transaction type is structurally
 * compatible but nominally different from the Database type.
 */
export type FlexibleDb = Database | Parameters<Parameters<Database["transaction"]>[0]>[0]

export async function listUsers(db: FlexibleDb, input: ListUsersInput) {
  const { page, perPage, sort, filters, joinOperator, search } = input
  const offset = (page - 1) * perPage

  const advancedWhere = filterColumns({
    table: users,
    filters,
    joinOperator,
    database: "postgres",
  })

  const simpleWhere = search
    ? or(
        ilike(users.name, `%${search}%`),
        ilike(users.email, `%${search}%`)
      )
    : undefined

  const where = filters.length > 0 ? advancedWhere : simpleWhere

  const orderBy =
    sort.length > 0
      ? sort.map((item) =>
          item.desc
            ? desc(getColumn(users, item.id))
            : asc(getColumn(users, item.id))
        )
      : [desc(users.createdAt)]

  const [items, countResult] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        emailVerified: users.emailVerified,
        image: users.image,
        role: users.role,
        banned: users.banned,
        banReason: users.banReason,
        banExpires: users.banExpires,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(where)
      .limit(perPage)
      .offset(offset)
      .orderBy(...orderBy),
    db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(where),
  ])

  const total = Number(countResult[0]?.count ?? 0)

  return {
    items,
    pageCount: Math.ceil(total / perPage),
    total,
  }
}

export async function getUserById(db: FlexibleDb, id: string) {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      emailVerified: users.emailVerified,
      image: users.image,
      role: users.role,
      banned: users.banned,
      banReason: users.banReason,
      banExpires: users.banExpires,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1)

  if (!user) return null

  const [linkedAccounts, userSessions, employeeRecord, advertiserRecord, mediaBuyerRecord] =
    await Promise.all([
      db
        .select({
          id: accounts.id,
          providerId: accounts.providerId,
          accountId: accounts.accountId,
          createdAt: accounts.createdAt,
        })
        .from(accounts)
        .where(eq(accounts.userId, id)),
      db
        .select({
          id: sessions.id,
          expiresAt: sessions.expiresAt,
          createdAt: sessions.createdAt,
          ipAddress: sessions.ipAddress,
          userAgent: sessions.userAgent,
          impersonatedBy: sessions.impersonatedBy,
          role: sessions.role,
        })
        .from(sessions)
        .where(eq(sessions.userId, id))
        .orderBy(desc(sessions.createdAt)),
      db
        .select({ id: employees.id })
        .from(employees)
        .where(and(eq(employees.userId, id), isNull(employees.deletedAt)))
        .limit(1),
      db
        .select({ id: advertisers.id })
        .from(advertisers)
        .where(eq(advertisers.userId, id))
        .limit(1),
      db
        .select({ id: mediaBuyers.id })
        .from(mediaBuyers)
        .where(eq(mediaBuyers.userId, id))
        .limit(1),
    ])

  return {
    ...user,
    linkedAccounts,
    sessions: userSessions,
    hasEmployeeProfile: employeeRecord.length > 0,
    hasAdvertiserProfile: advertiserRecord.length > 0,
    hasMediaBuyerProfile: mediaBuyerRecord.length > 0,
  }
}

export async function revokeSession(db: FlexibleDb, sessionId: string) {
  const [deleted] = await db
    .delete(sessions)
    .where(eq(sessions.id, sessionId))
    .returning({ id: sessions.id })

  return deleted
}

export async function updateUserRole(db: FlexibleDb, userId: string, role: "user" | "super_admin" | "admin" | "employee" | "advertiser" | "media_buyer") {
  await db.update(users).set({ role }).where(eq(users.id, userId))
}

export async function getTargetUser(db: FlexibleDb, userId: string) {
  const [targetUser] = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  return targetUser
}

export async function findExistingEmployee(db: FlexibleDb, userId: string) {
  return db.query.employees.findFirst({
    where: eq(employees.userId, userId),
    columns: { id: true },
  })
}

export async function createEmployee(db: FlexibleDb, userId: string) {
  await db.insert(employees).values({ userId })
}

export async function findExistingAdvertiser(db: FlexibleDb, userId: string) {
  return db.query.advertisers.findFirst({
    where: eq(advertisers.userId, userId),
    columns: { id: true },
  })
}

export async function createAdvertiser(db: FlexibleDb, userId: string, name: string, email: string) {
  await db.insert(advertisers).values({
    userId,
    name: name || "Unnamed Advertiser",
    email,
  })
}

export async function findExistingMediaBuyer(db: FlexibleDb, userId: string) {
  return db.query.mediaBuyers.findFirst({
    where: eq(mediaBuyers.userId, userId),
    columns: { id: true },
  })
}

export async function createMediaBuyer(db: FlexibleDb, userId: string, name: string, email: string) {
  const { MEDIA_BUYER_KIND } = await import("@adscrush/shared/constants/status")
  const { MEDIA_BUYER_PERMISSIONS } = await import("@adscrush/shared/constants/permissions")

  await db.insert(mediaBuyers).values({
    userId,
    name: name || "Unnamed Media Buyer",
    email,
    kind: MEDIA_BUYER_KIND.EXTERNAL,
    permissions: [...MEDIA_BUYER_PERMISSIONS],
  })
}
