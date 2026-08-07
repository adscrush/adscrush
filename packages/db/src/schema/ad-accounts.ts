import { pgTable, text, date, index, uniqueIndex } from "drizzle-orm/pg-core"
import { mediaBuyers } from "./media-buyers"
import { AD_ACCOUNT_STATUS, AD_ACCOUNT_STATUS_VALUES } from "@adscrush/shared/constants/status"
import { createdAtColumn, deletedAtColumn, idColumn, moneyColumn, updatedAtColumn } from "./_lib"

export const adAccounts = pgTable(
  "ad_accounts",
  {
    id: idColumn("ad_account"),
    name: text("name").notNull(),
    sourcePlatform: text("source_platform").notNull(),
    accountId: text("account_id").notNull(),
    mediaBuyerId: text("media_buyer_id").references(() => mediaBuyers.id, {
      onDelete: "set null",
    }),
    status: text("status", { enum: AD_ACCOUNT_STATUS_VALUES })
      .notNull()
      .default(AD_ACCOUNT_STATUS.ACTIVE),
    deletedAt: deletedAtColumn(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [
    uniqueIndex("ad_accounts_platform_account_unique_idx").on(
      table.sourcePlatform,
      table.accountId
    ),
    index("ad_accounts_status_idx").on(table.status),
    index("ad_accounts_media_buyer_id_idx").on(table.mediaBuyerId),
  ]
)

export const adAccountSpend = pgTable(
  "ad_account_spend",
  {
    id: idColumn("ad_account_spend"),
    adAccountId: text("ad_account_id")
      .notNull()
      .references(() => adAccounts.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    spend: moneyColumn("spend").notNull(),
    createdAt: createdAtColumn(),
  },
  (table) => [
    uniqueIndex("ad_account_spend_unique_idx").on(table.adAccountId, table.date),
  ]
)

export type AdAccount = typeof adAccounts.$inferSelect
export type NewAdAccount = typeof adAccounts.$inferInsert
export type AdAccountSpend = typeof adAccountSpend.$inferSelect
export type NewAdAccountSpend = typeof adAccountSpend.$inferInsert
