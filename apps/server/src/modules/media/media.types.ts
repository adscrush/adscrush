import {
  uploadMediaSchema,
  mediaListSchema,
  moveFilesSchema,
  MIME_CATEGORIES,
  ALLOWED_MEDIA_MIME_TYPES,
  type AllowedMediaMimeType,
  type MimeCategory,
} from "@adscrush/shared/validators/media.schema"
import { z } from "zod"

// Re-export shared schemas
export {
  uploadMediaSchema,
  mediaListSchema,
  moveFilesSchema,
  MIME_CATEGORIES,
  ALLOWED_MEDIA_MIME_TYPES,
  type AllowedMediaMimeType,
  type MimeCategory,
}

// Additional schemas specific to this module
export const uploadFromUrlInputSchema = z.object({
  url: z.string().url(),
  folderId: z.string().nullish(),
  tags: z.array(z.string().min(1).max(50)).max(20).optional(),
})

export const replaceMediaInputSchema = z.object({
  fileId: z.string(),
  file: z.string().min(1),
  fileName: z.string().min(1).max(255),
  mimeType: z.enum(ALLOWED_MEDIA_MIME_TYPES),
})

export const addTagsInputSchema = z.object({
  fileId: z.string(),
  tags: z.array(z.string().min(1).max(50)).min(1).max(20),
})

export const removeTagsInputSchema = z.object({
  fileId: z.string(),
  tags: z.array(z.string().min(1).max(50)).min(1),
})

export const deleteFilesInputSchema = z.object({
  fileIds: z.array(z.string()).min(1),
})

export const scanOrphansInputSchema = z.object({})

export const deleteOrphansInputSchema = z.object({
  fileIds: z.array(z.string()).min(1),
})
