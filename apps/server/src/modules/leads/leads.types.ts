import { z } from "zod"

// ─── Output Schema ──────────────────────────────────────────────────────────

export const leadOutputSchema = z.object({
  id: z.string(),
  tid: z.string(),
  name: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  address: z.string().nullable(),
  pincode: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  sub1: z.string().nullable(),
  sub2: z.string().nullable(),
  sub3: z.string().nullable(),
  sub4: z.string().nullable(),
  sub5: z.string().nullable(),
  payout: z.string(),
  currency: z.string(),
  status: z.string(),
  method: z.string(),
  campaignId: z.string().nullable(),
  geoCountry: z.string().nullable(),
  ipEncrypted: z.string().nullable(),
  // Decrypted IP — only populated for super_admin / admin users.
  ipAddress: z.string().nullable(),
  createdAt: z.date(),
  product: z.object({
    id: z.string(),
    name: z.string(),
  }).nullable(),
  campaign: z.object({
    id: z.string(),
    name: z.string(),
  }).nullable(),
  mediaBuyer: z.object({
    id: z.string(),
    name: z.string(),
  }).nullable(),
  advertiser: z.object({
    id: z.string(),
    name: z.string(),
  }).nullable(),
})

export type LeadOutput = z.infer<typeof leadOutputSchema>

// ─── Input Schema ───────────────────────────────────────────────────────────

export const listLeadsInputSchema = z.object({
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().default(50),
  search: z.string().optional(),
  status: z.array(z.string()).optional(),
  productId: z.string().optional(),
  mediaBuyerId: z.string().optional(),
  advertiserId: z.string().optional(),
  campaignId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sort: z.string().optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
  filters: z.array(z.any()).default([]),
  joinOperator: z.enum(["and", "or"]).default("and"),
})

export type ListLeadsInput = z.infer<typeof listLeadsInputSchema>

// ─── Internal Types ─────────────────────────────────────────────────────────

export interface LeadScope {
  isAllAdvertisers: boolean
  advertiserIds: string[]
  isAllMediaBuyers: boolean
  mediaBuyerIds: string[]
}
