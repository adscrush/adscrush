import { z } from "zod"

export const createDepartmentSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
})

export const updateDepartmentSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional().default("active"),
})

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>

export const bulkUpdateStatusSchema = z.object({
  ids: z.array(z.string()).min(1),
  status: z.enum(["active", "inactive"]),
})

export const bulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1),
})

export type BulkUpdateStatusInput = z.infer<typeof bulkUpdateStatusSchema>
export type BulkDeleteInput = z.infer<typeof bulkDeleteSchema>
