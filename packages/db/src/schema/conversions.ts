import {
  pgTable,
  text,
  timestamp,
  boolean,
  primaryKey,
  index,
} from "drizzle-orm/pg-core"
import { generateId } from "@adscrush/shared/lib/id"
import {
  CONVERSION_STATUS,
  CONVERSION_STATUS_VALUES,
} from "@adscrush/shared/constants/status"
import { mediaBuyers } from "./media-buyers"
import { products } from "./products"
import { advertisers } from "./advertisers"
import { campaigns } from "./campaigns"
import { adAccounts } from "./ad-accounts"
import { creatives } from "./creatives"
import { moneyColumn } from "./_lib"

/**
 * conversion events — attributed to a click, product, and media buyer.
 *
 * Partitioned BY RANGE (created_at) alongside clicks. No hard FK to clicks
 * because the partitioned table's PK constraint includes created_at; the
 * click relationship is a logical reference enforced at the app layer via
 * the tid_lookup sidecar. See sql/02_partitions.sql for the actual DDL.
 */
export const conversions = pgTable(
  "conversions",
  {
    id: text("id")
      .$defaultFn(() => generateId("conversion"))
      .notNull(),

    clickId: text("click_id").notNull(),

    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    mediaBuyerId: text("media_buyer_id")
      .notNull()
      .references(() => mediaBuyers.id, { onDelete: "restrict" }),
    advertiserId: text("advertiser_id")
      .notNull()
      .references(() => advertisers.id, { onDelete: "restrict" }),

    // Campaign fields
    campaignId: text("campaign_id").references(() => campaigns.id, {
      onDelete: "set null",
    }),
    adAccountId: text("ad_account_id").references(() => adAccounts.id, {
      onDelete: "set null",
    }),

    // Creative attribution (copied from click)
    creativeId: text("creative_id").references(() => creatives.id, {
      onDelete: "set null",
    }),
    creativeName: text("creative_name"), // Snapshot for historical accuracy
    creativeThumbnailUrl: text("creative_thumbnail_url"), // Snapshot for reporting

    event: text("event").notNull().default("conversion"),

    payout: moneyColumn("payout").notNull().default("0"),
    revenue: moneyColumn("revenue").notNull().default("0"),
    saleAmount: moneyColumn("sale_amount"),
    currency: text("currency").notNull().default("USD"),

    status: text("status", { enum: CONVERSION_STATUS_VALUES })
      .notNull()
      .default(CONVERSION_STATUS.PENDING),

    isDuplicate: boolean("is_duplicate").notNull().default(false),

    method: text("method", { enum: ["pixel", "iframe", "s2s", "postback"] })
      .notNull()
      .default("pixel"),

    postbackUrl: text("postback_url"),
    referrerUrl: text("referrer_url"),

    ipEncrypted: text("ip_encrypted"),
    userAgentEncrypted: text("user_agent_encrypted"),

    advSub1: text("adv_sub1"),
    advSub2: text("adv_sub2"),
    advSub3: text("adv_sub3"),
    advSub4: text("adv_sub4"),
    advSub5: text("adv_sub5"),

    coupon: text("coupon"),

    createdAt: timestamp("created_at", { withTimezone: true, precision: 6 })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.id, table.createdAt] }),
    index("conversions_click_idx").on(table.clickId, table.createdAt),
    index("conversions_product_created_idx").on(table.productId, table.createdAt),
    index("conversions_media_buyer_created_idx").on(table.mediaBuyerId, table.createdAt),
    index("conversions_advertiser_created_idx").on(table.advertiserId, table.createdAt),
    index("conversions_status_idx").on(table.status),
    index("conversions_campaign_idx").on(table.campaignId),
    index("conversions_creative_idx").on(table.creativeId),
    index("conversions_ad_account_idx").on(table.adAccountId),
    // Partial index for dedup: conversions with same (clickId, event) where not already dup
    index("conversions_id_lookup_idx").on(table.id),
  ]
)

export type Conversion = typeof conversions.$inferSelect
export type NewConversion = typeof conversions.$inferInsert
