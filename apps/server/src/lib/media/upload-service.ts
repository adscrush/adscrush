import type { Database } from "@adscrush/db"
import { eq } from "@adscrush/db/drizzle"
import { mediaFiles, type MediaFile } from "@adscrush/db/schema"
import {
  ALLOWED_MEDIA_MIME_TYPES,
  MAX_MEDIA_FILE_SIZE,
  sanitizeFileName,
  type AllowedMediaMimeType,
} from "@adscrush/shared/validators/media.schema"
import type { StorageClient } from "~/lib/storage/storage"
import type { CDNClient } from "~/lib/storage/cdn"
import type { HashService } from "./hash-service"
import { logger } from "~/lib/logger"

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface UploadInput {
  file: Buffer
  fileName: string
  mimeType: string
  folderId?: string | null
  userId: string
  tags?: string[]
}

export interface UploadResult {
  mediaFile: MediaFile
  isDuplicate: boolean
}

// ─── Validation Helpers ──────────────────────────────────────────────────────

const MAX_FILE_NAME_LENGTH = 255

function validateUploadInput(input: UploadInput): void {
  input.fileName = sanitizeFileName(input.fileName)

  if (!ALLOWED_MEDIA_MIME_TYPES.includes(input.mimeType as AllowedMediaMimeType)) {
    throw new UploadValidationError(
      `Unsupported file type. Supported: ${ALLOWED_MEDIA_MIME_TYPES.join(", ")}`,
    )
  }

  if (input.file.length > MAX_MEDIA_FILE_SIZE) {
    throw new UploadValidationError("File size exceeds the 500 MB limit")
  }

  if (input.file.length === 0) {
    throw new UploadValidationError("File is empty")
  }

  if (input.fileName.length > MAX_FILE_NAME_LENGTH) {
    throw new UploadValidationError(
      `File name exceeds the maximum length of ${MAX_FILE_NAME_LENGTH} characters`,
    )
  }

  if (input.fileName.length === 0) {
    throw new UploadValidationError("File name is required")
  }
}

function validateCdnUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === "https:"
  } catch {
    return false
  }
}

// ─── Error Classes ───────────────────────────────────────────────────────────

export class UploadValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "UploadValidationError"
  }
}

export class UploadStorageError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "UploadStorageError"
  }
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class UploadService {
  constructor(
    private storage: StorageClient,
    private cdn: CDNClient,
    private hashService: HashService,
    private db: Database,
  ) {}

  async upload(input: UploadInput): Promise<UploadResult> {
    validateUploadInput(input)

    let contentHash: string
    try {
      contentHash = this.hashService.computeHash(input.file)
    } catch {
      contentHash = `fallback-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`
    }

    const existingFile = await this.hashService.findDuplicate(contentHash)

    if (existingFile) {
      return { mediaFile: existingFile, isDuplicate: true }
    }

    const prefix = "media"
    let storagePath: string
    let fileSize: number

    try {
      const result = await this.storage.upload(
        prefix,
        input.fileName,
        new Uint8Array(input.file),
        input.mimeType,
      )
      storagePath = result.storagePath
      fileSize = result.fileSize
    } catch (error) {
      throw new UploadStorageError(
        `Storage upload failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      )
    }

    let cdnUrl: string | null = null
    const rawCdnUrl = this.cdn.buildUrl(storagePath)

    if (rawCdnUrl && validateCdnUrl(rawCdnUrl)) {
      cdnUrl = rawCdnUrl
    }

    let mediaFile: MediaFile
    try {
      const [inserted] = await this.db
        .insert(mediaFiles)
        .values({
          name: input.fileName,
          mimeType: input.mimeType,
          fileSize,
          storagePath,
          contentHash,
          cdnUrl,
          folderId: input.folderId ?? null,
          uploadedBy: input.userId,
          tags: input.tags ? input.tags.map((t) => t.toLowerCase()) : [],
        })
        .returning()

      if (!inserted) {
        await this.cleanupStorage(storagePath)
        throw new UploadStorageError("Failed to insert media file record")
      }

      mediaFile = inserted
    } catch (error) {
      if (error instanceof UploadStorageError) throw error
      await this.cleanupStorage(storagePath)
      throw new UploadStorageError(
        `Database insert failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      )
    }

    return { mediaFile, isDuplicate: false }
  }

  async replace(fileId: string, input: UploadInput): Promise<MediaFile> {
    validateUploadInput(input)

    const [existingFile] = await this.db
      .select()
      .from(mediaFiles)
      .where(eq(mediaFiles.id, fileId))
      .limit(1)

    if (!existingFile) {
      throw new UploadValidationError("File not found")
    }

    let contentHash: string
    try {
      contentHash = this.hashService.computeHash(input.file)
    } catch {
      contentHash = `fallback-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`
    }

    const prefix = "media"
    let storagePath: string
    let fileSize: number

    try {
      const result = await this.storage.upload(
        prefix,
        input.fileName,
        new Uint8Array(input.file),
        input.mimeType,
      )
      storagePath = result.storagePath
      fileSize = result.fileSize
    } catch (error) {
      throw new UploadStorageError(
        `Storage upload failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      )
    }

    let cdnUrl: string | null = null
    const rawCdnUrl = this.cdn.buildUrl(storagePath)

    if (rawCdnUrl && validateCdnUrl(rawCdnUrl)) {
      cdnUrl = rawCdnUrl
    }

    const oldStoragePath = existingFile.storagePath

    const [updatedFile] = await this.db
      .update(mediaFiles)
      .set({
        name: input.fileName,
        mimeType: input.mimeType,
        fileSize,
        storagePath,
        contentHash,
        cdnUrl,
      })
      .where(eq(mediaFiles.id, fileId))
      .returning()

    if (!updatedFile) {
      await this.cleanupStorage(storagePath)
      throw new UploadStorageError("Failed to update media file record")
    }

    void this.cleanupStorage(oldStoragePath)

    return updatedFile
  }

  async delete(fileId: string, _userId: string): Promise<void> {
    const [existingFile] = await this.db
      .select()
      .from(mediaFiles)
      .where(eq(mediaFiles.id, fileId))
      .limit(1)

    if (!existingFile) {
      throw new UploadValidationError("File not found")
    }

    await this.db
      .delete(mediaFiles)
      .where(eq(mediaFiles.id, fileId))

    void this.cleanupStorage(existingFile.storagePath)
  }

  // ─── Private Helpers ─────────────────────────────────────────────────────────

  private async cleanupStorage(storagePath: string): Promise<void> {
    try {
      await this.storage.delete(storagePath)
    } catch (error) {
      logger({ module: "UploadService", storagePath }).error(
        "Failed to clean up storage path",
        { error: error instanceof Error ? error.message : String(error) },
      )
    }
  }
}
