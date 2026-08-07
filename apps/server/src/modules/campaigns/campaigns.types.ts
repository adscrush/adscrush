import { z } from "zod"
import { CAMPAIGN_STATUS_VALUES } from "@adscrush/shared/constants/status"
import { type Campaign } from "@adscrush/db/schema"
import { getFiltersStateParser, getSortingStateParser } from "@adscrush/shared/lib/query-parser"

// ─── Output Types ────────────────────────────────────────────────────────────

export const campaignOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  productId: z.string(),
  funnelId: z.string().nullable().optional(),
  status: z.enum(CAMPAIGN_STATUS_VALUES),
  startDate: z.date().nullable(),
  endDate: z.date().nullable(),
  internalNotes: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  product: z.object({
    id: z.string(),
    name: z.string(),
    image: z.string().nullable(),
  }).optional().nullable(),
  funnel: z.object({
    id: z.string(),
    name: z.string(),
  }).optional().nullable(),
  creativeCount: z.number().optional(),
  adAccountCount: z.number().optional(),
  creatives: z.array(z.object({
    id: z.string(),
    name: z.string(),
    thumbnailUrl: z.string().nullable(),
  })).optional(),
  landingPageCount: z.number().optional(),
})

export type CampaignOutput = z.infer<typeof campaignOutputSchema>

// ─── Input Types ─────────────────────────────────────────────────────────────

export const listCampaignsInputSchema = z.object({
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().default(10),
  sort: getSortingStateParser<Campaign>().default([{ id: "createdAt", desc: true }]),
  filters: getFiltersStateParser().default([]),
  joinOperator: z.enum(["and", "or"]).default("and"),
  search: z.string().optional(),
  status: z.array(z.enum(CAMPAIGN_STATUS_VALUES)).optional(),
  productId: z.string().optional(),
})

export type ListCampaignsInput = z.infer<typeof listCampaignsInputSchema>

// ─── Domain Types ────────────────────────────────────────────────────────────

export interface CampaignListItem {
  id: string
  name: string
  productId: string
  funnelId: string | null
  status: Campaign["status"]
  startDate: Date | null
  endDate: Date | null
  internalNotes: string | null
  createdAt: Date
  updatedAt: Date
  product: {
    id: string
    name: string
    image: string | null
  }
  funnel: {
    id: string
    name: string
  } | null
  creativeCount?: number
  adAccountCount?: number
  creatives?: Array<{
    id: string
    name: string
    thumbnailUrl: string | null
  }>
  landingPageCount?: number
}
