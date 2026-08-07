import { type Department } from "@adscrush/db/schema"
import { getFiltersStateParser, getSortingStateParser } from "@adscrush/shared/lib/query-parser"
import { createDepartmentSchema } from "@adscrush/shared/validators/department.schema"
import { z } from "zod"

export const departmentStatusSchema = z.enum(["active", "inactive"])

export const departmentOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  status: departmentStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type DepartmentOutput = z.infer<typeof departmentOutputSchema>

export const listDepartmentsInputSchema = z.object({
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().default(10),
  sort: getSortingStateParser<Department>().default([{ id: "createdAt", desc: true }]),
  filters: getFiltersStateParser().default([]),
  joinOperator: z.enum(["and", "or"]).default("and"),
  name: z.string().optional(),
  status: z.array(departmentStatusSchema).optional(),
})

export const createDepartmentInputSchema = createDepartmentSchema

export const updateDepartmentInputSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  status: departmentStatusSchema.optional(),
})

export const bulkUpdateDepartmentStatusInputSchema = z.object({
  ids: z.array(z.string()).min(1),
  status: departmentStatusSchema,
})

export const bulkDeleteDepartmentsInputSchema = z.object({
  ids: z.array(z.string()).min(1),
})

export type ListDepartmentsInput = z.infer<typeof listDepartmentsInputSchema>
