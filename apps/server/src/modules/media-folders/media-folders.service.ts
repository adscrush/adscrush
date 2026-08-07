import type { Database } from "@adscrush/db"
import { throwNotFound, throwInternalError, throwBadRequest, throwConflict } from "~/lib/helpers/errors"
import * as repository from "./media-folders.repository"

const MAX_FOLDER_DEPTH = 10

export async function listMediaFolders(db: Database, parentId?: string | null) {
  return repository.findMediaFolders(db, parentId)
}

export async function listMediaFolderChildren(db: Database, parentId: string | null) {
  return repository.findMediaFolderChildren(db, parentId)
}

export async function createMediaFolder(db: Database, name: string, parentId: string | null, userId: string) {
  let depth = 0

  if (parentId) {
    const parent = await repository.findMediaFolderParent(db, parentId)
    if (!parent) throwNotFound("Parent folder")
    depth = parent.depth + 1

    if (depth > MAX_FOLDER_DEPTH) {
      throwBadRequest(`Maximum folder depth of ${MAX_FOLDER_DEPTH} levels reached`)
    }
  }

  // Check for duplicate name
  const existing = await repository.findMediaFolderByName(db, name, parentId)
  if (existing) {
    throwConflict(`A folder named '${name}' already exists here`)
  }

  const folder = await repository.createMediaFolder(db, {
    name,
    parentId: parentId ?? null,
    depth,
    createdBy: userId,
  })

  if (!folder) throwInternalError("Failed to create folder")
  return folder
}

export async function renameMediaFolder(db: Database, folderId: string, name: string) {
  const current = await repository.findMediaFolderParent(db, folderId)
  if (!current) throwNotFound("Folder")

  // Check for duplicate name
  const existing = await repository.findMediaFolderByNameExcluding(db, name, current.parentId, folderId)
  if (existing) {
    throwConflict(`A folder named '${name}' already exists here`)
  }

  const updated = await repository.updateMediaFolder(db, folderId, { name })
  if (!updated) throwNotFound("Folder")
  return updated
}

export async function moveMediaFolder(db: Database, folderId: string, newParentId: string | null) {
  // Prevent moving to self
  if (folderId === newParentId) {
    throwBadRequest("Cannot move a folder into itself")
  }

  const folder = await repository.findMediaFolderById(db, folderId)
  if (!folder) throwNotFound("Folder")

  // Check for circular reference
  if (newParentId) {
    let currentId: string | null = newParentId
    while (currentId) {
      if (currentId === folderId) {
        throwBadRequest("Cannot move a folder into its own subfolder")
      }
      const parent = await repository.findMediaFolderParent(db, currentId)
      currentId = parent?.parentId ?? null
    }
  }

  // Calculate new depth
  let newDepth = 0
  if (newParentId) {
    const newParent = await repository.findMediaFolderParent(db, newParentId)
    if (!newParent) throwNotFound("Target folder")
    newDepth = newParent.depth + 1
  }

  // Check max depth for descendants
  const descendants = await repository.findDescendantFolders(db, folderId)
  const maxDescendantDepth = descendants.reduce((max, d) => Math.max(max, d.depth), folder.depth)
  const depthDiff = newDepth - folder.depth

  if (maxDescendantDepth + depthDiff > MAX_FOLDER_DEPTH) {
    throwBadRequest(`Maximum folder depth of ${MAX_FOLDER_DEPTH} levels reached`)
  }

  const updated = await repository.updateMediaFolder(db, folderId, { parentId: newParentId, depth: newDepth })
  if (!updated) throwNotFound("Folder")
  return updated
}

export async function deleteMediaFolder(db: Database, folderId: string) {
  const folder = await repository.findMediaFolderParent(db, folderId)
  if (!folder) throwNotFound("Folder")

  // Reparent children to parent
  const reparentedFolders = await repository.reparentChildFolders(db, folderId, folder.parentId)
  const reparentedFiles = await repository.reparentFiles(db, folderId, folder.parentId)

  // Delete the folder
  await repository.deleteMediaFolder(db, folderId)

  return {
    success: true,
    reparentedCount: reparentedFolders.length + reparentedFiles.length,
    reparentedFolders: reparentedFolders.length,
    reparentedFiles: reparentedFiles.length,
  }
}
