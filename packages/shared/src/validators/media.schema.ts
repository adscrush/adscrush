import { z } from "zod"

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._\-\s]/g, "-").replace(/\s+/g, "-")
}

// ─── Constants ───────────────────────────────────────────────────────────────

export const ALLOWED_MEDIA_MIME_TYPES = [
  // Images
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/avif",
  // Videos
  "video/mp4",
  "video/quicktime",
  "video/webm",
  // Documents
  "application/pdf",
  // Fonts
  "font/woff",
  "font/woff2",
  "font/ttf",
  "font/otf",
] as const

export const MAX_MEDIA_FILE_SIZE = 500 * 1024 * 1024 // 500 MB

export const MIME_CATEGORIES = {
  image: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml", "image/avif"],
  video: ["video/mp4", "video/quicktime", "video/webm"],
  document: ["application/pdf"],
  font: ["font/woff", "font/woff2", "font/ttf", "font/otf"],
} as const

export const TRANSFORM_PRESETS = {
  thumbnail: { width: 150, height: 150, mode: "crop" },
  small: { width: 300, height: 300, mode: "contain" },
  medium: { width: 600, height: 600, mode: "contain" },
  large: { width: 1200, height: 1200, mode: "contain" },
  original: {},
} as const

// ─── Schemas ─────────────────────────────────────────────────────────────────

export const uploadMediaSchema = z.object({
  file: z.string().min(1),
  fileName: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-zA-Z0-9._\-\s]+$/, "File name contains characters not permitted in URLs")
    .transform(sanitizeFileName),
  mimeType: z.enum(ALLOWED_MEDIA_MIME_TYPES),
  folderId: z.string().nullish(),
  tags: z.array(z.string().min(1).max(50)).max(20).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
})

export const createMediaFolderSchema = z.object({
  name: z.string().min(1).max(100),
  parentId: z.string().nullish(),
})

export const moveMediaFolderSchema = z.object({
  folderId: z.string(),
  newParentId: z.string().nullable(),
})

export const transformImageSchema = z.object({
  fileId: z.string(),
  preset: z.enum(["thumbnail", "small", "medium", "large", "original"]).optional(),
  width: z.number().int().min(1).max(5000).optional(),
  height: z.number().int().min(1).max(5000).optional(),
  mode: z.enum(["crop", "stretch", "contain", "cover"]).optional(),
})

export const mediaListSchema = z.object({
  cursor: z.string().nullish(),
  pageSize: z.number().int().min(10).max(100).default(50),
  folderId: z.string().nullish(),
  search: z.string().min(1).max(200).optional(),
  mimeCategory: z.enum(["image", "video", "document", "font"]).optional(),
  // Multi-select "File type" filter (from the picker chip).
  mimeCategories: z.array(z.enum(["image", "video", "document", "font"])).optional(),
  // "Used in" filter: limit to files not referenced by any product/creative.
  usedIn: z.enum(["all", "not_used"]).optional(),
  // "Product" filter: limit to files attached to any of these products.
  productIds: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  sortBy: z.enum(["name", "size", "dateUploaded", "fileType"]).default("dateUploaded"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  uploadedBy: z.string().optional(),
})

export const moveFilesSchema = z.object({
  fileIds: z.array(z.string()).min(1).max(100),
  targetFolderId: z.string().nullable(),
})

// ─── Type Exports ────────────────────────────────────────────────────────────

export type AllowedMediaMimeType = (typeof ALLOWED_MEDIA_MIME_TYPES)[number]
export type MimeCategory = keyof typeof MIME_CATEGORIES
export type TransformPreset = keyof typeof TRANSFORM_PRESETS
export type TransformMode = "crop" | "stretch" | "contain" | "cover"

export type UploadMediaInput = z.infer<typeof uploadMediaSchema>
export type CreateMediaFolderInput = z.infer<typeof createMediaFolderSchema>
export type MoveMediaFolderInput = z.infer<typeof moveMediaFolderSchema>
export type MoveFilesInput = z.infer<typeof moveFilesSchema>
export type TransformImageInput = z.infer<typeof transformImageSchema>
export type MediaListInput = z.infer<typeof mediaListSchema>
