import { getFiltersStateParser, getSortingStateParser } from "@adscrush/shared/lib/query-parser"
import { type Language } from "@adscrush/db/schema"
import { createLanguageSchema } from "@adscrush/shared/validators/language.schema"
import { z } from "zod"

export const languageOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type LanguageOutput = z.infer<typeof languageOutputSchema>

export const listLanguagesInputSchema = z.object({
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().default(10),
  sort: getSortingStateParser<Language>().default([{ id: "createdAt", desc: true }]),
  filters: getFiltersStateParser().default([]),
  joinOperator: z.enum(["and", "or"]).default("and"),
  search: z.string().optional(),
})

export const createLanguageInputSchema = createLanguageSchema

export const updateLanguageInputSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  code: z.string().min(1).max(10).optional(),
})

export const bulkDeleteLanguagesInputSchema = z.object({
  ids: z.array(z.string()).min(1),
})

export type ListLanguagesInput = z.infer<typeof listLanguagesInputSchema>
