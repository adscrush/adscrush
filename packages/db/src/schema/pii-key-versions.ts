import { pgTable, text, boolean } from "drizzle-orm/pg-core"
import { createdAtColumn, idColumn } from "./_lib"

/**
 * Metadata tracking PII encryption key versions.
 *
 * The actual AES-256-GCM key material lives in the secrets manager or env
 * (never in the DB). This table tracks which key version was active at a
 * given time so that data encrypted under an old key can be re-encrypted
 * during key rotation. `PII_MASTER_KEY` env var provides the current key;
 * historical values are stored in a secure backup (not this table).
 */
export const piiKeyVersions = pgTable("pii_key_versions", {
  id: idColumn("pii_key_version"),
  keyVersion: text("key_version").notNull().unique(),
  active: boolean("active").notNull().default(false),
  activatedAt: createdAtColumn(),
  retiredAt: createdAtColumn(),
})

export type PiiKeyVersion = typeof piiKeyVersions.$inferSelect
export type NewPiiKeyVersion = typeof piiKeyVersions.$inferInsert
