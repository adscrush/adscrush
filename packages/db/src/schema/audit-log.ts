import { pgTable, text, jsonb, timestamp, primaryKey, index } from "drizzle-orm/pg-core"
import { generateId } from "@adscrush/shared/lib/id"

/**
 * Append-only audit log for tracking all mutations on domain entities.
 *
 * Partitioned BY RANGE (created_at) alongside clicks/conversions.
 * INSERT-only by convention (enforced by DB role — `app_writer` has INSERT
 * but not UPDATE/DELETE on this table). See sql/02_partitions.sql for DDL.
 *
 * The `before` and `after` JSONB snapshots capture the full row state.
 * Sensitive columns (PII, password hashes) are either omitted or pre-redacted
 * before storage.
 */
export const auditLog = pgTable(
  "audit_log",
  {
    id: text("id")
      .$defaultFn(() => generateId("audit_log"))
      .notNull(),

    actorUserId: text("actor_user_id"),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    before: jsonb("before"),
    after: jsonb("after"),
    requestIp: text("request_ip"),
    requestId: text("request_id"),

    createdAt: timestamp("created_at", { withTimezone: true, precision: 6 })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.id, table.createdAt] }),
    index("audit_log_entity_idx").on(table.entityType, table.entityId, table.createdAt),
    index("audit_log_actor_idx").on(table.actorUserId, table.createdAt),
    index("audit_log_action_idx").on(table.action, table.createdAt),
  ]
)

export type AuditLog = typeof auditLog.$inferSelect
export type NewAuditLog = typeof auditLog.$inferInsert
