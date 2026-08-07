import { z } from "zod"
import { LANDING_PAGE_STATUS, LANDING_PAGE_STATUS_VALUES } from "../constants/status"

export const createLandingPageSchema = z.object({
  name: z.string().optional().nullable(),
  url: z.string().optional().nullable(),
  weight: z.number().optional().nullable(),
  status: z.enum(LANDING_PAGE_STATUS_VALUES).default(LANDING_PAGE_STATUS.ACTIVE),
})

export const updateLandingPageSchema = createLandingPageSchema.partial()

export type CreateLandingPageInput = z.infer<typeof createLandingPageSchema>
export type UpdateLandingPageInput = z.infer<typeof updateLandingPageSchema>

export const createFunnelSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  name: z.string().min(1, "Funnel name is required"),
  language: z.string().default("en"),
  domain: z.string().optional().nullable(),
  pageUrl: z.string().optional().nullable(),
  thankYouPageUrl: z.string().optional().nullable(),
  status: z.enum(LANDING_PAGE_STATUS_VALUES).default(LANDING_PAGE_STATUS.ACTIVE),
  landingPages: z.array(createLandingPageSchema).default([]),
})

export const updateFunnelSchema = z.object({
  name: z.string().min(1).optional(),
  language: z.string().optional(),
  domain: z.string().optional().nullable(),
  pageUrl: z.string().optional().nullable(),
  thankYouPageUrl: z.string().optional().nullable(),
  status: z.enum(LANDING_PAGE_STATUS_VALUES).optional(),
})

export type CreateFunnelInput = z.infer<typeof createFunnelSchema>
export type UpdateFunnelInput = z.infer<typeof updateFunnelSchema>
