import { deriveFileType } from "~/lib/storage"
import { UploadService } from "~/lib/media/upload-service"
import { HashService } from "~/lib/media/hash-service"
import { guessMimeType } from "@adscrush/shared/constants/media"
import { creativeFiles } from "@adscrush/db/schema"
import { type CREATIVE_STATUS_VALUES } from "@adscrush/shared/constants/status"
import type { Database } from "@adscrush/db"
import type { ListCreativesInput } from "./creatives.types"
import * as repository from "./creatives.repository"
import { createStorageClient, createCDNClient, throwNotFound, throwInternalError } from "~/lib/helpers"

// ─── Helper: Add file metadata to creative ───────────────────────────────────

function enrichCreativeWithFiles(
  creative: { id: string; name: string; productId: string; folderId: string | null; altText: string | null; tags: string[] | null; status: (typeof CREATIVE_STATUS_VALUES)[number]; createdAt: Date; updatedAt: Date },
  files: Array<{ id: string; creativeId: string; mediaFileId: string | null; fileType: string | null; cdnUrl: string | null; thumbnailUrl: string | null; fileSize: number | null; width: number | null; height: number | null; duration: number | null; mimeType: string | null; originalFileName: string | null; sortOrder: number; createdAt: Date }>
) {
  const firstFile = files.length > 0 ? files[0] : null

  return {
    ...creative,
    fileType: firstFile?.fileType ?? null,
    cdnUrl: firstFile?.cdnUrl ?? null,
    thumbnailUrl: firstFile?.thumbnailUrl ?? null,
    fileSize: firstFile?.fileSize ?? null,
    width: firstFile?.width ?? null,
    height: firstFile?.height ?? null,
    duration: firstFile?.duration ?? null,
    mimeType: firstFile?.mimeType ?? null,
    originalFileName: firstFile?.originalFileName ?? null,
    files,
  }
}

// ─── Query Operations ────────────────────────────────────────────────────────

export async function listCreatives(
  db: Database,
  input: ListCreativesInput,
  scope: { isAllAdvertisers: boolean; advertiserIds: string[] }
) {
  const { items, countResult } = await repository.findCreatives(db, input, scope)

  // Batch fetch creativeFiles for the returned creatives
  const creativeIds = items.map((i) => i.id)
  const allFiles = await repository.findCreativeFilesByIds(db, creativeIds)

  // Group files by creativeId
  const fileMap = new Map<string, typeof allFiles>()
  for (const file of allFiles) {
    const existing = fileMap.get(file.creativeId)
    if (existing) {
      existing.push(file)
    } else {
      fileMap.set(file.creativeId, [file])
    }
  }

  const result = items.map((item) => {
    const files = fileMap.get(item.id) ?? []
    return enrichCreativeWithFiles(item, files)
  })

  return {
    items: result,
    pageCount: Math.ceil(Number(countResult[0]?.count ?? 0) / input.perPage),
    total: Number(countResult[0]?.count ?? 0),
  }
}

export async function getCreativeById(db: Database, id: string) {
  const creative = await repository.findCreativeById(db, id)

  if (!creative) {
    throwNotFound("Creative")
  }

  const files = await repository.findCreativeFiles(db, id)

  return enrichCreativeWithFiles(creative, files)
}

// ─── Mutation Operations ─────────────────────────────────────────────────────

export async function uploadCreative(
  db: Database,
  user: { id: string },
  input: {
    name: string
    productId: string
    folderId?: string
    file: string
    fileName: string
    mimeType?: string
    altText?: string
    tags?: string[]
  }
) {
  const storage = createStorageClient()
  const cdn = createCDNClient()
  const hashService = new HashService(db)
  const uploadService = new UploadService(storage, cdn, hashService, db)

  const mimeType = input.mimeType ?? guessMimeType(input.fileName)
  const fileBuffer = Buffer.from(input.file, "base64")

  // 1. Upload via UploadService (handles duplicate detection, hashing, storage)
  const { mediaFile } = await uploadService.upload({
    file: fileBuffer,
    fileName: input.fileName,
    mimeType,
    userId: user.id,
  })

  // 2. Insert creative record
  const creative = await repository.createCreative(db, {
    name: input.name,
    productId: input.productId,
    folderId: input.folderId,
    altText: input.altText,
    tags: input.tags,
  })

  if (!creative) {
    throwInternalError("Failed to create creative")
  }

  // 3. Insert creativeFiles record linking creative to media file
  await db.insert(creativeFiles).values({
    creativeId: creative.id,
    mediaFileId: mediaFile.id,
    fileType: deriveFileType(mimeType),
    mimeType,
    cdnUrl: mediaFile.cdnUrl,
    fileSize: fileBuffer.length,
    originalFileName: input.fileName,
    sortOrder: 0,
  })

  return creative
}

export async function createCreative(
  db: Database,
  input: {
    name: string
    productId: string
    folderId?: string
    altText?: string
    tags?: string[]
    status?: "active" | "inactive"
    mediaFileId?: string
    cdnUrl?: string
    mimeType?: string
    fileType?: string
    fileSize?: number
    thumbnailUrl?: string
  }
) {
  const creative = await repository.createCreativeWithFile(db, input)

  if (!creative) {
    throwInternalError("Failed to create creative")
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
    status?: "active" | "inactive"
  }
) {
  const updated = await repository.updateCreative(db, id, data)

  if (!updated) {
    throwNotFound("Creative")
  }

  return updated
}

export async function deleteCreative(db: Database, id: string) {
  const existing = await repository.findCreativeById(db, id)

  if (!existing) {
    throwNotFound("Creative")
  }

  // Cascade delete handles creativeFiles deletion
  const deleted = await repository.deleteCreative(db, id)

  if (!deleted) {
    throwInternalError("Failed to delete creative")
  }

  return { success: true }
}

export async function moveToFolder(db: Database, creativeId: string, folderId: string | null) {
  const updated = await repository.updateCreative(db, creativeId, { folderId })

  if (!updated) {
    throwNotFound("Creative")
  }

  return updated
}

export async function bulkMoveToFolder(db: Database, creativeIds: string[], folderId: string | null) {
  return repository.bulkMoveToFolder(db, creativeIds, folderId)
}

// ─── Notes Operations ────────────────────────────────────────────────────────

export async function addNote(db: Database, creativeId: string, note: string) {
  return repository.createNote(db, creativeId, note)
}

export async function updateNote(db: Database, id: string, note: string) {
  const updated = await repository.updateNote(db, id, note)

  if (!updated) {
    throwNotFound("Note")
  }

  return updated
}

export async function deleteNote(db: Database, id: string) {
  return repository.deleteNote(db, id)
}

// ─── Performance Tags Operations ─────────────────────────────────────────────

export async function setPerformanceTag(db: Database, creativeId: string, performed: boolean) {
  return repository.setPerformanceTag(db, creativeId, performed)
}
