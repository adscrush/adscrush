import { pgTable, text, boolean, integer, timestamp } from "drizzle-orm/pg-core"
import { users } from "./auth"
import { creativeFolders } from "./creative-folders"
import { createdAtColumn, idColumn } from "./_lib"

export const shareLinks = pgTable(
  "share_links",
  {
    id: idColumn("share_link"),
    token: text("token").unique().notNull(),
    folderId: text("folder_id")
      .notNull()
      .references(() => creativeFolders.id, { onDelete: "cascade" }),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id),
    expiresAt: timestamp("expires_at", { withTimezone: true, precision: 6 }),
    maxDownloads: integer("max_downloads"),
    downloadCount: integer("download_count").notNull().default(0),
    passwordHash: text("password_hash"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: createdAtColumn(),
  }
)

export type ShareLink = typeof shareLinks.$inferSelect
export type NewShareLink = typeof shareLinks.$inferInsert
