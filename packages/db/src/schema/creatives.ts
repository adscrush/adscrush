import { pgTable, text, integer, boolean, index } from "drizzle-orm/pg-core"
import { products } from "./products"
import { mediaBuyers } from "./media-buyers"
import { creativeFolders } from "./creative-folders"
import { mediaFiles } from "./media"
import { CREATIVE_STATUS, CREATIVE_STATUS_VALUES } from "@adscrush/shared/constants/status"
import { createdAtColumn, deletedAtColumn, idColumn, updatedAtColumn } from "./_lib"

export const creatives = pgTable(
  "creatives",
  {
    id: idColumn("creative"),
    name: text("name").notNull(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    folderId: text("folder_id").references(() => creativeFolders.id, {
      onDelete: "set null",
    }),
    altText: text("alt_text"),
    tags: text("tags").array(),
    status: text("status", { enum: CREATIVE_STATUS_VALUES })
      .notNull()
      .default(CREATIVE_STATUS.ACTIVE),
    deletedAt: deletedAtColumn(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [
    index("creatives_product_id_idx").on(table.productId),
    index("creatives_folder_id_idx").on(table.folderId),
    index("creatives_status_idx").on(table.status),
  ]
)

export const creativeFiles = pgTable(
  "creative_files",
  {
    id: idColumn("creative_file"),
    creativeId: text("creative_id")
      .notNull()
      .references(() => creatives.id, { onDelete: "cascade" }),
    mediaFileId: text("media_file_id").references(() => mediaFiles.id, {
      onDelete: "set null",
    }),
    fileType: text("file_type"),
    cdnUrl: text("cdn_url"),
    thumbnailUrl: text("thumbnail_url"),
    fileSize: integer("file_size"),
    width: integer("width"),
    height: integer("height"),
    duration: integer("duration"),
    mimeType: text("mime_type"),
    originalFileName: text("original_file_name"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAtColumn(),
  },
  (table) => [
    index("creative_files_creative_id_idx").on(table.creativeId),
    index("creative_files_media_file_id_idx").on(table.mediaFileId),
  ]
)

export const creativeNotes = pgTable(
  "creative_notes",
  {
    id: idColumn("creative_note"),
    creativeId: text("creative_id")
      .notNull()
      .references(() => creatives.id, { onDelete: "cascade" }),
    mediaBuyerId: text("media_buyer_id")
      .notNull()
      .references(() => mediaBuyers.id, { onDelete: "cascade" }),
    note: text("note").notNull(),
    createdAt: createdAtColumn(),
  },
  (table) => [
    index("creative_notes_creative_id_idx").on(table.creativeId),
    index("creative_notes_media_buyer_id_idx").on(table.mediaBuyerId),
  ]
)

export const creativePerformanceTags = pgTable(
  "creative_performance_tags",
  {
    id: idColumn("creative_tag"),
    creativeId: text("creative_id")
      .notNull()
      .references(() => creatives.id, { onDelete: "cascade" }),
    mediaBuyerId: text("media_buyer_id")
      .notNull()
      .references(() => mediaBuyers.id, { onDelete: "cascade" }),
    performed: boolean("performed").notNull().default(false),
    createdAt: createdAtColumn(),
  },
  (table) => [
    index("creative_performance_tags_creative_id_idx").on(table.creativeId),
    index("creative_performance_tags_media_buyer_id_idx").on(table.mediaBuyerId),
  ]
)

export type Creative = typeof creatives.$inferSelect
export type NewCreative = typeof creatives.$inferInsert
export type CreativeFile = typeof creativeFiles.$inferSelect
export type NewCreativeFile = typeof creativeFiles.$inferInsert
export type CreativeNote = typeof creativeNotes.$inferSelect
export type NewCreativeNote = typeof creativeNotes.$inferInsert
export type CreativePerformanceTag = typeof creativePerformanceTags.$inferSelect
export type NewCreativePerformanceTag = typeof creativePerformanceTags.$inferInsert
