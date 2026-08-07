import {
  pgTable,
  text,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core"
import { generateId } from "@adscrush/shared/lib/id"
import {
  LEAD_STATUS,
  LEAD_STATUS_VALUES,
} from "@adscrush/shared/constants/status"
import { mediaBuyers } from "./media-buyers"
import { products } from "./products"
import { advertisers } from "./advertisers"
import { campaigns } from "./campaigns"
import { moneyColumn } from "./_lib"

/**
 * Lead records — submitted via postback API from landing pages or external servers.
 *
 * Each lead is attributed to a click (via clickId + tid) and inherits product,
 * campaign, media buyer, and advertiser from the click. Lead details
 * (name, phone, email) are stored directly for quick access.
 *
 * Phone and email are stored as plaintext with normalized/hash variants for
 * search and dedup. Masking happens at the API response level.
 *
 * Note: clickId is a logical reference — no hard FK to clicks because clicks
 * is a partitioned table with composite PK (id, created_at). The tid column
 * stores the public tracking ID for direct lookups.
 */
export const leads = pgTable(
  "leads",
  {
    id: text("id")
      .$defaultFn(() => generateId("lead"))
      .primaryKey(),

    // Attribution — logical reference to clicks (no hard FK due to partitioning)
    clickId: text("click_id").notNull(),
    tid: text("tid").notNull(), // Public tracking ID for direct lookups

    // Core references (denormalized from click for fast queries)
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    mediaBuyerId: text("media_buyer_id")
      .notNull()
      .references(() => mediaBuyers.id, { onDelete: "restrict" }),
    advertiserId: text("advertiser_id")
      .notNull()
      .references(() => advertisers.id, { onDelete: "restrict" }),
    campaignId: text("campaign_id").references(() => campaigns.id, {
      onDelete: "set null",
    }),

    // Lead details — plaintext for display, with normalized variants for search
    name: text("name"),
    phone: text("phone"),
    phoneNormalized: text("phone_normalized"), // Digits only for dedup/search
    email: text("email"),
    emailNormalized: text("email_normalized"), // Lowercase trimmed for dedup/search

    // Address & location details
    address: text("address"),
    pincode: text("pincode"),
    city: text("city"),
    state: text("state"),

    // Flexible sub-fields for custom data (e.g. Sub1-Sub5)
    sub1: text("sub1"),
    sub2: text("sub2"),
    sub3: text("sub3"),
    sub4: text("sub4"),
    sub5: text("sub5"),

    // Financial
    payout: moneyColumn("payout").notNull().default("0"),
    currency: text("currency").notNull().default("USD"),

    // Status
    status: text("status", { enum: LEAD_STATUS_VALUES })
      .notNull()
      .default(LEAD_STATUS.PENDING),

    // Source tracking
    method: text("method", { enum: ["postback", "api", "pixel", "s2s"] })
      .notNull()
      .default("postback"),
    referrerUrl: text("referrer_url"),

    // Network / Device (copied from click for quick access without joins)
    ipHash: text("ip_hash"),
    ipEncrypted: text("ip_encrypted"),
    geoCountry: text("geo_country"),
    userAgentEncrypted: text("user_agent_encrypted"),

    // Status audit trail — who changed the status and when
    statusUpdatedAt: timestamp("status_updated_at", { withTimezone: true, precision: 6 }),
    statusUpdatedBy: text("status_updated_by"), // Hash of API key for attribution
    rejectionReason: text("rejection_reason"), // Why the lead was rejected

    createdAt: timestamp("created_at", { withTimezone: true, precision: 6 })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // One lead per click — enforced at DB level
    uniqueIndex("leads_click_id_unique").on(table.clickId),
    index("leads_tid_idx").on(table.tid),
    index("leads_product_created_idx").on(table.productId, table.createdAt),
    index("leads_media_buyer_created_idx").on(table.mediaBuyerId, table.createdAt),
    index("leads_advertiser_created_idx").on(table.advertiserId, table.createdAt),
    index("leads_campaign_idx").on(table.campaignId),
    index("leads_status_idx").on(table.status),
    index("leads_phone_normalized_idx").on(table.phoneNormalized),
    index("leads_email_normalized_idx").on(table.emailNormalized),
  ]
)

export type Lead = typeof leads.$inferSelect
export type NewLead = typeof leads.$inferInsert
