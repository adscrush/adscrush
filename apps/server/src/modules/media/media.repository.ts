import { and, eq, ilike, inArray, isNull, sql, type SQL } from "@adscrush/db/drizzle"
import { mediaFiles, mediaFolders, users, productMedia, creativeFiles, type NewMediaFile } from "@adscrush/db/schema"
import type { Database } from "@adscrush/db"
import { MIME_CATEGORIES, type MimeCategory } from "./media.types"
import {
  buildPaginationQuery,
  buildPaginatedResult,
  type SortField,
  type SortOrder,
} from "~/lib/media/pagination"

export async function findMediaFiles(
  db: Database,
  options: {
    cursor?: string | null
    pageSize: number
    folderId?: string | null
    search?: string
    mimeCategory?: string
    mimeCategories?: string[]
    usedIn?: string
    productIds?: string[]
    tags?: string[]
    sortBy?: string
    sortOrder?: string
    uploadedBy?: string
  }
) {
  const { cursor, pageSize, folderId, search, mimeCategory, mimeCategories, usedIn, productIds, tags, sortBy, sortOrder, uploadedBy } = options

  const pagination = buildPaginationQuery({ cursor, pageSize, sortBy: (sortBy ?? "dateUploaded") as SortField, sortOrder: (sortOrder ?? "desc") as SortOrder })

  const conditions: SQL[] = []

  if (pagination.where) {
    conditions.push(pagination.where)
  }

  if (folderId !== undefined) {
    if (folderId === null) {
      conditions.push(isNull(mediaFiles.folderId))
    } else {
      conditions.push(eq(mediaFiles.folderId, folderId))
    }
  }

  if (search) {
    conditions.push(ilike(mediaFiles.name, `%${search}%`))
  }

  if (mimeCategory) {
    const mimeTypes = MIME_CATEGORIES[mimeCategory as MimeCategory]
    if (mimeTypes && mimeTypes.length > 0) {
      conditions.push(inArray(mediaFiles.mimeType, [...mimeTypes]))
    }
  }

  if (mimeCategories && mimeCategories.length > 0) {
    const mimeTypes = mimeCategories.flatMap(
      (category) => MIME_CATEGORIES[category as MimeCategory] ?? []
    )
    if (mimeTypes.length > 0) {
      conditions.push(inArray(mediaFiles.mimeType, mimeTypes))
    }
  }

  if (usedIn === "not_used") {
    conditions.push(
      sql`not exists (select 1 from ${productMedia} where ${productMedia.mediaFileId} = ${mediaFiles.id})`
    )
    conditions.push(
      sql`not exists (select 1 from ${creativeFiles} where ${creativeFiles.mediaFileId} = ${mediaFiles.id})`
    )
  }

  if (productIds && productIds.length > 0) {
    conditions.push(
      sql`exists (select 1 from ${productMedia} where ${productMedia.mediaFileId} = ${mediaFiles.id} and ${inArray(productMedia.productId, productIds)})`
    )
  }

  if (tags && tags.length > 0) {
    const normalizedTags = tags.map((t) => t.toLowerCase())
    conditions.push(
      sql`${mediaFiles.tags} @> ${normalizedTags}::text[]`
    )
  }

  if (uploadedBy) {
    conditions.push(eq(mediaFiles.uploadedBy, uploadedBy))
  }

  const items = await db
    .select({
      id: mediaFiles.id,
      name: mediaFiles.name,
      mimeType: mediaFiles.mimeType,
      fileSize: mediaFiles.fileSize,
      width: mediaFiles.width,
      height: mediaFiles.height,
      cdnUrl: mediaFiles.cdnUrl,
      storagePath: mediaFiles.storagePath,
      contentHash: mediaFiles.contentHash,
      folderId: mediaFiles.folderId,
      uploadedBy: mediaFiles.uploadedBy,
      uploaderName: users.name,
      tags: mediaFiles.tags,
      createdAt: mediaFiles.createdAt,
      updatedAt: mediaFiles.updatedAt,
    })
    .from(mediaFiles)
    .leftJoin(users, eq(mediaFiles.uploadedBy, users.id))
    .where(and(...conditions))
    .orderBy(...pagination.orderBy)
    .limit(pagination.limit)

  return buildPaginatedResult(items, pageSize, (sortBy ?? "dateUploaded") as SortField)
}

export async function findMediaFileById(db: Database, id: string) {
  const [file] = await db
    .select()
    .from(mediaFiles)
    .where(eq(mediaFiles.id, id))
    .limit(1)

  return file ?? null
}

export async function findMediaFileTags(db: Database, id: string) {
  const [file] = await db
    .select({ id: mediaFiles.id, tags: mediaFiles.tags })
    .from(mediaFiles)
    .where(eq(mediaFiles.id, id))
    .limit(1)

  return file ?? null
}

export async function updateMediaFile(db: Database, id: string, data: Partial<NewMediaFile>) {
  const [updated] = await db
    .update(mediaFiles)
    .set(data)
    .where(eq(mediaFiles.id, id))
    .returning()

  return updated ?? null
}

export async function deleteMediaFile(db: Database, id: string) {
  await db.delete(mediaFiles).where(eq(mediaFiles.id, id))
}

export async function findMediaFolderById(db: Database, id: string) {
  const [folder] = await db
    .select({ id: mediaFolders.id })
    .from(mediaFolders)
    .where(eq(mediaFolders.id, id))
    .limit(1)

  return folder ?? null
}

export async function searchMediaFiles(
  db: Database,
  query: string,
  pageSize: number,
  cursor?: string | null
) {
  const pagination = buildPaginationQuery({
    cursor,
    pageSize,
    sortBy: "dateUploaded",
    sortOrder: "desc",
  })

  const conditions: SQL[] = [
    ilike(mediaFiles.name, `%${query}%`),
  ]

  if (pagination.where) {
    conditions.push(pagination.where)
  }

  const items = await db
    .select({
      id: mediaFiles.id,
      name: mediaFiles.name,
      mimeType: mediaFiles.mimeType,
      fileSize: mediaFiles.fileSize,
      width: mediaFiles.width,
      height: mediaFiles.height,
      cdnUrl: mediaFiles.cdnUrl,
      storagePath: mediaFiles.storagePath,
      contentHash: mediaFiles.contentHash,
      folderId: mediaFiles.folderId,
      uploadedBy: mediaFiles.uploadedBy,
      uploaderName: users.name,
      tags: mediaFiles.tags,
      createdAt: mediaFiles.createdAt,
      updatedAt: mediaFiles.updatedAt,
    })
    .from(mediaFiles)
    .leftJoin(users, eq(mediaFiles.uploadedBy, users.id))
    .where(and(...conditions))
    .orderBy(...pagination.orderBy)
    .limit(pagination.limit)

  return buildPaginatedResult(items, pageSize, "dateUploaded")
}
