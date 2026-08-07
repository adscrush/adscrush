/**
 * Audit logging helper.
 *
 * Logs mutations on domain entities to the append-only audit_log table.
 * Sensitive columns (passwords, PII) should be redacted before passing to
 * this helper.
 *
 * Usage:
 *   await auditLog(ctx.db, {
 *     actorUserId: ctx.user.id,
 *     action: "user.create",
 *     entityType: "user",
 *     entityId: createdUser.id,
 *     after: { name: createdUser.name, role: createdUser.role },
 *   })
 */

import type { Database } from "@adscrush/db"
import { auditLog as auditLogTable } from "@adscrush/db/schema"
import { generateId } from "@adscrush/shared/lib/id"
import { logger } from "~/lib/logger"

export interface AuditLogEntry {
  actorUserId?: string | null
  action: string
  entityType: string
  entityId: string
  before?: Record<string, unknown> | null
  after?: Record<string, unknown> | null
  requestIp?: string | null
  requestId?: string | null
}

/**
 * Write an audit log entry. This is fire-and-forget — failures are logged
 * but never thrown, so downstream operations are never blocked by audit.
 */
export async function writeAuditLog(
  db: Database,
  entry: AuditLogEntry,
): Promise<void> {
  try {
    await db.insert(auditLogTable).values({
      id: generateId("audit_log"),
      actorUserId: entry.actorUserId ?? null,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      before: entry.before ? JSON.parse(JSON.stringify(entry.before)) : null,
      after: entry.after ? JSON.parse(JSON.stringify(entry.after)) : null,
      requestIp: entry.requestIp ?? null,
      requestId: entry.requestId ?? null,
    })
  } catch (err) {
    logger({ module: "audit" }).error("Failed to write audit log entry", {
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      err: err instanceof Error ? err.message : String(err),
    })
  }
}
