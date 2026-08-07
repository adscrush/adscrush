import { type Category } from "@adscrush/db/schema"
import { getFiltersStateParser, getSortingStateParser } from "@adscrush/shared/lib/query-parser"
import { z } from "zod"

export const categoryOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type CategoryOutput = z.infer<typeof categoryOutputSchema>

export const listCategoriesInputSchema = z.object({
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().default(10),
  sort: getSortingStateParser<Category>().default([{ id: "createdAt", desc: true }]),
  filters: getFiltersStateParser().default([]),
  joinOperator: z.enum(["and", "or"]).default("and"),
  search: z.string().optional(),
})

export const createCategoryInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
})

export const updateCategoryInputSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
})

export const bulkDeleteCategoriesInputSchema = z.object({
  ids: z.array(z.string()).min(1),
})

export type ListCategoriesInput = z.infer<typeof listCategoriesInputSchema>
