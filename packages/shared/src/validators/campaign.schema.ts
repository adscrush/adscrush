import { z } from "zod"
import { CAMPAIGN_STATUS_VALUES } from "../constants/status"

export const createCampaignSchema = z.object({
  name: z.string().min(1, "Name is required"),
  funnelId: z.string().min(1, "Funnel is required"),
  status: z.enum(CAMPAIGN_STATUS_VALUES).default("active"),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  internalNotes: z.string().optional(),
})

export const updateCampaignSchema = z.object({
  name: z.string().min(1).optional(),
  funnelId: z.string().optional().nullable(),
  status: z.enum(CAMPAIGN_STATUS_VALUES).optional(),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  internalNotes: z.string().optional(),
})

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>
