import { z } from "zod"
import { type Product } from "@adscrush/db/schema"
import {
  PRODUCT_STATUS_VALUES,
  PRODUCT_VISIBILITY_VALUES,
} from "@adscrush/shared/constants/status"
import { getFiltersStateParser, getSortingStateParser } from "@adscrush/shared/lib/query-parser"

// ─── Output Types ────────────────────────────────────────────────────────────

export const productOutputSchema = z.object({
  id: z.string(),
  advertiserId: z.string(),
  categoryId: z.string().nullable(),
  name: z.string(),
  image: z.string().nullable(),
  description: z.string().nullable(),
  privateNote: z.string().nullable(),
  status: z.enum(PRODUCT_STATUS_VALUES),
  visibility: z.enum(PRODUCT_VISIBILITY_VALUES),
  dailyCap: z.number().int().nullable(),
  totalCap: z.number().int().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  advertiser: z.object({
    id: z.string(),
    name: z.string(),
  }).optional().nullable(),
  category: z.object({
    id: z.string(),
    name: z.string(),
  }).optional().nullable(),
})

export type ProductOutput = z.infer<typeof productOutputSchema>

export const productPopoverOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  image: z.string().nullable(),
  status: z.enum(PRODUCT_STATUS_VALUES),
  advertiser: z.object({
    id: z.string(),
    name: z.string(),
  }).nullable(),
  category: z.object({
    id: z.string(),
    name: z.string(),
  }).nullable(),
})

export type ProductPopoverOutput = z.infer<typeof productPopoverOutputSchema>

// ─── Input Types ─────────────────────────────────────────────────────────────

export const listProductsInputSchema = z.object({
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().default(10),
  sort: getSortingStateParser<Product>().default([{ id: "createdAt", desc: true }]),
  filters: getFiltersStateParser().default([]),
  joinOperator: z.enum(["and", "or"]).default("and"),
  search: z.string().optional(),
  status: z.array(z.enum(PRODUCT_STATUS_VALUES)).optional(),
  advertiserId: z.string().optional(),
  categoryId: z.string().optional(),
})

export type ListProductsInput = z.infer<typeof listProductsInputSchema>

export const bulkUpdateProductStatusInputSchema = z.object({
  ids: z.array(z.string()).min(1),
  status: z.enum(PRODUCT_STATUS_VALUES),
})

export const bulkDeleteProductsInputSchema = z.object({
  ids: z.array(z.string()).min(1),
})
