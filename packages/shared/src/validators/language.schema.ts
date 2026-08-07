import { z } from "zod"

export const createLanguageSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1).max(10),
})

export const updateLanguageSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).max(10).optional(),
})

export type CreateLanguageInput = z.infer<typeof createLanguageSchema>
export type UpdateLanguageInput = z.infer<typeof updateLanguageSchema>

export const bulkDeleteLanguagesSchema = z.object({
  ids: z.array(z.string()).min(1),
})

export type BulkDeleteLanguagesInput = z.infer<typeof bulkDeleteLanguagesSchema>
