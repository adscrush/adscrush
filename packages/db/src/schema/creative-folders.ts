import { pgTable, text, index, foreignKey } from "drizzle-orm/pg-core"
import { products } from "./products"
import { createdAtColumn, idColumn, updatedAtColumn } from "./_lib"

export const creativeFolders = pgTable(
  "creative_folders",
  {
    id: idColumn("folder"),
    name: text("name").notNull(),
    parentId: text("parent_id"),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [
    foreignKey({ columns: [table.parentId], foreignColumns: [table.id] }).onDelete("set null"),
    index("folders_product_id_idx").on(table.productId),
    index("folders_parent_id_idx").on(table.parentId),
  ]
)

export type CreativeFolder = typeof creativeFolders.$inferSelect
export type NewCreativeFolder = typeof creativeFolders.$inferInsert
