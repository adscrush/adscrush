import { and, asc, desc, eq, ilike, inArray, sql } from "@adscrush/db/drizzle"
import { filterColumns, getColumn } from "@adscrush/db/lib/filter-columns"
import {
  creatives,
  creativeFiles,
  creativeNotes,
  creativePerformanceTags,
  products,
  type Creative,
} from "@adscrush/db/schema"
import type { Database } from "@adscrush/db"
import type { ListCreativesInput } from "./creatives.types"

// ─── Creative Queries ────────────────────────────────────────────────────────

export async function findCreatives(
  db: Database,
  input: ListCreativesInput,
  scope: { isAllAdvertisers: boolean; advertiserIds: string[] }
) {
  const { page, perPage, sort, filters, joinOperator, search, status, productId, folderId, tag } = input
  const offset = (page - 1) * perPage

  const advancedWhere = filterColumns({
    table: creatives,
    filters,
    joinOperator,
    database: "postgres",
  })

  const simpleWhere =
    search || (status && status.length > 0) || productId || folderId !== undefined || tag
      ? and(
          search ? ilike(creatives.name, `%${search}%`) : undefined,
          status && status.length > 0 ? inArray(creatives.status, status) : undefined,
          productId ? eq(creatives.productId, productId) : undefined,
          folderId !== undefined ? (folderId === null ? sql`${creatives.folderId} is null` : eq(creatives.folderId, folderId)) : undefined,
          tag ? sql`${tag} = any(${creatives.tags})` : undefined
        )
      : undefined

  const where = and(
    filters.length > 0 ? advancedWhere : simpleWhere,
    !scope.isAllAdvertisers ? inArray(products.advertiserId, scope.advertiserIds.length > 0 ? scope.advertiserIds : ["-1"]) : undefined
  )

  const orderBy =
    sort.length > 0
      ? sort.map((item) =>
          item.desc
            ? desc(getColumn(creatives, item.id))
            : asc(getColumn(creatives, item.id))
        )
      : [desc(creatives.createdAt)]

  const [items, countResult] = await Promise.all([
    db
      .select({
        id: creatives.id,
        name: creatives.name,
        productId: creatives.productId,
        folderId: creatives.folderId,
        altText: creatives.altText,
        tags: creatives.tags,
        status: creatives.status,
        createdAt: creatives.createdAt,
        updatedAt: creatives.updatedAt,
      })
      .from(creatives)
      .innerJoin(products, eq(creatives.productId, products.id))
      .where(where)
      .limit(perPage)
      .offset(offset)
      .orderBy(...orderBy),
    db
      .select({ count: sql<number>`count(*)` })
      .from(creatives)
      .innerJoin(products, eq(creatives.productId, products.id))
      .where(where),
  ])

  return { items, countResult }
}

export async function findCreativeById(db: Database, id: string) {
  const [result] = await db
    .select({
      id: creatives.id,
      name: creatives.name,
      productId: creatives.productId,
      folderId: creatives.folderId,
      altText: creatives.altText,
      tags: creatives.tags,
      status: creatives.status,
      createdAt: creatives.createdAt,
      updatedAt: creatives.updatedAt,
    })
    .from(creatives)
    .where(eq(creatives.id, id))
    .limit(1)

  return result ?? null
}

export async function findCreativeFiles(db: Database, creativeId: string) {
  return db
    .select()
    .from(creativeFiles)
    .where(eq(creativeFiles.creativeId, creativeId))
    .orderBy(creativeFiles.sortOrder)
}

export async function findCreativeFilesByIds(db: Database, creativeIds: string[]) {
  if (creativeIds.length === 0) return []

  return db
    .select()
    .from(creativeFiles)
    .where(inArray(creativeFiles.creativeId, creativeIds))
    .orderBy(creativeFiles.sortOrder)
}

// ─── Mutation Queries ────────────────────────────────────────────────────────

export async function createCreative(
  db: Database,
  data: {
    name: string
    productId: string
    folderId?: string
    altText?: string
    tags?: string[]
    status?: Creative["status"]
  }
) {
  const [creative] = await db.insert(creatives).values(data).returning()
  return creative ?? null
}

export async function createCreativeWithFile(
  db: Database,
  data: {
    name: string
    productId: string
    folderId?: string
    altText?: string
    tags?: string[]
    status?: Creative["status"]
    mediaFileId?: string
    cdnUrl?: string
    mimeType?: string
    fileType?: string
    fileSize?: number
    thumbnailUrl?: string
  }
) {
  const [creative] = await db.insert(creatives).values({
    name: data.name,
    productId: data.productId,
    folderId: data.folderId,
    altText: data.altText,
    tags: data.tags,
    status: data.status,
  }).returning()

  if (!creative) return null

  // If media file data is provided, create a creativeFiles record
  if (data.mediaFileId && data.cdnUrl) {
    await db.insert(creativeFiles).values({
      creativeId: creative.id,
      mediaFileId: data.mediaFileId,
      cdnUrl: data.cdnUrl,
      mimeType: data.mimeType ?? null,
      fileType: data.fileType ?? null,
      fileSize: data.fileSize ?? null,
      thumbnailUrl: data.thumbnailUrl ?? null,
      originalFileName: data.name,
      sortOrder: 0,
    })
  }

  return creative
}

export async function updateCreative(
  db: Database,
  id: string,
  data: {
    name?: string
    folderId?: string | null
    altText?: string
    tags?: string[]
    status?: Creative["status"]
  }
) {
  const [updated] = await db
    .update(creatives)
    .set(data)
    .where(eq(creatives.id, id))
    .returning()

  return updated ?? null
}

export async function deleteCreative(db: Database, id: string) {
  const [deleted] = await db.delete(creatives).where(eq(creatives.id, id)).returning()
  return deleted ?? null
}

export async function bulkMoveToFolder(db: Database, creativeIds: string[], folderId: string | null) {
  await db
    .update(creatives)
    .set({ folderId })
    .where(inArray(creatives.id, creativeIds))

  return { success: true }
}

// ─── Notes Queries ───────────────────────────────────────────────────────────

export async function createNote(db: Database, creativeId: string, note: string) {
  const [created] = await db
    .insert(creativeNotes)
    .values({ creativeId, mediaBuyerId: "", note })
    .returning()

  return created ?? null
}

export async function updateNote(db: Database, id: string, note: string) {
  const [updated] = await db
    .update(creativeNotes)
    .set({ note })
    .where(eq(creativeNotes.id, id))
    .returning()

  return updated ?? null
}

export async function deleteNote(db: Database, id: string) {
  await db.delete(creativeNotes).where(eq(creativeNotes.id, id))
  return { success: true }
}

// ─── Performance Tags Queries ────────────────────────────────────────────────

export async function setPerformanceTag(db: Database, creativeId: string, performed: boolean) {
  const [tag] = await db
    .insert(creativePerformanceTags)
    .values({ creativeId, mediaBuyerId: "", performed })
    .returning()

  return tag ?? null
}
