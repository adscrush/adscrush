import { asc, desc, eq, ilike, inArray, isNull, sql } from "@adscrush/db/drizzle"
import { filterColumns, getColumn } from "@adscrush/db/lib/filter-columns"
import { languages } from "@adscrush/db/schema"
import type { Database } from "@adscrush/db"
import type { ListLanguagesInput } from "./languages.types"

export async function findLanguagesPaginated(db: Database, input: ListLanguagesInput) {
  const { page, perPage, sort, filters, joinOperator, search } = input
  const offset = (page - 1) * perPage

  const advancedWhere = filterColumns({ table: languages, filters, joinOperator, database: "postgres" })
  const simpleWhere = search ? ilike(languages.name, `%${search}%`) : undefined
  const where = filters.length > 0 ? advancedWhere : simpleWhere

  const orderBy =
    sort.length > 0
      ? sort.map((item) => (item.desc ? desc(getColumn(languages, item.id)) : asc(getColumn(languages, item.id))))
      : [asc(languages.name)]

  const [items, countResult] = await Promise.all([
    db.select().from(languages).where(where).limit(perPage).offset(offset).orderBy(...orderBy),
    db.select({ count: sql<number>`count(*)` }).from(languages).where(where),
  ])

  const total = Number(countResult[0]?.count ?? 0)
  return { items, pageCount: Math.ceil(total / perPage), total }
}

export async function findAllActiveLanguages(db: Database) {
  return db
    .select({ id: languages.id, name: languages.name, code: languages.code })
    .from(languages)
    .where(isNull(languages.deletedAt))
    .orderBy(asc(languages.name))
}

export async function findLanguageById(db: Database, id: string) {
  return db.query.languages.findFirst({ where: eq(languages.id, id) })
}

export async function searchLanguages(db: Database, q?: string) {
  return db
    .select({ id: languages.id, name: languages.name, code: languages.code })
    .from(languages)
    .where(q ? ilike(languages.name, `%${q}%`) : undefined)
    .limit(20)
}

export async function createLanguage(db: Database, data: typeof languages.$inferInsert) {
  const [language] = await db.insert(languages).values(data).returning()
  return language ?? null
}

export async function updateLanguage(db: Database, id: string, data: Partial<typeof languages.$inferInsert>) {
  const [language] = await db.update(languages).set(data).where(eq(languages.id, id)).returning()
  return language ?? null
}

export async function deleteLanguage(db: Database, id: string) {
  const [deleted] = await db.delete(languages).where(eq(languages.id, id)).returning()
  return deleted ?? null
}

export async function bulkDeleteLanguages(db: Database, ids: string[]) {
  await db.delete(languages).where(inArray(languages.id, ids))
  return { success: true }
}
