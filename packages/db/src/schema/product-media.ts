import { pgTable, text, integer, index } from "drizzle-orm/pg-core"
import { products } from "./products"
import { mediaFiles } from "./media"
import { createdAtColumn, idColumn } from "./_lib"

export const productMedia = pgTable(
  "product_media",
  {
    id: idColumn("product_media"),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    mediaFileId: text("media_file_id").references(() => mediaFiles.id, {
      onDelete: "set null",
    }),
    url: text("url").notNull(),
    type: text("type", { enum: ["image", "video", "3d-model"] }).notNull(),
    position: integer("position").notNull(),
    createdAt: createdAtColumn(),
  },
  (table) => [
    index("product_media_product_id_idx").on(table.productId),
    index("product_media_media_file_id_idx").on(table.mediaFileId),
  ]
)

export type ProductMedia = typeof productMedia.$inferSelect
export type NewProductMedia = typeof productMedia.$inferInsert
