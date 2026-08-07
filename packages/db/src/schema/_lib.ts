import { text, timestamp, numeric } from "drizzle-orm/pg-core"
import { generateId } from "@adscrush/shared/lib/id"

/**
 * Shared column builders enforcing project-wide conventions.
 *
 * Conventions:
 *  - All timestamps are `timestamptz` (UTC, microsecond precision). Global
 *    traffic makes timezone-aware timestamps mandatory — a bare `timestamp`
 *    is ambiguous and a known source of dedup/window bugs.
 *  - All monetary values are `numeric(12,4)`. 12 digits total, 4 fractional
 *    for sub-cent payout/revenue resolution. Defined once so we never drift
 *    to `numeric(10,4)` / `decimal(12,2)` / etc.
 *  - All primary keys are prefixed, lexicographically-sortable text IDs via
 *    `generateId`. Prefixed IDs are debuggable in logs and URL-safe.
 *  - Soft-delete (`deleted_at`) on business entities; NULL = active. Event
 *    tables (clicks/conversions) are append-only and never soft-deleted.
 */

export const idColumn = (prefix: Parameters<typeof generateId>[0]) =>
  text("id")
    .primaryKey()
    .$defaultFn(() => generateId(prefix))

export const createdAtColumn = () =>
  timestamp("created_at", { withTimezone: true, precision: 6 })
    .notNull()
    .defaultNow()

export const updatedAtColumn = () =>
  timestamp("updated_at", { withTimezone: true, precision: 6 })
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date())

export const deletedAtColumn = () =>
  timestamp("deleted_at", { withTimezone: true, precision: 6 })

export const moneyColumn = (name: string) =>
  numeric(name, { precision: 12, scale: 4 })
