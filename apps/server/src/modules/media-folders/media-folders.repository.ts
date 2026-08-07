import { and, asc, eq, isNull, sql } from "@adscrush/db/drizzle"
import { mediaFolders, mediaFiles, type NewMediaFolder } from "@adscrush/db/schema"
import type { Database } from "@adscrush/db"

export async function findMediaFolders(db: Database, parentId?: string | null) {
  const conditions = parentId !== undefined
    ? (parentId === null ? isNull(mediaFolders.parentId) : eq(mediaFolders.parentId, parentId))
    : undefined

  return db
    .select({
      id: mediaFolders.id,
      name: mediaFolders.name,
      parentId: mediaFolders.parentId,
      depth: mediaFolders.depth,
      createdBy: mediaFolders.createdBy,
      createdAt: mediaFolders.createdAt,
      updatedAt: mediaFolders.updatedAt,
      fileCount: sql<number>`(select count(*) from ${mediaFiles} where ${mediaFiles.folderId} = ${mediaFolders.id})`,
    })
    .from(mediaFolders)
    .where(conditions)
    .orderBy(asc(mediaFolders.name))
}

export async function findMediaFolderChildren(db: Database, parentId: string | null) {
  const condition = parentId === null
    ? isNull(mediaFolders.parentId)
    : eq(mediaFolders.parentId, parentId)

  return db
    .select({
      id: mediaFolders.id,
      name: mediaFolders.name,
      fileCount: sql<number>`(select count(*) from ${mediaFiles} where ${mediaFiles.folderId} = ${mediaFolders.id})`.mapWith(Number),
    })
    .from(mediaFolders)
    .where(condition)
    .orderBy(asc(mediaFolders.name))
}

export async function findMediaFolderById(db: Database, id: string) {
  const [folder] = await db
    .select()
    .from(mediaFolders)
    .where(eq(mediaFolders.id, id))
    .limit(1)

  return folder ?? null
}

export async function findMediaFolderParent(db: Database, id: string) {
  const [folder] = await db
    .select({ parentId: mediaFolders.parentId, depth: mediaFolders.depth })
    .from(mediaFolders)
    .where(eq(mediaFolders.id, id))
    .limit(1)

  return folder ?? null
}

export async function findMediaFolderByName(db: Database, name: string, parentId: string | null) {
  const [existing] = await db
    .select({ id: mediaFolders.id })
    .from(mediaFolders)
    .where(and(
      eq(mediaFolders.name, name),
      parentId ? eq(mediaFolders.parentId, parentId) : isNull(mediaFolders.parentId)
    ))
    .limit(1)

  return existing ?? null
}

export async function findMediaFolderByNameExcluding(
  db: Database,
  name: string,
  parentId: string | null,
  excludeId: string
) {
  const [existing] = await db
    .select({ id: mediaFolders.id })
    .from(mediaFolders)
    .where(and(
      eq(mediaFolders.name, name),
      parentId ? eq(mediaFolders.parentId, parentId) : isNull(mediaFolders.parentId),
      sql`${mediaFolders.id} != ${excludeId}`
    ))
    .limit(1)

  return existing ?? null
}

export async function createMediaFolder(db: Database, data: NewMediaFolder) {
  const [folder] = await db.insert(mediaFolders).values(data).returning()
  return folder ?? null
}

export async function updateMediaFolder(db: Database, id: string, data: Partial<NewMediaFolder>) {
  const [updated] = await db
    .update(mediaFolders)
    .set(data)
    .where(eq(mediaFolders.id, id))
    .returning()

  return updated ?? null
}

export async function deleteMediaFolder(db: Database, id: string) {
  await db.delete(mediaFolders).where(eq(mediaFolders.id, id))
}

export async function reparentChildFolders(db: Database, folderId: string, newParentId: string | null) {
  return db
    .update(mediaFolders)
    .set({ parentId: newParentId })
    .where(eq(mediaFolders.parentId, folderId))
    .returning({ id: mediaFolders.id })
}

export async function reparentFiles(db: Database, folderId: string, newFolderId: string | null) {
  return db
    .update(mediaFiles)
    .set({ folderId: newFolderId })
    .where(eq(mediaFiles.folderId, folderId))
    .returning({ id: mediaFiles.id })
}

export async function findDescendantFolders(db: Database, parentId: string) {
  return db
    .select({ depth: mediaFolders.depth })
    .from(mediaFolders)
    .where(eq(mediaFolders.parentId, parentId))
}
