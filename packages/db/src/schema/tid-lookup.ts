import { pgTable, text, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core"
import { idColumn } from "./_lib"

/**
 * Sidecar table mapping click `tid` (UUID) → click `id` for O(1) lookups.
 *
 * Partitioned event tables can't have a UNIQUE constraint on `tid` alone
 * (Postgres requires partition key in unique constraints), so we maintain
 * this small unpartitioned table for the conversion dedup / attribution path.
 * This table is write-amplified once per click and Redis-cached for reads.
 */
export const tidLookup = pgTable(
  "tid_lookup",
  {
    id: idColumn("tid_lookup"),
    tid: text("tid").notNull().unique(),
    clickId: text("click_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 6 })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("tid_lookup_tid_idx").on(table.tid),
    index("tid_lookup_click_id_idx").on(table.clickId),
  ]
)

export type TidLookup = typeof tidLookup.$inferSelect
export type NewTidLookup = typeof tidLookup.$inferInsert
