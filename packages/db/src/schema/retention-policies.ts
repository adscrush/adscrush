import { pgTable, text, integer } from "drizzle-orm/pg-core"
import { createdAtColumn, idColumn, updatedAtColumn } from "./_lib"

/**
 * Per-entity data retention policy for GDPR compliance.
 *
 * Controls how long raw PII fields are retained before being scrubbed,
 * and how long the aggregate row is kept before deletion.
 */
export const retentionPolicies = pgTable("retention_policies", {
  id: idColumn("retention_policy"),
  entityType: text("entity_type").notNull().unique(),
  piiRetentionDays: integer("pii_retention_days").notNull().default(90),
  rowRetentionDays: integer("row_retention_days").notNull().default(365),
  description: text("description"),
  createdAt: createdAtColumn(),
  updatedAt: updatedAtColumn(),
})

export type RetentionPolicy = typeof retentionPolicies.$inferSelect
export type NewRetentionPolicy = typeof retentionPolicies.$inferInsert
