import { pgTable, text, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core"
import { products } from "./products"
import { funnels } from "./funnels"
import { adAccounts } from "./ad-accounts"
import { mediaBuyers } from "./media-buyers"
import { CAMPAIGN_STATUS, CAMPAIGN_STATUS_VALUES } from "@adscrush/shared/constants/status"
import { createdAtColumn, deletedAtColumn, idColumn, updatedAtColumn } from "./_lib"

export const campaigns = pgTable(
  "campaigns",
  {
    id: idColumn("campaign"),
    name: text("name").notNull(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    funnelId: text("funnel_id").references(() => funnels.id, {
      onDelete: "set null",
    }),
    status: text("status", { enum: CAMPAIGN_STATUS_VALUES }).notNull().default(CAMPAIGN_STATUS.ACTIVE),
    startDate: timestamp("start_date", { withTimezone: true, precision: 6 }),
    endDate: timestamp("end_date", { withTimezone: true, precision: 6 }),
    internalNotes: text("internal_notes"),
    // Set for campaigns created by a media buyer through the portal. Lets the
    // buyer manage "their" campaigns even before any ad account is linked
    // (and powers creator-scoped edit permission). `set null` preserves the
    // campaign record if the buyer's profile is removed.
    createdByMediaBuyerId: text("created_by_media_buyer_id").references(() => mediaBuyers.id, {
      onDelete: "set null",
    }),
    deletedAt: deletedAtColumn(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [
    index("campaigns_product_id_idx").on(table.productId),
    index("campaigns_funnel_id_idx").on(table.funnelId),
    index("campaigns_status_idx").on(table.status),
    index("campaigns_created_by_media_buyer_id_idx").on(table.createdByMediaBuyerId),
  ]
)

export const campaignAdAccounts = pgTable(
  "campaign_ad_accounts",
  {
    id: idColumn("campaign"),
    campaignId: text("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    adAccountId: text("ad_account_id")
      .notNull()
      .references(() => adAccounts.id, { onDelete: "cascade" }),
    trackingLink: text("tracking_link").notNull(),
    createdAt: createdAtColumn(),
  },
  (table) => [uniqueIndex("campaign_ad_account_unique_idx").on(table.campaignId, table.adAccountId)]
)

export type Campaign = typeof campaigns.$inferSelect
export type NewCampaign = typeof campaigns.$inferInsert
export type CampaignAdAccount = typeof campaignAdAccounts.$inferSelect
export type NewCampaignAdAccount = typeof campaignAdAccounts.$inferInsert
