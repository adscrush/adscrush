import { pgTable, text, integer, uniqueIndex, index } from "drizzle-orm/pg-core"
import { products } from "./products"
import { mediaBuyers } from "./media-buyers"
import { advertisers } from "./advertisers"
import { campaigns } from "./campaigns"
import { idColumn, moneyColumn } from "./_lib"

/**
 * Pre-aggregated daily rollup for dashboard / reporting queries.
 *
 * One row per (product_id, media_buyer_id, advertiser_id, campaign_id, date).
 * Refreshed by a scheduled job (worker). Avoids expensive GROUP BY on raw
 * partitioned event tables for common reporting queries.
 */
export const dailyStats = pgTable(
  "daily_stats",
  {
    id: idColumn("daily_stat"),

    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    mediaBuyerId: text("media_buyer_id")
      .notNull()
      .references(() => mediaBuyers.id, { onDelete: "cascade" }),
    advertiserId: text("advertiser_id")
      .notNull()
      .references(() => advertisers.id, { onDelete: "cascade" }),
    campaignId: text("campaign_id").references(() => campaigns.id, {
      onDelete: "set null",
    }),

    date: text("date").notNull(),

    clicks: integer("clicks").notNull().default(0),
    uniqueClicks: integer("unique_clicks").notNull().default(0),
    conversions: integer("conversions").notNull().default(0),
    pendingConversions: integer("pending_conversions").notNull().default(0),
    approvedConversions: integer("approved_conversions").notNull().default(0),
    rejectedConversions: integer("rejected_conversions").notNull().default(0),

    revenue: moneyColumn("revenue").notNull().default("0"),
    payout: moneyColumn("payout").notNull().default("0"),
    profit: moneyColumn("profit").notNull().default("0"),
  },
  (table) => [
    uniqueIndex("daily_stats_unique_idx").on(
      table.productId,
      table.mediaBuyerId,
      table.advertiserId,
      table.campaignId,
      table.date
    ),
    index("daily_stats_product_date_idx").on(table.productId, table.date),
    index("daily_stats_media_buyer_date_idx").on(table.mediaBuyerId, table.date),
    index("daily_stats_advertiser_date_idx").on(table.advertiserId, table.date),
    index("daily_stats_campaign_date_idx").on(table.campaignId, table.date),
  ]
)

export type DailyStat = typeof dailyStats.$inferSelect
export type NewDailyStat = typeof dailyStats.$inferInsert
