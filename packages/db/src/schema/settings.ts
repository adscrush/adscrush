import { pgTable, text } from "drizzle-orm/pg-core"
import { createdAtColumn, idColumn, updatedAtColumn } from "./_lib"

export const settings = pgTable("settings", {
  id: idColumn("setting"),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  createdAt: createdAtColumn(),
  updatedAt: updatedAtColumn(),
})

export type Setting = typeof settings.$inferSelect
export type NewSetting = typeof settings.$inferInsert
