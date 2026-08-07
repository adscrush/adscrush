import { pgTable, text, integer, index } from "drizzle-orm/pg-core"
import { advertisers } from "./advertisers"
import { categories } from "./categories"
import { PRODUCT_STATUS, PRODUCT_STATUS_VALUES, PRODUCT_VISIBILITY_VALUES } from "@adscrush/shared/constants/status"
import { createdAtColumn, deletedAtColumn, idColumn, moneyColumn, updatedAtColumn } from "./_lib"

export const products = pgTable(
  "products",
  {
    id: idColumn("product"),
    advertiserId: text("advertiser_id")
      .notNull()
      .references(() => advertisers.id, { onDelete: "cascade" }),
    categoryId: text("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    image: text("image"),
    description: text("description"),
    privateNote: text("private_note"),
    status: text("status", { enum: PRODUCT_STATUS_VALUES }).notNull().default(PRODUCT_STATUS.ACTIVE),
    visibility: text("visibility", { enum: PRODUCT_VISIBILITY_VALUES }).notNull().default("public"),
    dailyCap: integer("daily_cap"),
    totalCap: integer("total_cap"),
    quantity: integer("quantity").default(0),
    price: moneyColumn("price"),
    compareAtPrice: moneyColumn("compare_at_price"),
    costPerItem: moneyColumn("cost_per_item"),
    // Default monetization terms (moved off the removed `offers` layer). Each
    // conversion still records its own revenue/payout; these are the defaults
    // used for valuation/reporting when a conversion omits an amount.
    revenueType: text("revenue_type").notNull().default("CPA"),
    defaultRevenue: moneyColumn("default_revenue").notNull().default("0"),
    payoutType: text("payout_type").notNull().default("CPA"),
    defaultPayout: moneyColumn("default_payout").notNull().default("0"),
    currency: text("currency").notNull().default("USD"),
    deletedAt: deletedAtColumn(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [index("products_advertiser_id_idx").on(table.advertiserId)]
)

export type Product = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert
