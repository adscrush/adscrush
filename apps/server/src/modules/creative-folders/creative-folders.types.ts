import {
  createCreativeFolderSchema,
  updateCreativeFolderSchema,
} from "@adscrush/shared/validators/creative.schema"
import { creativeFolderOutputSchema } from "~/modules/creatives/creatives.types"
import { z } from "zod"

// Re-export shared schemas
export { createCreativeFolderSchema, updateCreativeFolderSchema }

// Re-export output schema from creatives module (shared type)
export { creativeFolderOutputSchema }

// Input schemas specific to this module
export const listCreativeFoldersInputSchema = z.object({
  productId: z.string(),
  parentId: z.string().nullable().optional(),
  flat: z.boolean().optional().default(false),
})

export const deleteCreativeFolderInputSchema = z.object({
  id: z.string(),
  recursive: z.boolean().default(false),
})
