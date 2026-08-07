import { and, asc, desc, eq, ilike, inArray, sql } from "@adscrush/db/drizzle"
import { filterColumns, getColumn } from "@adscrush/db/lib/filter-columns"
import { departments } from "@adscrush/db/schema"
import type { Database } from "@adscrush/db"
import type { ListDepartmentsInput } from "./departments.types"

export async function findDepartmentsPaginated(
  db: Database,
  input: ListDepartmentsInput
) {
  const { page, perPage, sort, filters, joinOperator, name, status } = input
  const offset = (page - 1) * perPage

  const advancedWhere = filterColumns({
    table: departments,
    filters: filters,
    joinOperator,
    database: "postgres",
  })

  const simpleWhere =
    name || (status && status.length > 0)
      ? and(
          name ? ilike(departments.name, `%${name}%`) : undefined,
          status && status.length > 0 ? inArray(departments.status, status) : undefined
        )
      : undefined

  const where = filters.length > 0 ? advancedWhere : simpleWhere

  const orderBy =
    sort.length > 0
      ? sort.map((item) =>
          item.desc ? desc(getColumn(departments, item.id)) : asc(getColumn(departments, item.id))
        )
      : [desc(departments.createdAt)]

  const [items, countResult] = await Promise.all([
    db
      .select()
      .from(departments)
      .where(where)
      .limit(perPage)
      .offset(offset)
      .orderBy(...orderBy),
    db
      .select({ count: sql<number>`count(*)` })
      .from(departments)
      .where(where),
  ])

  const total = Number(countResult[0]?.count ?? 0)

  return {
    items,
    pageCount: Math.ceil(total / perPage),
    total,
  }
}

export async function findDepartmentById(db: Database, id: string) {
  return db.query.departments.findFirst({
    where: eq(departments.id, id),
  })
}

export async function searchDepartments(db: Database, q?: string) {
  return db
    .select({ id: departments.id, name: departments.name })
    .from(departments)
    .where(q ? ilike(departments.name, `%${q}%`) : undefined)
    .limit(20)
}

export async function createDepartment(db: Database, data: typeof departments.$inferInsert) {
  const [department] = await db.insert(departments).values(data).returning()
  return department ?? null
}

export async function updateDepartment(db: Database, id: string, data: Partial<typeof departments.$inferInsert>) {
  const [department] = await db
    .update(departments)
    .set(data)
    .where(eq(departments.id, id))
    .returning()
  return department ?? null
}

export async function deleteDepartment(db: Database, id: string) {
  const [deleted] = await db.delete(departments).where(eq(departments.id, id)).returning()
  return deleted ?? null
}

export async function bulkUpdateDepartmentStatus(db: Database, ids: string[], status: string) {
  await db.update(departments).set({ status: status as typeof departments.$inferInsert.status }).where(inArray(departments.id, ids))
  return { success: true }
}

export async function bulkDeleteDepartments(db: Database, ids: string[]) {
  await db.delete(departments).where(inArray(departments.id, ids))
  return { success: true }
}
