import { z } from "zod"
import { EMPLOYEE_STATUS_VALUES, ACCESS_LEVEL_VALUES } from "../constants/status"
import { ALL_ROLES } from "../constants/roles"

export const createEmployeeSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  password: z.string().min(8),
  departmentId: z.string().optional(),
  department: z.string().optional(),
  role: z.enum(ALL_ROLES).default("employee"),
})

export const updateEmployeeSchema = z.object({
  name: z.string().optional(),
  email: z.email().optional(),
  role: z.enum(ALL_ROLES).optional(),
  departmentId: z.string().optional(),
  department: z.string().optional(),
  status: z.enum(EMPLOYEE_STATUS_VALUES).optional(),
  phoneNumber: z.string().optional(),
  socialContact: z.string().optional(),
  advertiserAccess: z.enum(ACCESS_LEVEL_VALUES).optional(),
  mediaBuyerAccess: z.enum(ACCESS_LEVEL_VALUES).optional(),
})

export const updateEmployeePermissionsSchema = z.object({
  permissions: z.array(z.string()),
})

export const updateEmployeeAccessSchema = z.object({
  advertiserAccess: z.enum(ACCESS_LEVEL_VALUES).optional(),
  mediaBuyerAccess: z.enum(ACCESS_LEVEL_VALUES).optional(),
  mediaBuyerIds: z.array(z.string()).optional(),
  advertiserIds: z.array(z.string()).optional(),
})

export const bulkUpdateStatusSchema = z.object({
  ids: z.array(z.string()).min(1),
  status: z.enum(EMPLOYEE_STATUS_VALUES),
})

export const bulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1),
})

export const changeEmployeePasswordSchema = z.object({
  password: z.string().min(8),
})

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>
export type UpdateEmployeeAccessInput = z.infer<typeof updateEmployeeAccessSchema>
export type BulkUpdateStatusInput = z.infer<typeof bulkUpdateStatusSchema>
export type BulkDeleteInput = z.infer<typeof bulkDeleteSchema>
export type ChangeEmployeePasswordInput = z.infer<typeof changeEmployeePasswordSchema>
