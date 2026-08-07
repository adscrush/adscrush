import { z } from "zod"
import { MEDIA_BUYER_STATUS_VALUES } from "../constants/status"

export const createMediaBuyerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8).optional(),
  phoneNumber: z.string().optional(),
  trafficSources: z.array(z.string()).optional(),
  paymentMethod: z.string().optional(),
  paymentDetails: z.string().optional(),
  accountManagerId: z.string().optional(),
  status: z.enum(MEDIA_BUYER_STATUS_VALUES),
  internalNotes: z.string().optional(),
})

export const updateMediaBuyerSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phoneNumber: z.string().optional(),
  trafficSources: z.array(z.string()).optional(),
  paymentMethod: z.string().optional(),
  paymentDetails: z.string().optional(),
  accountManagerId: z.string().optional(),
  status: z.enum(MEDIA_BUYER_STATUS_VALUES).optional(),
  internalNotes: z.string().optional(),
})

export type CreateMediaBuyerInput = z.infer<typeof createMediaBuyerSchema>
export type UpdateMediaBuyerInput = z.infer<typeof updateMediaBuyerSchema>

export const bulkUpdateMediaBuyerStatusSchema = z.object({
  ids: z.array(z.string()).min(1),
  status: z.enum(MEDIA_BUYER_STATUS_VALUES),
})

export const bulkDeleteMediaBuyersSchema = z.object({
  ids: z.array(z.string()).min(1),
})

export type BulkUpdateMediaBuyerStatusInput = z.infer<typeof bulkUpdateMediaBuyerStatusSchema>
export type BulkDeleteMediaBuyersInput = z.infer<typeof bulkDeleteMediaBuyersSchema>

export const changeMediaBuyerPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export type ChangeMediaBuyerPasswordInput = z.infer<typeof changeMediaBuyerPasswordSchema>
