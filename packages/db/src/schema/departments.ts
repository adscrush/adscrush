import { pgTable, text, uniqueIndex } from "drizzle-orm/pg-core"
import { createdAtColumn, deletedAtColumn, idColumn, updatedAtColumn } from "./_lib"

export const departments = pgTable(
  "departments",
  {
    id: idColumn("department"),
    name: text("name").notNull().unique(),
    description: text("description"),
    status: text("status", { enum: ["active", "inactive"] })
      .notNull()
      .default("active"),
    deletedAt: deletedAtColumn(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [uniqueIndex("departments_name_idx").on(table.name)]
)

export type Department = typeof departments.$inferSelect
export type NewDepartment = typeof departments.$inferInsert
