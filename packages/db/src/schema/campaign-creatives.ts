import { pgTable, text, integer, uniqueIndex, index } from "drizzle-orm/pg-core"
import { campaigns } from "./campaigns"
import { creatives } from "./creatives"
import { createdAtColumn, idColumn } from "./_lib"

export const campaignCreatives = pgTable(
  "campaign_creatives",
  {
    id: idColumn("campaign_creative"),
    campaignId: text("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    creativeId: text("creative_id")
      .notNull()
      .references(() => creatives.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAtColumn(),
  },
  (table) => [
    uniqueIndex("campaign_creatives_campaign_creative_unique_idx").on(
      table.campaignId,
      table.creativeId
    ),
    index("campaign_creatives_campaign_id_idx").on(table.campaignId),
    index("campaign_creatives_creative_id_idx").on(table.creativeId),
  ]
)

export type CampaignCreative = typeof campaignCreatives.$inferSelect
export type NewCampaignCreative = typeof campaignCreatives.$inferInsert
