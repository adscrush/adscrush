import type { Database } from "@adscrush/db"
import { throwNotFound, throwInternalError, throwBadRequest } from "~/lib/helpers/errors"
import { validateUploadUrl, MAX_UPLOAD_RESPONSE_BYTES } from "~/lib/url-validation"
import { UploadService } from "~/lib/media/upload-service"
import { HashService } from "~/lib/media/hash-service"
import { StorageClient, CDNClient, StorageRegion } from "~/lib/storage"
import { env } from "~/env"
import type { AllowedMediaMimeType } from "./media.types"
import { ALLOWED_MEDIA_MIME_TYPES } from "./media.types"
import * as repository from "./media.repository"

const MIME_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/avif": "avif",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
  "application/pdf": "pdf",
  "font/woff": "woff",
  "font/woff2": "woff2",
  "font/ttf": "ttf",
  "font/otf": "otf",
}

function createStorageClient() {
  return new StorageClient({
    region: StorageRegion[env.BUNNY_STORAGE_REGION as keyof typeof StorageRegion] ?? StorageRegion.Falkenstein,
    storageZone: env.BUNNY_STORAGE_ZONE,
    apiKey: env.BUNNY_STORAGE_API_KEY,
  })
}

function createCDNClient() {
  return new CDNClient({
    apiKey: env.BUNNY_STORAGE_API_KEY,
    pullZoneUrl: env.BUNNY_CDN_URL,
  })
}

function deriveFileNameFromUrl(url: string, contentType: string): string {
  let base = "file"
  try {
    const parsed = new URL(url)
    const last = parsed.pathname.split("/").filter(Boolean).pop()
    if (last) base = decodeURIComponent(last)
  } catch {
    // fall back to "file"
  }
  base = (base.split("?")[0] ?? base).split("#")[0] ?? base
  let name =
    base
      .replace(/[^a-zA-Z0-9._\-\s]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 200) || "file"
  if (!/\.[a-zA-Z0-9]+$/.test(name)) {
    name = `${name}.${MIME_EXTENSION[contentType] ?? "bin"}`
  }
  return name
}

/** Maximum redirects for upload-from-URL. */
const MAX_REDIRECTS = 10

// ─── List ───────────────────────────────────────────────────────────────────

export async function listMediaFiles(db: Database, options: Parameters<typeof repository.findMediaFiles>[1]) {
  return repository.findMediaFiles(db, options)
}

export async function getMediaFileById(db: Database, id: string) {
  const file = await repository.findMediaFileById(db, id)
  if (!file) throwNotFound("Media file")
  return file
}

export async function searchMediaFiles(db: Database, query: string, pageSize: number, cursor?: string | null) {
  return repository.searchMediaFiles(db, query, pageSize, cursor)
}

// ─── Upload ─────────────────────────────────────────────────────────────────

export async function uploadMedia(db: Database, userId: string, input: { file: string; fileName: string; mimeType: string; folderId?: string | null; tags?: string[] }) {
  const storage = createStorageClient()
  const cdn = createCDNClient()
  const hashService = new HashService(db)
  const uploadService = new UploadService(storage, cdn, hashService, db)

  const fileBuffer = Buffer.from(input.file, "base64")

  return uploadService.upload({
    file: fileBuffer,
    fileName: input.fileName,
    mimeType: input.mimeType,
    folderId: input.folderId ?? null,
    userId,
    tags: input.tags,
  })
}

export async function uploadFromUrl(db: Database, userId: string, url: string, folderId?: string | null, tags?: string[]) {
  // SSRF protection: validate URL before fetching
  let validatedUrl: URL
  try {
    validatedUrl = await validateUploadUrl(url)
  } catch (err) {
    throwBadRequest(err instanceof Error ? err.message : "Invalid upload URL")
  }

  // Fetch with safety limits
  let currentUrl = validatedUrl!.href
  let redirectCount = 0
  let response: Response

  do {
    try {
      response = await fetch(currentUrl, {
        redirect: "manual",
        signal: AbortSignal.timeout(30_000),
      })
    } catch {
      throwBadRequest("Could not fetch the provided URL")
    }

    if (response!.status >= 300 && response!.status < 400) {
      const location = response!.headers.get("location")
      if (!location) {
        throwBadRequest("Redirect with no Location header")
      }
      if (++redirectCount > MAX_REDIRECTS) {
        throwBadRequest("Too many redirects")
      }
      try {
        const resolvedUrl = new URL(location, currentUrl)
        await validateUploadUrl(resolvedUrl.href)
        currentUrl = resolvedUrl.href
      } catch (err) {
        throwBadRequest(err instanceof Error ? err.message : "Invalid redirect target")
      }
    }
  } while (response!.status >= 300 && response!.status < 400)

  if (!response!.ok) {
    throwBadRequest(`Failed to fetch URL (status ${response!.status})`)
  }

  // Validate content type
  const contentType =
    (response!.headers.get("content-type") ?? "").split(";")[0]?.trim().toLowerCase() ?? ""
  if (!(ALLOWED_MEDIA_MIME_TYPES as readonly string[]).includes(contentType)) {
    throwBadRequest(`Unsupported file type: ${contentType || "unknown"}`)
  }

  // Stream response body with size limiting
  const contentLength = response!.headers.get("content-length")
  if (contentLength && Number(contentLength) > MAX_UPLOAD_RESPONSE_BYTES) {
    throwBadRequest("File exceeds the maximum allowed size")
  }

  const chunks: Uint8Array[] = []
  let totalBytes = 0
  const reader = response!.body?.getReader()
  if (!reader) {
    throwBadRequest("Response body is not readable")
  }

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      totalBytes += value.byteLength
      if (totalBytes > MAX_UPLOAD_RESPONSE_BYTES) {
        reader.cancel()
        throwBadRequest("File exceeds the maximum allowed size")
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }

  const fileBuffer = Buffer.concat(chunks)
  if (fileBuffer.byteLength === 0) {
    throwBadRequest("The URL returned an empty file")
  }

  const storage = createStorageClient()
  const cdn = createCDNClient()
  const hashService = new HashService(db)
  const uploadService = new UploadService(storage, cdn, hashService, db)

  return uploadService.upload({
    file: fileBuffer,
    fileName: deriveFileNameFromUrl(url, contentType),
    mimeType: contentType as AllowedMediaMimeType,
    folderId: folderId ?? null,
    userId,
    tags,
  })
}

export async function replaceMedia(db: Database, userId: string, fileId: string, file: string, fileName: string, mimeType: string) {
  const storage = createStorageClient()
  const cdn = createCDNClient()
  const hashService = new HashService(db)
  const uploadService = new UploadService(storage, cdn, hashService, db)

  const fileBuffer = Buffer.from(file, "base64")

  return uploadService.replace(fileId, {
    file: fileBuffer,
    fileName,
    mimeType,
    userId,
  })
}

export async function deleteMedia(db: Database, userId: string, fileId: string) {
  const storage = createStorageClient()
  const cdn = createCDNClient()
  const hashService = new HashService(db)
  const uploadService = new UploadService(storage, cdn, hashService, db)

  await uploadService.delete(fileId, userId)
  return { success: true }
}

// ─── Move ───────────────────────────────────────────────────────────────────

export async function moveMediaFile(db: Database, fileId: string, folderId: string | null) {
  const file = await repository.findMediaFileById(db, fileId)
  if (!file) throwNotFound("Media file")

  const updated = await repository.updateMediaFile(db, fileId, { folderId })
  if (!updated) throwInternalError("Failed to move file")
  return updated
}

export async function moveMediaFiles(db: Database, fileIds: string[], targetFolderId: string | null) {
  // Validate target folder exists
  if (targetFolderId !== null) {
    const folder = await repository.findMediaFolderById(db, targetFolderId)
    if (!folder) throwNotFound("Target folder")
  }

  const results: { fileId: string; success: boolean; error?: string }[] = []

  for (const fileId of fileIds) {
    try {
      await repository.updateMediaFile(db, fileId, { folderId: targetFolderId })
      results.push({ fileId, success: true })
    } catch (error) {
      results.push({
        fileId,
        success: false,
        error: error instanceof Error ? error.message : "Failed to move file",
      })
    }
  }

  const successCount = results.filter((r) => r.success).length
  const failureCount = results.filter((r) => !r.success).length

  return { results, successCount, failureCount }
}

// ─── Tags ───────────────────────────────────────────────────────────────────

export async function addTags(db: Database, fileId: string, tags: string[]) {
  const file = await repository.findMediaFileTags(db, fileId)
  if (!file) throwNotFound("Media file")

  const normalizedTags = tags.map((t) => t.toLowerCase().trim())
  const existingTags = new Set((file.tags ?? []).map((t) => t.toLowerCase()))
  const mergedTags = [...existingTags, ...normalizedTags.filter((t) => !existingTags.has(t))]

  await repository.updateMediaFile(db, fileId, { tags: mergedTags })
  return { success: true }
}

export async function removeTags(db: Database, fileId: string, tags: string[]) {
  const file = await repository.findMediaFileTags(db, fileId)
  if (!file) throwNotFound("Media file")

  const normalizedTags = tags.map((t) => t.toLowerCase().trim())
  const removeSet = new Set(normalizedTags)
  const remaining = (file.tags ?? []).filter((t) => !removeSet.has(t.toLowerCase()))

  await repository.updateMediaFile(db, fileId, { tags: remaining.length > 0 ? remaining : [] })
  return { success: true }
}

// ─── Bulk Delete ────────────────────────────────────────────────────────────

export async function deleteFiles(db: Database, fileIds: string[]) {
  const storage = createStorageClient()

  const deleted: string[] = []
  const failed: Array<{ id: string; error: string }> = []

  for (const fileId of fileIds) {
    try {
      const file = await repository.findMediaFileById(db, fileId)
      if (!file) {
        failed.push({ id: fileId, error: "File not found" })
        continue
      }

      await repository.deleteMediaFile(db, fileId)

      // Schedule async storage deletion
      void (async () => {
        try {
          await storage.delete(file.storagePath)
        } catch {
          // Log but don't fail
        }
      })()

      deleted.push(fileId)
    } catch (error) {
      failed.push({
        id: fileId,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  return { deleted, failed }
}

// ─── Orphan Detection ───────────────────────────────────────────────────────

export async function scanOrphans(db: Database) {
  const storage = createStorageClient()
  const { OrphanDetector } = await import("~/lib/media/orphan-detector")
  const orphanDetector = new OrphanDetector(db, storage)
  return orphanDetector.scan()
}

export async function deleteOrphans(db: Database, fileIds: string[]) {
  const storage = createStorageClient()
  const { OrphanDetector } = await import("~/lib/media/orphan-detector")
  const orphanDetector = new OrphanDetector(db, storage)
  return orphanDetector.deleteOrphans(fileIds, "admin")
}
