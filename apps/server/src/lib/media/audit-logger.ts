import type { Database } from "@adscrush/db"

export type AuditAction = "upload" | "upload_reuse" | "replace" | "delete" | "move" | "tag"

export interface AuditEntry {
  userId: string
  fileId: string
  action: AuditAction
  metadata?: Record<string, unknown>
}

/**
 * No-op audit logger — the media_audit_logs table has been removed.
 * Kept as a stub to avoid breaking callers until they are migrated.
 */
export class AuditLogger {
  constructor(_db: Database) {}

  async log(_entry: AuditEntry): Promise<void> {
    // Audit logging disabled — table removed
  }
}
