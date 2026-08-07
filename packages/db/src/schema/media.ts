import { pgTable, text, integer, bigint, index, uniqueIndex, foreignKey } from "drizzle-orm/pg-core"
import { users } from "./auth"
import { createdAtColumn, idColumn, updatedAtColumn } from "./_lib"

export const mediaFolders = pgTable(
  "media_folders",
  {
    id: idColumn("media_folder"),
    name: text("name").notNull(),
    parentId: text("parent_id"),
    depth: integer("depth").notNull().default(0),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [
    foreignKey({ columns: [table.parentId], foreignColumns: [table.id] }).onDelete("set null"),
    index("media_folders_parent_id_idx").on(table.parentId),
    uniqueIndex("media_folders_name_parent_idx").on(table.name, table.parentId),
  ]
)

export const mediaFiles = pgTable(
  "media_files",
  {
    id: idColumn("media_file"),
    name: text("name").notNull(),
    mimeType: text("mime_type").notNull(),
    fileSize: bigint("file_size", { mode: "number" }).notNull(),
    width: integer("width"),
    height: integer("height"),
    cdnUrl: text("cdn_url"),
    storagePath: text("storage_path").notNull(),
    contentHash: text("content_hash").notNull(),
    folderId: text("folder_id").references(() => mediaFolders.id, { onDelete: "set null" }),
    uploadedBy: text("uploaded_by")
      .notNull()
      .references(() => users.id),
    tags: text("tags").array().default([]).notNull(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [
    index("media_files_folder_id_idx").on(table.folderId),
    index("media_files_content_hash_idx").on(table.contentHash),
    index("media_files_mime_type_idx").on(table.mimeType),
    index("media_files_created_at_idx").on(table.createdAt),
  ]
)

export type MediaFolder = typeof mediaFolders.$inferSelect
export type NewMediaFolder = typeof mediaFolders.$inferInsert
export type MediaFile = typeof mediaFiles.$inferSelect
export type NewMediaFile = typeof mediaFiles.$inferInsert
