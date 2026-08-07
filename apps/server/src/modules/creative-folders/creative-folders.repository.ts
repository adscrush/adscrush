import { and, asc, eq, isNull, sql } from "@adscrush/db/drizzle"
import { creativeFolders, creatives } from "@adscrush/db/schema"
import type { Database } from "@adscrush/db"

export async function findCreativeFolders(
  db: Database,
  productId: string,
  parentId?: string | null
) {
  const conditions = and(
    eq(creativeFolders.productId, productId),
    parentId !== undefined
      ? (parentId === null ? isNull(creativeFolders.parentId) : eq(creativeFolders.parentId, parentId))
      : undefined
  )

  return db
    .select({
      id: creativeFolders.id,
      name: creativeFolders.name,
      parentId: creativeFolders.parentId,
      productId: creativeFolders.productId,
      createdAt: creativeFolders.createdAt,
      updatedAt: creativeFolders.updatedAt,
      creativeCount: sql<number>`(select count(*) from ${creatives} where ${creatives.folderId} = ${creativeFolders.id})`,
    })
    .from(creativeFolders)
    .where(conditions)
    .orderBy(asc(creativeFolders.name))
}

export async function findCreativeFolderById(db: Database, id: string) {
  const [folder] = await db
    .select({
      id: creativeFolders.id,
      name: creativeFolders.name,
      parentId: creativeFolders.parentId,
      productId: creativeFolders.productId,
      createdAt: creativeFolders.createdAt,
      updatedAt: creativeFolders.updatedAt,
    })
    .from(creativeFolders)
    .where(eq(creativeFolders.id, id))
    .limit(1)

  return folder ?? null
}

export async function createCreativeFolder(db: Database, data: typeof creativeFolders.$inferInsert) {
  const [folder] = await db.insert(creativeFolders).values(data).returning()
  return folder ?? null
}

export async function updateCreativeFolder(db: Database, id: string, data: Partial<typeof creativeFolders.$inferInsert>) {
  const [updated] = await db
    .update(creativeFolders)
    .set(data)
    .where(eq(creativeFolders.id, id))
    .returning()

  return updated ?? null
}

export async function deleteCreativeFolder(db: Database, id: string) {
  const [deleted] = await db.delete(creativeFolders).where(eq(creativeFolders.id, id)).returning()
  return deleted ?? null
}

export async function findChildFolders(db: Database, parentId: string) {
  return db
    .select({ id: creativeFolders.id })
    .from(creativeFolders)
    .where(eq(creativeFolders.parentId, parentId))
    .limit(1)
}

export async function findCreativesInFolder(db: Database, folderId: string) {
  return db
    .select({ id: creatives.id })
    .from(creatives)
    .where(eq(creatives.folderId, folderId))
    .limit(1)
}

export async function deleteChildFolders(db: Database, parentId: string) {
  await db.delete(creativeFolders).where(eq(creativeFolders.parentId, parentId))
}

export async function unassignCreativesFromFolder(db: Database, folderId: string) {
  await db
    .update(creatives)
    .set({ folderId: null })
    .where(eq(creatives.folderId, folderId))
}
