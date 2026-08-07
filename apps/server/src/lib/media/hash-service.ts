import { createHash } from "node:crypto"
import type { Database } from "@adscrush/db"
import { eq } from "@adscrush/db/drizzle"
import { mediaFiles, type MediaFile } from "@adscrush/db/schema"

// ─── Constants ───────────────────────────────────────────────────────────────

const HASH_TIMEOUT_MS = 30_000 // 30 seconds

// ─── Service ─────────────────────────────────────────────────────────────────

export class HashService {
  constructor(private db: Database) {}

  /**
   * Computes a SHA-256 hash of the given buffer and returns the hex-encoded string.
   *
   * If the computation exceeds 30 seconds, it throws an error so the caller
   * can proceed with a normal upload and log the failure (per Requirement 8.6).
   */
  computeHash(buffer: Buffer): string {
    const startTime = Date.now()

    const hash = createHash("sha256")
    hash.update(buffer)
    const hex = hash.digest("hex")

    const elapsed = Date.now() - startTime
    if (elapsed > HASH_TIMEOUT_MS) {
      throw new Error(
        `Hash computation exceeded ${HASH_TIMEOUT_MS}ms timeout (took ${elapsed}ms)`,
      )
    }

    return hex
  }

  /**
   * Finds an existing media file with the given content hash.
   * Returns the matching MediaFile record, or null if no duplicate exists.
   */
  async findDuplicate(hash: string): Promise<MediaFile | null> {
    const [existing] = await this.db
      .select()
      .from(mediaFiles)
      .where(eq(mediaFiles.contentHash, hash))
      .limit(1)

    return existing ?? null
  }
}
