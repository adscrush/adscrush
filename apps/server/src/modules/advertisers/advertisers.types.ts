import { z } from "zod"
import { type Advertiser } from "@adscrush/db/schema"
import { ADVERTISER_STATUS_VALUES } from "@adscrush/shared/constants/status"
import { getFiltersStateParser, getSortingStateParser } from "@adscrush/shared/lib/query-parser"

// ─── Output Types ────────────────────────────────────────────────────────────

export const advertiserOutputSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  companyName: z.string().nullable(),
  email: z.string(),
  website: z.string().nullable(),
  country: z.string().nullable(),
  phoneNumber: z.string().nullable(),
  billingAddress: z.string().nullable(),
  paymentTermsDays: z.number().nullable(),
  internalNotes: z.string().nullable(),
  accountManagerId: z.string().nullable(),
  status: z.enum(ADVERTISER_STATUS_VALUES),
  createdAt: z.date(),
  updatedAt: z.date(),
  accountManager: z
    .object({
      id: z.string(),
      name: z.string().nullable(),
      email: z.string().nullable(),
      image: z.string().nullable(),
    })
    .nullable()
    .optional(),
})

export type AdvertiserOutput = z.infer<typeof advertiserOutputSchema>

// ─── Input Types ─────────────────────────────────────────────────────────────

export const listAdvertisersInputSchema = z.object({
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().default(10),
  sort: getSortingStateParser<Advertiser>().default([{ id: "createdAt", desc: true }]),
  filters: getFiltersStateParser().default([]),
  joinOperator: z.enum(["and", "or"]).default("and"),
  search: z.string().optional(),
  status: z.array(z.enum(ADVERTISER_STATUS_VALUES)).optional(),
})

export type ListAdvertisersInput = z.infer<typeof listAdvertisersInputSchema>

export const createAdvertiserInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  companyName: z.string().optional(),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  country: z.string().optional(),
  accountManagerId: z.string().optional(),
  status: z.enum(ADVERTISER_STATUS_VALUES).default("active"),
})

export const updateAdvertiserInputSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  companyName: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional().or(z.literal("")),
  country: z.string().optional(),
  accountManagerId: z.string().optional(),
  status: z.enum(ADVERTISER_STATUS_VALUES).optional(),
})

export const bulkUpdateAdvertiserStatusInputSchema = z.object({
  ids: z.array(z.string()).min(1),
  status: z.enum(ADVERTISER_STATUS_VALUES),
})

export const bulkDeleteAdvertisersInputSchema = z.object({
  ids: z.array(z.string()).min(1),
})
