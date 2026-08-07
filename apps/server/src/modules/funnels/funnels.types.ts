import { type Funnel } from "@adscrush/db/schema"
import { LANDING_PAGE_STATUS_VALUES } from "@adscrush/shared/constants/status"
import { getFiltersStateParser, getSortingStateParser } from "@adscrush/shared/lib/query-parser"
import { z } from "zod"

export const landingPageOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  weight: z.number().nullable(),
  status: z.enum(LANDING_PAGE_STATUS_VALUES),
})

export const funnelOutputSchema = z.object({
  id: z.string(),
  productId: z.string(),
  name: z.string(),
  language: z.string(),
  domain: z.string().nullable(),
  pageUrl: z.string().nullable(),
  thankYouPageUrl: z.string().nullable(),
  status: z.enum(LANDING_PAGE_STATUS_VALUES),
  createdAt: z.date(),
  updatedAt: z.date(),
  product: z.object({
    id: z.string(),
    name: z.string(),
    image: z.string().nullable().optional(),
  }).optional().nullable(),
  landingPages: z.array(landingPageOutputSchema).optional(),
  landingPagesCount: z.number().optional(),
})

export type FunnelOutput = z.infer<typeof funnelOutputSchema>

export const listFunnelsInputSchema = z.object({
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().default(10),
  sort: getSortingStateParser<Funnel>().default([{ id: "createdAt", desc: true }]),
  filters: getFiltersStateParser().default([]),
  joinOperator: z.enum(["and", "or"]).default("and"),
  search: z.string().optional(),
  status: z.array(z.enum(LANDING_PAGE_STATUS_VALUES)).optional(),
  productId: z.string().optional(),
  language: z.string().optional(),
})

export type ListFunnelsInput = z.infer<typeof listFunnelsInputSchema>

export const funnelCountsOutputSchema = z.object({
  statuses: z.array(z.object({
    value: z.string(),
    count: z.number(),
  })),
  products: z.array(z.object({
    value: z.string(),
    label: z.string(),
    count: z.number(),
  })),
  languages: z.array(z.object({
    value: z.string(),
    count: z.number(),
  })),
})
