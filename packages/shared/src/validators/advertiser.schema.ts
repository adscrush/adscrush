import { z } from "zod"

export const createAdvertiserSchema = z.object({
  name: z.string().min(1, { error: "Advertiser name is required" }),
  companyName: z.string().optional(),
  email: z.email(),
  password: z
    .string()
    .min(8, { error: "Password must be at least 8 characters long" })
    .optional()
    .or(z.literal("")),
  website: z.url().optional().or(z.literal("")),
  country: z.string().optional(),
  accountManagerId: z.string(),
  status: z
    .enum(["active", "inactive", "pending"])
    .default("active")
    .nonoptional(),
})

export const updateAdvertiserSchema = z.object({
  name: z.string().min(1).optional(),
  companyName: z.string().optional(),
  email: z.email().optional(),
  website: z.url().optional().or(z.literal("")),
  country: z.string().optional(),
  accountManagerId: z.string().optional(),
  status: z.enum(["active", "inactive", "pending"]).optional(),
})

export type CreateAdvertiserInput = z.infer<typeof createAdvertiserSchema>
export type UpdateAdvertiserInput = z.infer<typeof updateAdvertiserSchema>

export const bulkUpdateStatusSchema = z.object({
  ids: z.array(z.string()).min(1),
  status: z.enum(["active", "inactive", "pending"]),
})

export const bulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1),
})

export type BulkUpdateStatusInput = z.infer<typeof bulkUpdateStatusSchema>
export type BulkDeleteInput = z.infer<typeof bulkDeleteSchema>
