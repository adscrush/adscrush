import { pgTable, text, index, uniqueIndex } from "drizzle-orm/pg-core"
import { products } from "./products"
import { LANDING_PAGE_STATUS, LANDING_PAGE_STATUS_VALUES } from "@adscrush/shared/constants/status"
import { createdAtColumn, deletedAtColumn, idColumn, updatedAtColumn } from "./_lib"

export const funnels = pgTable(
  "funnels",
  {
    id: idColumn("funnel"),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    language: text("language").notNull().default("en"),
    domain: text("domain"),
    // The single funnel-level page shown to the visitor (was "white page").
    pageUrl: text("page_url"),
    thankYouPageUrl: text("thank_you_page_url"),
    status: text("status", { enum: LANDING_PAGE_STATUS_VALUES })
      .notNull()
      .default(LANDING_PAGE_STATUS.ACTIVE),
    deletedAt: deletedAtColumn(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [
    index("funnels_product_id_idx").on(table.productId),
    index("funnels_status_idx").on(table.status),
    uniqueIndex("funnels_product_language_unique_idx").on(table.productId, table.language),
  ]
)

export type Funnel = typeof funnels.$inferSelect
export type NewFunnel = typeof funnels.$inferInsert
