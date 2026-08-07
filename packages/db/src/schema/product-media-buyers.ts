import { pgTable, text, uniqueIndex, timestamp } from "drizzle-orm/pg-core"
import { products } from "./products"
import { mediaBuyers } from "./media-buyers"
import { users } from "./auth"
import {
  PRODUCT_MEDIA_BUYER_STATUS,
  PRODUCT_MEDIA_BUYER_STATUS_VALUES,
} from "@adscrush/shared/constants/status"
import { createdAtColumn, idColumn, moneyColumn } from "./_lib"

export const productMediaBuyers = pgTable(
  "product_media_buyers",
  {
    id: idColumn("product_media_buyer"),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    mediaBuyerId: text("media_buyer_id")
      .notNull()
      .references(() => mediaBuyers.id, { onDelete: "cascade" }),
    status: text("status", { enum: PRODUCT_MEDIA_BUYER_STATUS_VALUES })
      .notNull()
      .default(PRODUCT_MEDIA_BUYER_STATUS.PENDING),
    customPayout: moneyColumn("custom_payout"),
    customRevenue: moneyColumn("custom_revenue"),
    approvedAt: timestamp("approved_at", { withTimezone: true, precision: 6 }),
    approvedBy: text("approved_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: createdAtColumn(),
  },
  (table) => [
    uniqueIndex("product_media_buyer_idx").on(table.productId, table.mediaBuyerId),
  ]
)

export type ProductMediaBuyer = typeof productMediaBuyers.$inferSelect
export type NewProductMediaBuyer = typeof productMediaBuyers.$inferInsert
