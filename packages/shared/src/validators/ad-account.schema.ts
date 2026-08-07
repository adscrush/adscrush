import { z } from "zod"
import { AD_ACCOUNT_STATUS_VALUES } from "../constants/status"

export const createAdAccountSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sourcePlatform: z.string().min(1, "Source platform is required"),
  accountId: z.string().min(1, "Account ID is required"),
  mediaBuyerId: z.string().nullable().optional(),
  status: z.enum(AD_ACCOUNT_STATUS_VALUES).default("active"),
})

export const updateAdAccountSchema = z.object({
  name: z.string().min(1).optional(),
  sourcePlatform: z.string().min(1).optional(),
  accountId: z.string().min(1).optional(),
  mediaBuyerId: z.string().nullable().optional(),
  status: z.enum(AD_ACCOUNT_STATUS_VALUES).optional(),
})

export type CreateAdAccountInput = z.infer<typeof createAdAccountSchema>
export type UpdateAdAccountInput = z.infer<typeof updateAdAccountSchema>
