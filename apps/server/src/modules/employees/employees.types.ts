import { z } from "zod"
import { type Employee } from "@adscrush/db/schema"
import { ALL_ROLES } from "@adscrush/shared/constants/roles"
import { ACCESS_LEVEL_VALUES, EMPLOYEE_STATUS_VALUES } from "@adscrush/shared/constants/status"
import { getFiltersStateParser, getSortingStateParser } from "@adscrush/shared/lib/query-parser"

// ─── Output Types ────────────────────────────────────────────────────────────

export const employeeOutputSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string().nullable(),
  email: z.string().nullable(),
  image: z.string().nullable(),
  role: z.enum(ALL_ROLES).nullable(),
  departmentId: z.string().nullable(),
  departmentName: z.string().nullable(),
  status: z.enum(EMPLOYEE_STATUS_VALUES),
  advertiserAccess: z.enum(ACCESS_LEVEL_VALUES),
  mediaBuyerAccess: z.enum(ACCESS_LEVEL_VALUES),
  assignedAdvertisers: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        companyName: z.string().nullable().optional(),
        image: z.string().nullable().optional(),
      })
    )
    .optional(),
  assignedMediaBuyers: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        companyName: z.string().nullable().optional(),
        image: z.string().nullable().optional(),
      })
    )
    .optional(),
  managedAdvertisers: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        companyName: z.string().nullable().optional(),
        image: z.string().nullable().optional(),
      })
    )
    .optional(),
  managedMediaBuyers: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        companyName: z.string().nullable().optional(),
        image: z.string().nullable().optional(),
      })
    )
    .optional(),
  phoneNumber: z.string().nullable(),
  socialContact: z.string().nullable(),
  banned: z.boolean().nullable(),
  banReason: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type EmployeeOutput = z.infer<typeof employeeOutputSchema>

// ─── Input Types ─────────────────────────────────────────────────────────────

export const listEmployeesInputSchema = z.object({
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().default(10),
  sort: getSortingStateParser<Employee>().default([{ id: "createdAt", desc: true }]),
  filters: getFiltersStateParser().default([]),
  joinOperator: z.enum(["and", "or"]).default("and"),
  search: z.string().optional(),
  status: z.array(z.enum(EMPLOYEE_STATUS_VALUES)).optional(),
})

export type ListEmployeesInput = z.infer<typeof listEmployeesInputSchema>

export const createEmployeeInputSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  departmentId: z.string().optional(),
  role: z.enum(ALL_ROLES).optional(),
})

export const updateEmployeeInputSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  role: z.enum(ALL_ROLES).optional(),
  departmentId: z.string().optional(),
  status: z.enum(EMPLOYEE_STATUS_VALUES).optional(),
  phoneNumber: z.string().optional(),
  socialContact: z.string().optional(),
})

export const changeEmployeePasswordInputSchema = z.object({
  id: z.string(),
  password: z.string().min(8),
})

export const updateEmployeeAccessInputSchema = z.object({
  id: z.string(),
  advertiserAccess: z.enum(ACCESS_LEVEL_VALUES).optional(),
  mediaBuyerAccess: z.enum(ACCESS_LEVEL_VALUES).optional(),
  advertiserIds: z.array(z.string()).optional(),
  mediaBuyerIds: z.array(z.string()).optional(),
  managedAdvertiserIds: z.array(z.string()).optional(),
  managedMediaBuyerIds: z.array(z.string()).optional(),
})

export const bulkUpdateEmployeeStatusInputSchema = z.object({
  ids: z.array(z.string()).min(1),
  status: z.enum(EMPLOYEE_STATUS_VALUES),
})

export const bulkDeleteEmployeesInputSchema = z.object({
  ids: z.array(z.string()).min(1),
})

export const getPermissionsInputSchema = z.object({
  employeeId: z.string(),
})

export const updatePermissionsInputSchema = z.object({
  employeeId: z.string(),
  permissions: z.array(z.string()),
})

export const clonePermissionsInputSchema = z.object({
  sourceEmployeeId: z.string(),
  targetEmployeeId: z.string(),
})

export const applyPresetInputSchema = z.object({
  employeeId: z.string(),
  preset: z.enum(["full", "manager", "readonly"]),
})
