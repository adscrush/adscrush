import { AD_ACCOUNT_STATUS_VALUES } from "@adscrush/shared/constants/status"
import { getFiltersStateParser, getSortingStateParser } from "@adscrush/shared/lib/query-parser"
import { createAdAccountSchema, updateAdAccountSchema } from "@adscrush/shared/validators/ad-account.schema"
import type { AdAccount } from "@adscrush/db/schema"
import { z } from "zod"

// ─── Output Schema ──────────────────────────────────────────────────────────

export const adAccountOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  sourcePlatform: z.string(),
  accountId: z.string(),
  mediaBuyerId: z.string().nullable(),
  mediaBuyer: z
    .object({
      id: z.string(),
      name: z.string(),
      image: z.string().nullable(),
    })
    .nullable(),
  status: z.enum(AD_ACCOUNT_STATUS_VALUES),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type AdAccountOutput = z.infer<typeof adAccountOutputSchema>

// ─── Input Schema ───────────────────────────────────────────────────────────

export const listAdAccountsInputSchema = z.object({
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().default(10),
  sort: getSortingStateParser<AdAccount>().default([{ id: "createdAt", desc: true }]),
  filters: getFiltersStateParser().default([]),
  joinOperator: z.enum(["and", "or"]).default("and"),
  search: z.string().optional(),
  status: z.array(z.enum(AD_ACCOUNT_STATUS_VALUES)).optional(),
  // When true, only return ad accounts that already have a media buyer assigned.
  // Used by the campaign assign flow — accounts must belong to a media buyer
  // before they can be linked to a campaign.
  requireMediaBuyer: z.boolean().optional(),
})

export type ListAdAccountsInput = z.infer<typeof listAdAccountsInputSchema>

// ─── Bulk Operation Schemas ─────────────────────────────────────────────────

export const bulkUpdateAdAccountStatusInputSchema = z.object({
  ids: z.array(z.string()).min(1),
  status: z.enum(AD_ACCOUNT_STATUS_VALUES),
})

export const bulkUpdateMediaBuyerInputSchema = z.object({
  ids: z.array(z.string()).min(1),
  mediaBuyerId: z.string().nullable(),
})

export const bulkDeleteAdAccountsInputSchema = z.object({
  ids: z.array(z.string()).min(1),
})

// ─── Bulk Import Schema ─────────────────────────────────────────────────────

export const bulkImportInputSchema = z.object({
  accounts: z.array(createAdAccountSchema),
})

// ─── Re-export shared schemas ───────────────────────────────────────────────

export { createAdAccountSchema, updateAdAccountSchema }
