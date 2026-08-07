import { asc, desc, eq, ilike, inArray, sql } from "@adscrush/db/drizzle"
import { filterColumns, getColumn } from "@adscrush/db/lib/filter-columns"
import { categories, categoryMetafields } from "@adscrush/db/schema"
import type { Database } from "@adscrush/db"
import type { ListCategoriesInput } from "./categories.types"

export async function findCategoriesPaginated(db: Database, input: ListCategoriesInput) {
  const { page, perPage, sort, filters, joinOperator, search } = input
  const offset = (page - 1) * perPage

  const advancedWhere = filterColumns({ table: categories, filters, joinOperator, database: "postgres" })
  const simpleWhere = search ? ilike(categories.name, `%${search}%`) : undefined
  const where = filters.length > 0 ? advancedWhere : simpleWhere

  const orderBy =
    sort.length > 0
      ? sort.map((item) => (item.desc ? desc(getColumn(categories, item.id)) : asc(getColumn(categories, item.id))))
      : [desc(categories.createdAt)]

  const [items, countResult] = await Promise.all([
    db.select().from(categories).where(where).limit(perPage).offset(offset).orderBy(...orderBy),
    db.select({ count: sql<number>`count(*)` }).from(categories).where(where),
  ])

  const total = Number(countResult[0]?.count ?? 0)
  return { items, pageCount: Math.ceil(total / perPage), total }
}

export async function findCategoryById(db: Database, id: string) {
  return db.query.categories.findFirst({ where: eq(categories.id, id) })
}

export async function searchCategories(db: Database, q?: string) {
  return db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(q ? ilike(categories.name, `%${q}%`) : undefined)
    .limit(20)
}

export async function findCategoryMetafields(db: Database, categoryId: string) {
  return db
    .select()
    .from(categoryMetafields)
    .where(eq(categoryMetafields.categoryId, categoryId))
    .orderBy(asc(categoryMetafields.position))
}

export async function createCategory(db: Database, data: typeof categories.$inferInsert) {
  const [category] = await db.insert(categories).values(data).returning()
  return category ?? null
}

export async function updateCategory(db: Database, id: string, data: Partial<typeof categories.$inferInsert>) {
  const [category] = await db.update(categories).set(data).where(eq(categories.id, id)).returning()
  return category ?? null
}

export async function deleteCategory(db: Database, id: string) {
  const [deleted] = await db.delete(categories).where(eq(categories.id, id)).returning()
  return deleted ?? null
}

export async function bulkDeleteCategories(db: Database, ids: string[]) {
  await db.delete(categories).where(inArray(categories.id, ids))
  return { success: true }
}
