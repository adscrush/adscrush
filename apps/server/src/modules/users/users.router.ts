import { adminProcedure, router } from "~/lib/trpc/init"
import {
  listUsersInputSchema,
  getUserByIdInputSchema,
  revokeSessionInputSchema,
  updateRoleInputSchema,
} from "./users.types"
import * as service from "./users.service"

export const usersRouter = router({
  list: adminProcedure.input(listUsersInputSchema).query(async ({ ctx, input }) => {
    return service.listUsers(ctx.db, input)
  }),

  byId: adminProcedure.input(getUserByIdInputSchema).query(async ({ ctx, input }) => {
    return service.getUserById(ctx.db, input.id)
  }),

  revokeSession: adminProcedure.input(revokeSessionInputSchema).mutation(async ({ ctx, input }) => {
    return service.revokeSession(ctx.db, input.sessionId)
  }),

  updateRole: adminProcedure.input(updateRoleInputSchema).mutation(async ({ ctx, input }) => {
    return service.updateUserRole(ctx.db, input, ctx.user)
  }),
})
