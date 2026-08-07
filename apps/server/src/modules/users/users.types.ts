import { z } from "zod"
import { type users } from "@adscrush/db/schema"
import { ROLES } from "@adscrush/shared/constants/roles"
import { getSortingStateParser, getFiltersStateParser } from "@adscrush/shared/lib/query-parser"

export const listUsersInputSchema = z.object({
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().default(10),
  sort: getSortingStateParser<typeof users.$inferSelect>().default([
    { id: "createdAt", desc: true },
  ]),
  filters: getFiltersStateParser().default([]),
  joinOperator: z.enum(["and", "or"]).default("and"),
  search: z.string().optional(),
})

export const getUserByIdInputSchema = z.object({
  id: z.string(),
})

export const revokeSessionInputSchema = z.object({
  sessionId: z.string(),
})

export const updateRoleInputSchema = z.object({
  userId: z.string(),
  role: z.nativeEnum(ROLES),
})

export type ListUsersInput = z.infer<typeof listUsersInputSchema>
export type GetUserByIdInput = z.infer<typeof getUserByIdInputSchema>
export type RevokeSessionInput = z.infer<typeof revokeSessionInputSchema>
export type UpdateRoleInput = z.infer<typeof updateRoleInputSchema>
