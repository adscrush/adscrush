import { jsonb, pgTable, text, uniqueIndex, index } from "drizzle-orm/pg-core"
import { employees } from "./employees"
import { users } from "./auth"
import {
  MEDIA_BUYER_KIND,
  MEDIA_BUYER_KIND_VALUES,
  MEDIA_BUYER_STATUS,
  MEDIA_BUYER_STATUS_VALUES,
} from "@adscrush/shared/constants/status"
import type { Permission } from "@adscrush/shared/constants/permissions"
import { createdAtColumn, deletedAtColumn, idColumn, updatedAtColumn } from "./_lib"

export const mediaBuyers = pgTable(
  "media_buyers",
  {
    id: idColumn("media_buyer"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // Discriminates an in-house buyer (an employee who also runs traffic) from
    // an external partner. The single `user.role` enum can't express an
    // employee who is *also* a media buyer, so "is a media buyer" is the
    // existence of this row — not a role value.
    kind: text("kind", { enum: MEDIA_BUYER_KIND_VALUES })
      .notNull()
      .default(MEDIA_BUYER_KIND.EXTERNAL),
    // Set only for `kind = 'internal'`: links the media-buyer hat back to the
    // employee record. `set null` preserves historical attribution (clicks /
    // conversions reference this buyer) if the employee record is removed.
    employeeId: text("employee_id").references(() => employees.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    companyName: text("company_name"),
    email: text("email").notNull().unique(),
    phoneNumber: text("phone_number"),
    country: text("country"),
    trafficSources: text("traffic_sources").array(),
    paymentMethod: text("payment_method"),
    paymentDetails: text("payment_details"),
    accountManagerId: text("account_manager_id").references(() => employees.id, {
      onDelete: "set null",
    }),
    status: text("status", { enum: MEDIA_BUYER_STATUS_VALUES })
      .notNull()
      .default(MEDIA_BUYER_STATUS.ACTIVE),
    internalNotes: text("internal_notes"),
    permissions: jsonb("permissions").$type<Permission[]>().notNull().default([]),
    deletedAt: deletedAtColumn(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [
    uniqueIndex("media_buyers_user_id_idx").on(table.userId),
    // At most one internal buyer profile per employee. Nullable column, so
    // external buyers (employeeId IS NULL) are unaffected in Postgres.
    uniqueIndex("media_buyers_employee_id_idx").on(table.employeeId),
    index("media_buyers_status_idx").on(table.status),
    index("media_buyers_kind_idx").on(table.kind),
    index("media_buyers_account_manager_id_idx").on(table.accountManagerId),
  ]
)

export type MediaBuyer = typeof mediaBuyers.$inferSelect
export type NewMediaBuyer = typeof mediaBuyers.$inferInsert
