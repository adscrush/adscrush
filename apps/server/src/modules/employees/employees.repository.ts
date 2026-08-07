import { and, asc, desc, eq, ilike, inArray, or, sql } from "@adscrush/db/drizzle"
import { type ALL_ROLES } from "@adscrush/shared/constants/roles"
import { filterColumns, getColumn } from "@adscrush/db/lib/filter-columns"
import {
  advertisers,
  departments,
  employeeAdvertiserAccess,
  employeeMediaBuyerAccess,
  employees,
  mediaBuyers,
  users,
  type Employee,
} from "@adscrush/db/schema"
import type { Database } from "@adscrush/db"
import type { ListEmployeesInput } from "./employees.types"
import type { Permission } from "@adscrush/shared/constants/permissions"

// ─── Employee Queries ────────────────────────────────────────────────────────

export async function findEmployees(
  db: Database,
  input: ListEmployeesInput
) {
  const { page, perPage, sort, filters, joinOperator, search, status } = input
  const offset = (page - 1) * perPage

  const tableWithJoinedColumns = {
    ...employees,
    name: users.name,
    email: users.email,
    role: users.role,
    departmentName: departments.name,
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
          search ? or(ilike(users.name, `%${search}%`), ilike(users.email, `%${search}%`)) : undefined,
          status && status.length > 0 ? or(...status.map((s) => eq(employees.status, s))) : undefined
        )
      : undefined

  const where = filters.length > 0 ? advancedWhere : simpleWhere

  const orderBy =
    sort.length > 0
      ? sort.map((item) =>
          item.desc
            ? desc(getColumn(tableWithJoinedColumns, item.id))
            : asc(getColumn(tableWithJoinedColumns, item.id))
        )
      : [desc(employees.createdAt)]

  const [items, countResult] = await Promise.all([
    db
      .select({
        id: employees.id,
        userId: employees.userId,
        name: users.name,
        email: users.email,
        image: users.image,
        role: users.role,
        departmentId: employees.departmentId,
        departmentName: departments.name,
        status: employees.status,
        advertiserAccess: employees.advertiserAccess,
        mediaBuyerAccess: employees.mediaBuyerAccess,
        phoneNumber: employees.phoneNumber,
        socialContact: employees.socialContact,
        banned: users.banned,
        banReason: users.banReason,
        createdAt: employees.createdAt,
        updatedAt: employees.updatedAt,
      })
      .from(employees)
      .innerJoin(users, eq(employees.userId, users.id))
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .where(where)
      .limit(perPage)
      .offset(offset)
      .orderBy(...orderBy),
    db
      .select({ count: sql<number>`count(*)` })
      .from(employees)
      .innerJoin(users, eq(employees.userId, users.id))
      .where(where),
  ])

  const total = Number(countResult[0]?.count ?? 0)

  return { items, pageCount: Math.ceil(total / perPage), total }
}

export async function findEmployeeById(db: Database, id: string) {
  const result = await db
    .select({
      id: employees.id,
      userId: employees.userId,
      name: users.name,
      email: users.email,
      image: users.image,
      role: users.role,
      departmentId: employees.departmentId,
      departmentName: departments.name,
      status: employees.status,
      advertiserAccess: employees.advertiserAccess,
      mediaBuyerAccess: employees.mediaBuyerAccess,
      phoneNumber: employees.phoneNumber,
      socialContact: employees.socialContact,
      banned: users.banned,
      banReason: users.banReason,
      createdAt: employees.createdAt,
      updatedAt: employees.updatedAt,
    })
    .from(employees)
    .innerJoin(users, eq(employees.userId, users.id))
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .where(eq(employees.id, id))
    .limit(1)

  return result[0] ?? null
}

export async function findEmployeeAccess(db: Database, id: string) {
  const [assignedAdvertisers, assignedMediaBuyers, managedAdvertisers, managedMediaBuyers] = await Promise.all([
    db
      .select({
        id: advertisers.id,
        name: advertisers.name,
        companyName: advertisers.companyName,
        image: users.image,
      })
      .from(employeeAdvertiserAccess)
      .innerJoin(advertisers, eq(employeeAdvertiserAccess.advertiserId, advertisers.id))
      .innerJoin(users, eq(advertisers.userId, users.id))
      .where(eq(employeeAdvertiserAccess.employeeId, id)),
    db
      .select({ id: mediaBuyers.id, name: mediaBuyers.name, image: users.image })
      .from(employeeMediaBuyerAccess)
      .innerJoin(mediaBuyers, eq(employeeMediaBuyerAccess.mediaBuyerId, mediaBuyers.id))
      .innerJoin(users, eq(mediaBuyers.userId, users.id))
      .where(eq(employeeMediaBuyerAccess.employeeId, id)),
    db
      .select({
        id: advertisers.id,
        name: advertisers.name,
        companyName: advertisers.companyName,
        image: users.image,
      })
      .from(advertisers)
      .innerJoin(users, eq(advertisers.userId, users.id))
      .where(eq(advertisers.accountManagerId, id)),
    db
      .select({ id: mediaBuyers.id, name: mediaBuyers.name, image: users.image })
      .from(mediaBuyers)
      .innerJoin(users, eq(mediaBuyers.userId, users.id))
      .where(eq(mediaBuyers.accountManagerId, id)),
  ])

  return { assignedAdvertisers, assignedMediaBuyers, managedAdvertisers, managedMediaBuyers }
}

export async function searchEmployees(db: Database, q?: string) {
  return db
    .select({
      id: employees.id,
      name: users.name,
      email: users.email,
      image: users.image,
    })
    .from(employees)
    .innerJoin(users, eq(employees.userId, users.id))
    .where(q ? or(ilike(users.name, `%${q}%`), ilike(users.email, `%${q}%`)) : undefined)
    .limit(20)
}

// ─── Mutation Queries ────────────────────────────────────────────────────────

export async function createEmployee(
  db: Database,
  data: { userId: string; departmentId?: string }
) {
  const [employee] = await db
    .insert(employees)
    .values(data)
    .returning()

  return employee ?? null
}

export async function updateEmployee(
  db: Database,
  id: string,
  data: {
    departmentId?: string
    status?: Employee["status"]
    phoneNumber?: string
    socialContact?: string
  }
) {
  const [employee] = await db
    .update(employees)
    .set(data)
    .where(eq(employees.id, id))
    .returning()

  return employee ?? null
}

export async function updateUser(db: Database, userId: string, data: { name?: string; role?: (typeof ALL_ROLES)[number] }) {
  await db.update(users).set(data).where(eq(users.id, userId))
}

export async function updateEmployeeStatus(db: Database, ids: string[], status: Employee["status"]) {
  await db.update(employees).set({ status }).where(inArray(employees.id, ids))
  return { success: true }
}

export async function deleteEmployee(db: Database, id: string) {
  const [deleted] = await db.delete(employees).where(eq(employees.id, id)).returning()
  return deleted ?? null
}

export async function bulkDeleteEmployees(db: Database, ids: string[]) {
  await db.delete(employees).where(inArray(employees.id, ids))
  return { success: true }
}

// ─── Access Control Queries ──────────────────────────────────────────────────

export async function updateEmployeeAccessControl(
  db: Database,
  id: string,
  data: {
    advertiserAccess?: "all" | "selected"
    mediaBuyerAccess?: "all" | "selected"
  }
) {
  await db
    .update(employees)
    .set(data)
    .where(eq(employees.id, id))
}

export async function syncAdvertiserAccess(db: Database, employeeId: string, advertiserIds: string[]) {
  await db.delete(employeeAdvertiserAccess).where(eq(employeeAdvertiserAccess.employeeId, employeeId))

  if (advertiserIds.length > 0) {
    await db.insert(employeeAdvertiserAccess).values(
      advertiserIds.map((advertiserId) => ({
        employeeId,
        advertiserId,
      }))
    )
  }
}

export async function syncMediaBuyerAccess(db: Database, employeeId: string, mediaBuyerIds: string[]) {
  await db.delete(employeeMediaBuyerAccess).where(eq(employeeMediaBuyerAccess.employeeId, employeeId))

  if (mediaBuyerIds.length > 0) {
    await db.insert(employeeMediaBuyerAccess).values(
      mediaBuyerIds.map((mediaBuyerId) => ({
        employeeId,
        mediaBuyerId,
      }))
    )
  }
}

export async function syncManagedAdvertisers(db: Database, employeeId: string, managedAdvertiserIds: string[]) {
  // First, clear this employee from any advertisers they were previously assigned to
  await db.update(advertisers).set({ accountManagerId: null }).where(eq(advertisers.accountManagerId, employeeId))

  // Then, assign them to the new set of advertisers
  if (managedAdvertiserIds.length > 0) {
    await db
      .update(advertisers)
      .set({ accountManagerId: employeeId })
      .where(inArray(advertisers.id, managedAdvertiserIds))
  }
}

export async function syncManagedMediaBuyers(db: Database, employeeId: string, managedMediaBuyerIds: string[]) {
  await db.update(mediaBuyers).set({ accountManagerId: null }).where(eq(mediaBuyers.accountManagerId, employeeId))

  if (managedMediaBuyerIds.length > 0) {
    await db
      .update(mediaBuyers)
      .set({ accountManagerId: employeeId })
      .where(inArray(mediaBuyers.id, managedMediaBuyerIds))
  }
}

// ─── Permissions Queries ─────────────────────────────────────────────────────

export async function findEmployeePermissions(db: Database, employeeId: string) {
  const employee = await db.query.employees.findFirst({
    where: eq(employees.id, employeeId),
    columns: { id: true, permissions: true },
  })

  return employee ?? null
}

export async function findEmployeeByUserId(db: Database, userId: string) {
  const employee = await db.query.employees.findFirst({
    where: eq(employees.userId, userId),
    columns: { id: true },
  })

  return employee ?? null
}

export async function updateEmployeePermissions(
  db: Database,
  employeeId: string,
  permissions: Permission[]
) {
  const [updated] = await db
    .update(employees)
    .set({ permissions })
    .where(eq(employees.id, employeeId))
    .returning({ id: employees.id })

  return updated ?? null
}

export async function cloneEmployeePermissions(
  db: Database,
  sourceEmployeeId: string,
  targetEmployeeId: string
) {
  // Read source directly from DB (not cache) for authoritative state
  const source = await db.query.employees.findFirst({
    where: eq(employees.id, sourceEmployeeId),
    columns: { id: true, permissions: true },
  })

  if (!source) return null

  const sourcePermissions = (source.permissions ?? []) as Permission[]

  await db.update(employees).set({ permissions: sourcePermissions }).where(eq(employees.id, targetEmployeeId))

  return { success: true }
}
