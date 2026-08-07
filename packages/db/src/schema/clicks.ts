import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  primaryKey,
  index,
} from "drizzle-orm/pg-core"
import { generateId } from "@adscrush/shared/lib/id"
import { advertisers } from "./advertisers"
import { mediaBuyers } from "./media-buyers"
import { products } from "./products"
import { landingPages } from "./landing-pages"
import { campaigns } from "./campaigns"
import { adAccounts } from "./ad-accounts"
import { creatives } from "./creatives"

/**
 * click events — the core event record of the platform.
 *
 * This table is PARTITIONED BY RANGE (created_at) in production. The pgTable
 * declaration here is for type-safe query building only; the actual DDL is
 * managed by raw SQL in sql/02_partitions.sql (run via db:postinit).
 *
 * The primary key is composite (id, created_at) because Postgres requires
 * unique constraints on partitioned tables to include the partition key.
 * Utility lookups by bare `id` use an additional non-unique index.
 */
export const clicks = pgTable(
  "clicks",
  {
    id: text("id")
      .$defaultFn(() => generateId("click"))
      .notNull(),

    tid: uuid("tid").notNull().unique().$defaultFn(() => crypto.randomUUID()),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 6 })
      .notNull()
      .defaultNow(),

    // Core references
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    mediaBuyerId: text("media_buyer_id")
      .notNull()
      .references(() => mediaBuyers.id, { onDelete: "restrict" }),
    advertiserId: text("advertiser_id")
      .notNull()
      .references(() => advertisers.id, { onDelete: "restrict" }),
    landingPageId: text("landing_page_id").references(() => landingPages.id, {
      onDelete: "set null",
    }),

    // Campaign fields
    campaignId: text("campaign_id").references(() => campaigns.id, {
      onDelete: "set null",
    }),
    funnelId: text("funnel_id"),
    adAccountId: text("ad_account_id").references(() => adAccounts.id, {
      onDelete: "set null",
    }),
    // Snapshot of the ad account's source platform (e.g. facebook, google) at
    // click time, so reporting stays accurate even if the ad account changes.
    sourcePlatform: text("source_platform"),
    source: text("source").notNull().default(""),

    // Marketing attribution (UTM parameters)
    utmSource: text("utm_source"),
    utmMedium: text("utm_medium"),
    utmCampaign: text("utm_campaign"),
    utmTerm: text("utm_term"),
    utmContent: text("utm_content"),

    // Creative attribution
    creativeId: text("creative_id").references(() => creatives.id, {
      onDelete: "set null",
    }),
    creativeName: text("creative_name"), // Snapshot for historical accuracy
    creativeThumbnailUrl: text("creative_thumbnail_url"), // Snapshot for reporting

    // Network / Geo
    ipHash: text("ip_hash"),
    ipEncrypted: text("ip_encrypted"),
    geoCountry: text("geo_country"),
    geoCity: text("geo_city"),
    geoState: text("geo_state"),
    geoAsn: text("geo_asn"),
    geoIsp: text("geo_isp"),

    // Device / Browser
    userAgentEncrypted: text("user_agent_encrypted"),
    deviceType: text("device_type"), // desktop, mobile, tablet, tv, wearable, console, embedded
    deviceVendor: text("device_vendor"), // Apple, Samsung, Google, etc.
    deviceModel: text("device_model"), // iPhone 13, Galaxy S21, iPad Pro, etc.
    os: text("os"),
    osVersion: text("os_version"),
    browser: text("browser"),
    browserVersion: text("browser_version"),
    referer: text("referer"),

    // Affiliate tracking parameters
    affClickId: text("aff_click_id"),
    subAffId: text("sub_aff_id"),
    affSub1: text("aff_sub1"),
    affSub2: text("aff_sub2"),
    affSub3: text("aff_sub3"),
    affSub4: text("aff_sub4"),
    affSub5: text("aff_sub5"),
    affSub6: text("aff_sub6"),
    affSub7: text("aff_sub7"),
    affSub8: text("aff_sub8"),
    affSub9: text("aff_sub9"),
    affSub10: text("aff_sub10"),

    isUnique: boolean("is_unique").notNull().default(false),

    redirectUrl: text("redirect_url"),
  },
  (table) => [
    primaryKey({ columns: [table.id, table.createdAt] }),
    index("clicks_tid_idx").on(table.tid),
    // Hot-path dedup lookup: isUniqueClick(mediaBuyerId, productId, ipHash)
    index("clicks_dedup_idx").on(table.mediaBuyerId, table.productId, table.ipHash, table.createdAt),
    // Reporting / dashboard queries
    index("clicks_product_created_idx").on(table.productId, table.createdAt),
    index("clicks_media_buyer_created_idx").on(table.mediaBuyerId, table.createdAt),
    index("clicks_advertiser_created_idx").on(table.advertiserId, table.createdAt),
    index("clicks_campaign_idx").on(table.campaignId),
    index("clicks_funnel_id_idx").on(table.funnelId),
    index("clicks_ad_account_idx").on(table.adAccountId),
    index("clicks_source_idx").on(table.source),
    index("clicks_source_platform_idx").on(table.sourcePlatform),
    index("clicks_utm_source_idx").on(table.utmSource),
    index("clicks_utm_campaign_idx").on(table.utmCampaign),
    index("clicks_creative_idx").on(table.creativeId),
    index("clicks_geo_country_idx").on(table.geoCountry),
    index("clicks_device_type_idx").on(table.deviceType),
    index("clicks_device_vendor_idx").on(table.deviceVendor),
    index("clicks_os_idx").on(table.os),
    // Partitioned tables can't have bare `id` UNIQUE, so index for lookup
    index("clicks_id_lookup_idx").on(table.id),
  ]
)

export type Click = typeof clicks.$inferSelect
export type NewClick = typeof clicks.$inferInsert
