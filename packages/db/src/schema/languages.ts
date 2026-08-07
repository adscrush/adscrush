import { pgTable, text, uniqueIndex } from "drizzle-orm/pg-core"
import { createdAtColumn, deletedAtColumn, idColumn, updatedAtColumn } from "./_lib"

export const languages = pgTable(
  "languages",
  {
    id: idColumn("language"),
    name: text("name").notNull(),
    code: text("code").notNull(),
    deletedAt: deletedAtColumn(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [uniqueIndex("languages_code_idx").on(table.code)]
)

export type Language = typeof languages.$inferSelect
export type NewLanguage = typeof languages.$inferInsert
