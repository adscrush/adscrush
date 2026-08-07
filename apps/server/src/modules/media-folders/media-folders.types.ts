import {
  createMediaFolderSchema,
  moveMediaFolderSchema,
} from "@adscrush/shared/validators/media.schema"
import { z } from "zod"

// Re-export shared schemas
export { createMediaFolderSchema, moveMediaFolderSchema }

// Input schemas specific to this module
export const listMediaFoldersInputSchema = z.object({
  parentId: z.string().nullable().optional(),
}).optional()

export const listMediaFoldersChildrenInputSchema = z.object({
  parentId: z.string().nullable(),
})

export const renameMediaFolderInputSchema = z.object({
  folderId: z.string(),
  name: z.string().min(1).max(100),
})

export const deleteMediaFolderInputSchema = z.object({
  folderId: z.string(),
})
