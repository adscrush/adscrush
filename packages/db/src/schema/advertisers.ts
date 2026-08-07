import { pgTable, text, integer, uniqueIndex, index } from "drizzle-orm/pg-core"
import { employees } from "./employees"
import { users } from "./auth"
import {
  ADVERTISER_STATUS,
  ADVERTISER_STATUS_VALUES,
} from "@adscrush/shared/constants/status"
import { createdAtColumn, deletedAtColumn, idColumn, updatedAtColumn } from "./_lib"

export const advertisers = pgTable(
  "advertisers",
  {
    id: idColumn("advertiser"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    companyName: text("company_name"),
    email: text("email").notNull().unique(),
    phoneNumber: text("phone_number"),
    website: text("website"),
    country: text("country"),
    billingAddress: text("billing_address"),
    paymentTermsDays: integer("payment_terms_days"),
    accountManagerId: text("account_manager_id").references(() => employees.id, {
      onDelete: "set null",
    }),
    status: text("status", { enum: ADVERTISER_STATUS_VALUES })
      .notNull()
      .default(ADVERTISER_STATUS.ACTIVE),
    internalNotes: text("internal_notes"),
    deletedAt: deletedAtColumn(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [
    uniqueIndex("advertisers_user_id_idx").on(table.userId),
    index("advertisers_status_idx").on(table.status),
    index("advertisers_account_manager_id_idx").on(table.accountManagerId),
  ]
)

export type Advertiser = typeof advertisers.$inferSelect
export type NewAdvertiser = typeof advertisers.$inferInsert
