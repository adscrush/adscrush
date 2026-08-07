import { z } from "zod"

export const createCreativeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  productId: z.string().min(1, "Product is required"),
  folderId: z.string().optional(),
  altText: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["active", "inactive"]).default("active"),
})

export const updateCreativeSchema = z.object({
  name: z.string().min(1).optional(),
  folderId: z.string().nullable().optional(),
  altText: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["active", "inactive"]).optional(),
})

export const createCreativeFileSchema = z.object({
  creativeId: z.string().min(1),
  mediaFileId: z.string().optional(),
  fileType: z.string().optional(),
  cdnUrl: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  fileSize: z.number().int().positive().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  duration: z.number().int().positive().optional(),
  mimeType: z.string().optional(),
  originalFileName: z.string().optional(),
  sortOrder: z.number().int().default(0),
})

export const createCreativeNoteSchema = z.object({
  creativeId: z.string().min(1),
  note: z.string().min(1, "Note is required"),
})

export const setCreativePerformanceTagSchema = z.object({
  creativeId: z.string().min(1),
  performed: z.boolean(),
})

export const createCreativeFolderSchema = z.object({
  name: z.string().min(1, "Folder name is required"),
  parentId: z.string().optional(),
  productId: z.string().min(1, "Product is required"),
})

export const updateCreativeFolderSchema = z.object({
  name: z.string().min(1).optional(),
  parentId: z.string().nullable().optional(),
})

export const moveCreativeToFolderSchema = z.object({
  creativeId: z.string().min(1),
  folderId: z.string().nullable(),
})

export type CreateCreativeInput = z.infer<typeof createCreativeSchema>
export type UpdateCreativeInput = z.infer<typeof updateCreativeSchema>
export type CreateCreativeFileInput = z.infer<typeof createCreativeFileSchema>
export type CreateCreativeNoteInput = z.infer<typeof createCreativeNoteSchema>
export type SetCreativePerformanceTagInput = z.infer<typeof setCreativePerformanceTagSchema>
export type CreateCreativeFolderInput = z.infer<typeof createCreativeFolderSchema>
export type UpdateCreativeFolderInput = z.infer<typeof updateCreativeFolderSchema>
export type MoveCreativeToFolderInput = z.infer<typeof moveCreativeToFolderSchema>
