import type { Database } from "@adscrush/db"
import { and, eq, isNull, lt, sql } from "@adscrush/db/drizzle"
import { mediaFiles, creativeFiles, productMedia, type MediaFile } from "@adscrush/db/schema"
import type { StorageClient } from "../storage/storage"

// ─── Constants ───────────────────────────────────────────────────────────────

const ORPHAN_GRACE_PERIOD_MS = 24 * 60 * 60 * 1000 // 24 hours

// ─── Service ─────────────────────────────────────────────────────────────────

export class OrphanDetector {
  constructor(
    private db: Database,
    private storage: StorageClient,
  ) {}

  /**
   * Scans all media files and identifies orphans — files not referenced
   * by any creative_files or product_media record, excluding files uploaded within the last 24 hours.
   */
  async scan(): Promise<{ orphans: MediaFile[]; totalScanned: number }> {
    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(mediaFiles)

    const totalScanned = countResult?.count ?? 0

    const cutoffDate = new Date(Date.now() - ORPHAN_GRACE_PERIOD_MS)

    const orphans = await this.db
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
        createdAt: mediaFiles.createdAt,
        updatedAt: mediaFiles.updatedAt,
      })
      .from(mediaFiles)
      .leftJoin(creativeFiles, eq(mediaFiles.id, creativeFiles.mediaFileId))
      .leftJoin(productMedia, eq(mediaFiles.id, productMedia.mediaFileId))
      .where(
        and(
          lt(mediaFiles.createdAt, cutoffDate),
          isNull(creativeFiles.id),
          isNull(productMedia.id),
        ),
      )
      .groupBy(mediaFiles.id)

    return { orphans: orphans as MediaFile[], totalScanned }
  }

  /**
   * Deletes orphaned files by removing them from Bunny.net storage and hard-deleting
   * the database record. Continues on individual failures and returns results.
   */
  async deleteOrphans(
    fileIds: string[],
    _userId: string,
  ): Promise<{
    deleted: string[]
    failed: Array<{ id: string; error: string }>
  }> {
    const deleted: string[] = []
    const failed: Array<{ id: string; error: string }> = []

    for (const fileId of fileIds) {
      try {
        const [file] = await this.db
          .select()
          .from(mediaFiles)
          .where(eq(mediaFiles.id, fileId))
          .limit(1)

        if (!file) {
          failed.push({ id: fileId, error: "File not found" })
          continue
        }

        await this.storage.delete(file.storagePath)

        await this.db.delete(mediaFiles).where(eq(mediaFiles.id, fileId))

        deleted.push(fileId)
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error"
        failed.push({ id: fileId, error: message })
      }
    }

    return { deleted, failed }
  }
}
