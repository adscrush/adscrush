import { type creativeFolders } from "@adscrush/db/schema"
import type { Database } from "@adscrush/db"
import { throwNotFound, throwInternalError, throwBadRequest, throwForbidden } from "~/lib/helpers/errors"
import type { AdvertiserScope } from "~/lib/helpers/scope"
import * as repository from "./creative-folders.repository"

export async function listCreativeFolders(
  db: Database,
  productId: string,
  parentId?: string | null,
  flat?: boolean,
  scope?: AdvertiserScope,
  advertiserId?: string
) {
  // Check advertiser access if scoped
  if (scope && !scope.isAllAdvertisers && advertiserId) {
    if (!scope.advertiserIds.includes(advertiserId)) {
      throwForbidden("Access denied")
    }
  }

  const folders = await repository.findCreativeFolders(db, productId, parentId)

  if (flat) {
    return folders
  }

  // Build tree structure
  const rootFolders = folders.filter((f) => f.parentId === null)
  const childFolders = folders.filter((f) => f.parentId !== null)

  type FolderWithChildren = typeof folders[number] & { children?: FolderWithChildren[] }
  function buildTree(parents: FolderWithChildren[]): FolderWithChildren[] {
    return parents.map((parent) => {
      const children = buildTree(childFolders.filter((c) => c.parentId === parent.id) as FolderWithChildren[])
      return { ...parent, children: children.length > 0 ? children : undefined }
    })
  }

  return buildTree(rootFolders)
}

export async function getCreativeFolderById(db: Database, id: string) {
  const folder = await repository.findCreativeFolderById(db, id)
  if (!folder) throwNotFound("Folder")
  return folder
}

export async function createCreativeFolder(db: Database, data: typeof creativeFolders.$inferInsert) {
  const folder = await repository.createCreativeFolder(db, data)
  if (!folder) throwInternalError("Failed to create folder")
  return folder
}

export async function updateCreativeFolder(db: Database, id: string, data: Partial<typeof creativeFolders.$inferInsert>) {
  // Prevent self-referencing
  if (data.parentId === id) {
    throwBadRequest("A folder cannot be its own parent")
  }

  const updated = await repository.updateCreativeFolder(db, id, data)
  if (!updated) throwNotFound("Folder")
  return updated
}

export async function deleteCreativeFolder(db: Database, id: string, recursive: boolean) {
  if (!recursive) {
    // Check for children
    const child = await repository.findChildFolders(db, id)
    if (child) {
      throwBadRequest("Folder has subfolders. Use recursive=true or move them first.")
    }

    // Check for creatives
    const creative = await repository.findCreativesInFolder(db, id)
    if (creative) {
      throwBadRequest("Folder has creatives. Move them first or use recursive=true.")
    }
  }

  if (recursive) {
    await repository.unassignCreativesFromFolder(db, id)
    await repository.deleteChildFolders(db, id)
  }

  const deleted = await repository.deleteCreativeFolder(db, id)
  if (!deleted) throwNotFound("Folder")

  return { success: true }
}

export async function getBreadcrumb(db: Database, folderId: string) {
  const crumbs: { id: string; name: string }[] = []
  let currentId: string | null = folderId

  while (currentId) {
    const folder = await repository.findCreativeFolderById(db, currentId)
    if (!folder) break
    crumbs.unshift({ id: folder.id, name: folder.name })
    currentId = folder.parentId
  }

  return crumbs
}
