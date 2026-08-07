import { and, asc, desc, eq, ilike, inArray, sql } from "@adscrush/db/drizzle"
import { filterColumns, getColumn } from "@adscrush/db/lib/filter-columns"
import { funnels, products, landingPages } from "@adscrush/db/schema"
import type { Database } from "@adscrush/db"
import type { ListFunnelsInput } from "./funnels.types"

export async function findFunnelsPaginated(
  db: Database,
  input: ListFunnelsInput,
  scopeWhere?: ReturnType<typeof and>
) {
  const { page, perPage, sort, filters, joinOperator, search, status, productId, language } = input
  const offset = (page - 1) * perPage

  const advancedWhere = filterColumns({ table: funnels, filters, joinOperator, database: "postgres" })

  const simpleWhere =
    search || (status && status.length > 0) || productId || language
      ? and(
          search ? ilike(funnels.name, `%${search}%`) : undefined,
          status && status.length > 0 ? inArray(funnels.status, status) : undefined,
          productId ? eq(funnels.productId, productId) : undefined,
          language ? eq(funnels.language, language) : undefined,
        )
      : undefined

  const where = and(
    filters.length > 0 ? advancedWhere : simpleWhere,
    scopeWhere
  )

  const orderBy =
    sort.length > 0
      ? sort.map((item) =>
          item.desc
            ? desc(getColumn(funnels, item.id))
            : asc(getColumn(funnels, item.id))
        )
      : [desc(funnels.createdAt)]

  const [items, countResult] = await Promise.all([
    db
      .select({
        id: funnels.id,
        productId: funnels.productId,
        name: funnels.name,
        language: funnels.language,
        domain: funnels.domain,
        pageUrl: funnels.pageUrl,
        thankYouPageUrl: funnels.thankYouPageUrl,
        status: funnels.status,
        createdAt: funnels.createdAt,
        updatedAt: funnels.updatedAt,
        landingPagesCount: sql<number>`
          (SELECT COUNT(*)::int FROM ${landingPages} WHERE ${landingPages.funnelId} = ${funnels.id})
        `,
        product: {
          id: products.id,
          name: products.name,
          image: products.image,
        },
      })
      .from(funnels)
      .innerJoin(products, eq(funnels.productId, products.id))
      .where(where)
      .limit(perPage)
      .offset(offset)
      .orderBy(...orderBy),
    db
      .select({ count: sql<number>`count(*)` })
      .from(funnels)
      .innerJoin(products, eq(funnels.productId, products.id))
      .where(where),
  ])

  const total = Number(countResult[0]?.count ?? 0)

  return {
    items: items.map((item) => ({
      ...item,
      landingPagesCount: Number(item.landingPagesCount),
    })),
    pageCount: Math.ceil(total / perPage),
    total,
  }
}

export async function findFunnelById(db: Database, id: string) {
  const [result] = await db
    .select({
      id: funnels.id,
      productId: funnels.productId,
      name: funnels.name,
      language: funnels.language,
      domain: funnels.domain,
      pageUrl: funnels.pageUrl,
      thankYouPageUrl: funnels.thankYouPageUrl,
      status: funnels.status,
      createdAt: funnels.createdAt,
      updatedAt: funnels.updatedAt,
      advertiserId: products.advertiserId,
      product: {
        id: products.id,
        name: products.name,
        image: products.image,
      },
    })
    .from(funnels)
    .innerJoin(products, eq(funnels.productId, products.id))
    .where(eq(funnels.id, id))
    .limit(1)

  return result ?? null
}

export async function findLandingPages(db: Database, funnelId: string) {
  return db
    .select({
      id: landingPages.id,
      name: landingPages.name,
      url: landingPages.url,
      weight: landingPages.weight,
      status: landingPages.status,
    })
    .from(landingPages)
    .where(eq(landingPages.funnelId, funnelId))
}

export async function findAllLandingPages(db: Database, funnelId: string) {
  return db
    .select()
    .from(landingPages)
    .where(eq(landingPages.funnelId, funnelId))
    .orderBy(asc(landingPages.weight))
}

export async function createFunnel(db: Database, data: typeof funnels.$inferInsert) {
  const [funnel] = await db.insert(funnels).values(data).returning()
  return funnel ?? null
}

export async function createLandingPages(db: Database, rows: Array<typeof landingPages.$inferInsert>) {
  return db.insert(landingPages).values(rows).returning()
}

export async function createSingleLandingPage(db: Database, data: typeof landingPages.$inferInsert) {
  const [lp] = await db.insert(landingPages).values(data).returning()
  return lp ?? null
}

export async function updateFunnel(db: Database, id: string, data: Partial<typeof funnels.$inferInsert>) {
  const [updated] = await db.update(funnels).set(data).where(eq(funnels.id, id)).returning()
  return updated ?? null
}

export async function updateLandingPage(db: Database, id: string, data: Partial<typeof landingPages.$inferInsert>) {
  const [updated] = await db.update(landingPages).set(data).where(eq(landingPages.id, id)).returning()
  return updated ?? null
}

export async function deleteFunnel(db: Database, id: string) {
  const [deleted] = await db.delete(funnels).where(eq(funnels.id, id)).returning()
  return deleted ?? null
}

export async function deleteLandingPage(db: Database, id: string) {
  await db.delete(landingPages).where(eq(landingPages.id, id))
  return { success: true }
}

export async function getFunnelCounts(db: Database, scopeWhere?: ReturnType<typeof and>) {
  const [statusCounts, productCounts, languageCounts] = await Promise.all([
    db
      .select({ value: funnels.status, count: sql<number>`count(*)::int` })
      .from(funnels)
      .innerJoin(products, eq(funnels.productId, products.id))
      .where(scopeWhere)
      .groupBy(funnels.status),
    db
      .select({ value: funnels.productId, label: products.name, count: sql<number>`count(*)::int` })
      .from(funnels)
      .innerJoin(products, eq(funnels.productId, products.id))
      .where(scopeWhere)
      .groupBy(funnels.productId, products.name)
      .orderBy(products.name),
    db
      .select({ value: funnels.language, count: sql<number>`count(*)::int` })
      .from(funnels)
      .innerJoin(products, eq(funnels.productId, products.id))
      .where(scopeWhere)
      .groupBy(funnels.language),
  ])

  return {
    statuses: statusCounts.map((s) => ({ value: s.value, count: Number(s.count) })),
    products: productCounts.map((p) => ({ value: p.value, label: p.label, count: Number(p.count) })),
    languages: languageCounts.map((l) => ({ value: l.value, count: Number(l.count) })),
  }
}

export async function searchFunnels(
  db: Database,
  q?: string,
  limit?: number,
  ids?: string[],
  scopeWhere?: ReturnType<typeof and>
) {
  return db
    .select({ id: funnels.id, name: funnels.name })
    .from(funnels)
    .innerJoin(products, eq(funnels.productId, products.id))
    .where(
      and(
        q ? ilike(funnels.name, `%${q}%`) : undefined,
        ids && ids.length > 0 ? inArray(funnels.id, ids) : undefined,
        scopeWhere
      )
    )
    .orderBy(asc(funnels.name))
    .limit(limit ?? 50)
}
