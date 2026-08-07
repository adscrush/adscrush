import { z } from "zod"

const validDate = z.string().refine((v) => !isNaN(new Date(v).getTime()), {
  message: "Must be a valid ISO date string",
})

export const dashboardQuerySchema = z.object({
  dateFrom: validDate,
  dateTo: validDate,
  timezoneOffset: z.number().optional(),
})

export type DashboardQueryInput = z.infer<typeof dashboardQuerySchema>
