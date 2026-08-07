import { and, asc, desc, eq, ilike, inArray, sql } from "@adscrush/db/drizzle"
import { filterColumns, getColumn } from "@adscrush/db/lib/filter-columns"
import {
  advertisers,
  categories,
  products,
  productMedia,
  productMetafieldValues,
  type Product,
  type ProductMedia,
} from "@adscrush/db/schema"
import type { Database } from "@adscrush/db"
import type { ListProductsInput } from "./products.types"

// ─── Product Queries ─────────────────────────────────────────────────────────

export async function findProducts(
  db: Database,
  input: ListProductsInput,
  scope: { isAllAdvertisers: boolean; advertiserIds: string[] }
) {
  const { page, perPage, sort, filters, joinOperator, search, status, advertiserId, categoryId } = input
  const offset = (page - 1) * perPage

  const tableWithJoinedColumns = {
    ...products,
    advertiserName: advertisers.name,
    categoryName: categories.name,
  }

  const advancedWhere = filterColumns({
    table: tableWithJoinedColumns,
    filters,
    joinOperator,
    database: "postgres",
  })

  const simpleWhere =
    search || (status && status.length > 0) || advertiserId || categoryId
      ? and(
          search ? ilike(products.name, `%${search}%`) : undefined,
          status && status.length > 0 ? inArray(products.status, status) : undefined,
          advertiserId ? eq(products.advertiserId, advertiserId) : undefined,
          categoryId ? eq(products.categoryId, categoryId) : undefined
        )
      : undefined

  const where = and(
    filters.length > 0 ? advancedWhere : simpleWhere,
    !scope.isAllAdvertisers
      ? inArray(products.advertiserId, scope.advertiserIds.length > 0 ? scope.advertiserIds : ["-1"])
      : undefined
  )

  const orderBy =
    sort.length > 0
      ? sort.map((item) =>
          item.desc
            ? desc(getColumn(tableWithJoinedColumns, item.id))
            : asc(getColumn(tableWithJoinedColumns, item.id))
        )
      : [desc(products.createdAt)]

  const [items, countResult] = await Promise.all([
    db
      .select({
        id: products.id,
        advertiserId: products.advertiserId,
        categoryId: products.categoryId,
        name: products.name,
        image: products.image,
        description: products.description,
        privateNote: products.privateNote,
        status: products.status,
        visibility: products.visibility,
        dailyCap: products.dailyCap,
        totalCap: products.totalCap,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        advertiser: {
          id: advertisers.id,
          name: advertisers.name,
        },
        category: {
          id: categories.id,
          name: categories.name,
        },
      })
      .from(products)
      .leftJoin(advertisers, eq(products.advertiserId, advertisers.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(where)
      .limit(perPage)
      .offset(offset)
      .orderBy(...orderBy),
    db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(where),
  ])

  const total = Number(countResult[0]?.count ?? 0)

  return { items, pageCount: Math.ceil(total / perPage), total }
}

export async function findProductById(db: Database, id: string) {
  const [product] = await db
    .select({
      id: products.id,
      advertiserId: products.advertiserId,
      categoryId: products.categoryId,
      name: products.name,
      image: products.image,
      description: products.description,
      privateNote: products.privateNote,
      status: products.status,
      visibility: products.visibility,
      dailyCap: products.dailyCap,
      totalCap: products.totalCap,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
      advertiser: {
        id: advertisers.id,
        name: advertisers.name,
      },
      category: {
        id: categories.id,
        name: categories.name,
      },
    })
    .from(products)
    .leftJoin(advertisers, eq(products.advertiserId, advertisers.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.id, id))
    .limit(1)

  return product ?? null
}

export async function findProductForEdit(db: Database, id: string) {
  const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1)
  return product ?? null
}

export async function findProductForDelete(db: Database, id: string) {
  const [product] = await db
    .select({ id: products.id, image: products.image, advertiserId: products.advertiserId })
    .from(products)
    .where(eq(products.id, id))
    .limit(1)

  return product ?? null
}

export async function findProductPopover(db: Database, id: string) {
  const [product] = await db
    .select({
      id: products.id,
      name: products.name,
      image: products.image,
      status: products.status,
      advertiser: {
        id: advertisers.id,
        name: advertisers.name,
      },
      category: {
        id: categories.id,
        name: categories.name,
      },
    })
    .from(products)
    .leftJoin(advertisers, eq(products.advertiserId, advertisers.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.id, id))
    .limit(1)

  return product ?? null
}

export async function findAdvertiserName(db: Database, advertiserId: string) {
  const [advertiser] = await db
    .select({ name: advertisers.name })
    .from(advertisers)
    .where(eq(advertisers.id, advertiserId))
    .limit(1)

  return advertiser ?? null
}

export async function createProduct(
  db: Database,
  data: {
    name: string
    advertiserId: string
    categoryId?: string | null
    image?: string | null
    description?: string | null
    privateNote?: string | null
    status: Product["status"]
    visibility: Product["visibility"]
    dailyCap?: number | null
    totalCap?: number | null
    quantity?: number | null
    price?: string | null
    compareAtPrice?: string | null
    costPerItem?: string | null
  }
) {
  const [product] = await db.insert(products).values(data).returning()
  return product ?? null
}

export async function updateProduct(db: Database, id: string, data: Record<string, unknown>) {
  const [updated] = await db.update(products).set(data).where(eq(products.id, id)).returning()
  return updated ?? null
}

export async function deleteProduct(db: Database, id: string) {
  const [deleted] = await db.delete(products).where(eq(products.id, id)).returning()
  return deleted ?? null
}

export async function bulkUpdateStatus(db: Database, ids: string[], status: Product["status"]) {
  await db.update(products).set({ status }).where(inArray(products.id, ids))
  return { success: true }
}

export async function bulkDelete(db: Database, ids: string[]) {
  await db.delete(products).where(inArray(products.id, ids))
  return { success: true }
}

// ─── Media Queries ───────────────────────────────────────────────────────────

export async function findProductMedia(db: Database, productId: string) {
  return db
    .select()
    .from(productMedia)
    .where(eq(productMedia.productId, productId))
    .orderBy(asc(productMedia.position))
}

export async function syncProductMedia(
  db: Database,
  productId: string,
  mediaItems: Array<{ url: string; type: ProductMedia["type"]; mediaFileId?: string | null; position: number }>
) {
  await db.delete(productMedia).where(eq(productMedia.productId, productId))
  if (mediaItems.length > 0) {
    await db.insert(productMedia).values(
      mediaItems.map((item) => ({
        productId,
        url: item.url,
        type: item.type,
        mediaFileId: item.mediaFileId ?? null,
        position: item.position,
      }))
    )
  }
}

// ─── Metafield Queries ──────────────────────────────────────────────────────

export async function findProductMetafields(db: Database, productId: string) {
  return db
    .select()
    .from(productMetafieldValues)
    .where(eq(productMetafieldValues.productId, productId))
}

export async function syncProductMetafields(
  db: Database,
  productId: string,
  metafieldValues: Record<string, string>
) {
  await db.delete(productMetafieldValues).where(eq(productMetafieldValues.productId, productId))
  const entries = Object.entries(metafieldValues)
  if (entries.length > 0) {
    await db.insert(productMetafieldValues).values(
      entries.map(([metafieldId, value]) => ({ productId, metafieldId, value }))
    )
  }
}

// ─── Search & Options ───────────────────────────────────────────────────────

export async function searchProducts(
  db: Database,
  scope: { isAllAdvertisers: boolean; advertiserIds: string[] },
  options: { q?: string; limit: number; ids?: string[] }
) {
  const { q, limit, ids } = options

  return db
    .select({
      id: products.id,
      name: products.name,
      image: products.image,
    })
    .from(products)
    .where(
      and(
        q ? ilike(products.name, `%${q}%`) : undefined,
        ids && ids.length > 0 ? inArray(products.id, ids) : undefined,
        !scope.isAllAdvertisers
          ? inArray(products.advertiserId, scope.advertiserIds.length > 0 ? scope.advertiserIds : ["-1"])
          : undefined
      )
    )
    .orderBy(asc(products.name))
    .limit(limit)
}

export async function getProductOptions(
  db: Database,
  scope: { isAllAdvertisers: boolean; advertiserIds: string[] },
  options: { search?: string; limit: number }
) {
  const { search, limit } = options

  return db
    .select({
      id: products.id,
      name: products.name,
      image: products.image,
    })
    .from(products)
    .where(
      and(
        search ? ilike(products.name, `%${search}%`) : undefined,
        !scope.isAllAdvertisers
          ? inArray(products.advertiserId, scope.advertiserIds.length > 0 ? scope.advertiserIds : ["-1"])
          : undefined
      )
    )
    .limit(limit)
    .orderBy(asc(products.name))
}

export async function getStatusCounts(
  db: Database,
  scope: { isAllAdvertisers: boolean; advertiserIds: string[] }
) {
  const where = !scope.isAllAdvertisers
    ? inArray(products.advertiserId, scope.advertiserIds)
    : undefined

  const counts = await db
    .select({
      status: products.status,
      count: sql<number>`count(*)`,
    })
    .from(products)
    .where(where)
    .groupBy(products.status)

  const result: Record<string, number> = {}
  counts.forEach((item) => {
    result[item.status] = Number(item.count)
  })

  return result
}
