import { pgTable, text, integer, boolean, jsonb, index } from "drizzle-orm/pg-core"
import { categories } from "./categories"
import { products } from "./products"
import { createdAtColumn, idColumn, updatedAtColumn } from "./_lib"

export const categoryMetafields = pgTable(
  "category_metafields",
  {
    id: idColumn("category_metafield"),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: text("type", { enum: ["text", "number", "select", "multiselect", "color"] }).notNull(),
    options: jsonb("options"),
    required: boolean("required").notNull().default(false),
    position: integer("position").notNull(),
    createdAt: createdAtColumn(),
  },
  (table) => [index("category_metafields_category_id_idx").on(table.categoryId)]
)

export const productMetafieldValues = pgTable(
  "product_metafield_values",
  {
    id: idColumn("product_metafield_value"),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    metafieldId: text("metafield_id")
      .notNull()
      .references(() => categoryMetafields.id, { onDelete: "cascade" }),
    value: text("value").notNull(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [
    index("product_metafield_values_product_id_idx").on(table.productId),
    index("product_metafield_values_metafield_id_idx").on(table.metafieldId),
  ]
)

export type CategoryMetafield = typeof categoryMetafields.$inferSelect
export type NewCategoryMetafield = typeof categoryMetafields.$inferInsert
export type ProductMetafieldValue = typeof productMetafieldValues.$inferSelect
export type NewProductMetafieldValue = typeof productMetafieldValues.$inferInsert
