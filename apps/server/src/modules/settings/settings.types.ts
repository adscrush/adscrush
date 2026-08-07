import { z } from "zod"

export const timezoneEnum = z.string()
export const currencyEnum = z.string()

export const allowedLoginRolesSchema = z.array(z.enum(["advertiser", "media_buyer"]))

export const settingsOutputSchema = z.object({
  id: z.string(),
  key: z.string(),
  value: z.string(),
  description: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const updateSettingsInputSchema = z.object({
  allowedLoginRoles: allowedLoginRolesSchema.optional(),
  timezone: timezoneEnum.optional(),
  currency: currencyEnum.optional(),
})

export type UpdateSettingsInput = z.infer<typeof updateSettingsInputSchema>
