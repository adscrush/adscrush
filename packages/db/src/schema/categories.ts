import { pgTable, text } from "drizzle-orm/pg-core"
import { createdAtColumn, deletedAtColumn, idColumn, updatedAtColumn } from "./_lib"

export const categories = pgTable("categories", {
  id: idColumn("category"),
  name: text("name").notNull().unique(),
  description: text("description"),
  deletedAt: deletedAtColumn(),
  createdAt: createdAtColumn(),
  updatedAt: updatedAtColumn(),
})

export type Category = typeof categories.$inferSelect
export type NewCategory = typeof categories.$inferInsert
