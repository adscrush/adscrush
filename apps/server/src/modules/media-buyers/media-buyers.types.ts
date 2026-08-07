import { z } from "zod"
import { type MediaBuyer } from "@adscrush/db/schema"
import {
  MEDIA_BUYER_KIND_VALUES,
  MEDIA_BUYER_STATUS_VALUES,
} from "@adscrush/shared/constants/status"
import { getFiltersStateParser, getSortingStateParser } from "@adscrush/shared/lib/query-parser"
import { changeMediaBuyerPasswordSchema } from "@adscrush/shared/validators/media-buyer.schema"

// ─── Output Types ────────────────────────────────────────────────────────────

export const mediaBuyerOutputSchema = z.object({
  id: z.string(),
  userId: z.string(),
  kind: z.enum(MEDIA_BUYER_KIND_VALUES),
  employeeId: z.string().nullable(),
  name: z.string(),
  email: z.string(),
  phoneNumber: z.string().nullable(),
  trafficSources: z.array(z.string()).nullable(),
  paymentMethod: z.string().nullable(),
  paymentDetails: z.string().nullable(),
  accountManagerId: z.string().nullable(),
  status: z.enum(MEDIA_BUYER_STATUS_VALUES),
  internalNotes: z.string().nullable(),
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

export type MediaBuyerOutput = z.infer<typeof mediaBuyerOutputSchema>

export const mediaBuyerPopoverOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  status: z.enum(MEDIA_BUYER_STATUS_VALUES),
  accountManager: z.object({
    name: z.string().nullable(),
    email: z.string().nullable(),
  }).nullable(),
})

export type MediaBuyerPopoverOutput = z.infer<typeof mediaBuyerPopoverOutputSchema>

// ─── Input Types ─────────────────────────────────────────────────────────────

export const listMediaBuyersInputSchema = z.object({
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().default(10),
  sort: getSortingStateParser<MediaBuyer>().default([{ id: "createdAt", desc: true }]),
  filters: getFiltersStateParser().default([]),
  joinOperator: z.enum(["and", "or"]).default("and"),
  search: z.string().optional(),
  status: z.array(z.enum(MEDIA_BUYER_STATUS_VALUES)).optional(),
})

export type ListMediaBuyersInput = z.infer<typeof listMediaBuyersInputSchema>

export const createMediaBuyerInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  phoneNumber: z.string().optional(),
  trafficSources: z.array(z.string()).optional(),
  paymentMethod: z.string().optional(),
  paymentDetails: z.string().optional(),
  accountManagerId: z.string().optional(),
  status: z.enum(MEDIA_BUYER_STATUS_VALUES).default("active"),
  internalNotes: z.string().optional(),
})

export const updateMediaBuyerInputSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  phoneNumber: z.string().optional(),
  trafficSources: z.array(z.string()).optional(),
  paymentMethod: z.string().optional(),
  paymentDetails: z.string().optional(),
  accountManagerId: z.string().optional(),
  status: z.enum(MEDIA_BUYER_STATUS_VALUES).optional(),
  internalNotes: z.string().optional(),
})

export const linkEmployeeMediaBuyerInputSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  companyName: z.string().optional(),
  phoneNumber: z.string().optional(),
  trafficSources: z.array(z.string()).optional(),
  internalNotes: z.string().optional(),
  status: z.enum(MEDIA_BUYER_STATUS_VALUES).default("active"),
})

export const bulkUpdateMediaBuyerStatusInputSchema = z.object({
  ids: z.array(z.string()).min(1),
  status: z.enum(MEDIA_BUYER_STATUS_VALUES),
})

export const bulkDeleteMediaBuyersInputSchema = z.object({
  ids: z.array(z.string()).min(1),
})

export const changeMediaBuyerPasswordInputSchema = changeMediaBuyerPasswordSchema.extend({
  id: z.string().min(1),
})

export const getMediaBuyerPermissionsInputSchema = z.object({
  mediaBuyerId: z.string(),
})

export const updateMediaBuyerPermissionsInputSchema = z.object({
  mediaBuyerId: z.string(),
  permissions: z.array(z.string()),
})

export const applyMediaBuyerPresetInputSchema = z.object({
  mediaBuyerId: z.string(),
  preset: z.enum(["full", "manager", "readonly"]),
})
