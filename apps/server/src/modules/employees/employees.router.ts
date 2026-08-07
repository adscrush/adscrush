import { z } from "zod"
import { adminProcedure, permissionProcedure, protectedProcedure, router } from "~/lib/trpc/init"
import {
  employeeOutputSchema,
  listEmployeesInputSchema,
  createEmployeeInputSchema,
  updateEmployeeInputSchema,
  changeEmployeePasswordInputSchema,
  updateEmployeeAccessInputSchema,
  bulkUpdateEmployeeStatusInputSchema,
  bulkDeleteEmployeesInputSchema,
  getPermissionsInputSchema,
  updatePermissionsInputSchema,
  clonePermissionsInputSchema,
  applyPresetInputSchema,
} from "./employees.types"
import * as service from "./employees.service"

export const employeesRouter = router({
  list: adminProcedure
    .input(listEmployeesInputSchema)
    .output(
      z.object({
        items: z.array(employeeOutputSchema),
        pageCount: z.number(),
        total: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      return service.listEmployees(ctx.db, input)
    }),

  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .output(employeeOutputSchema)
    .query(async ({ ctx, input }) => {
      return service.getEmployeeById(ctx.db, input.id)
    }),

  search: permissionProcedure("employees.view")
    .input(z.object({ q: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return service.searchEmployees(ctx.db, input.q)
    }),

  create: adminProcedure.input(createEmployeeInputSchema).mutation(async ({ ctx, input }) => {
    return service.createEmployee(ctx.db, ctx.auth, ctx.user, input)
  }),

  update: adminProcedure.input(updateEmployeeInputSchema).mutation(async ({ ctx, input }) => {
    return service.updateEmployee(ctx.db, ctx.user, input)
  }),

  changePassword: adminProcedure
    .input(changeEmployeePasswordInputSchema)
    .mutation(async ({ ctx, input }) => {
      return service.changePassword(ctx.db, ctx.auth, ctx.req, input.id, input.password)
    }),

  updateAccess: adminProcedure
    .input(updateEmployeeAccessInputSchema)
    .mutation(async ({ ctx, input }) => {
      return service.updateAccess(ctx.db, input)
    }),

  bulkUpdateStatus: adminProcedure
    .input(bulkUpdateEmployeeStatusInputSchema)
    .mutation(async ({ ctx, input }) => {
      return service.bulkUpdateStatus(ctx.db, input.ids, input.status)
    }),

  bulkDelete: adminProcedure
    .input(bulkDeleteEmployeesInputSchema)
    .mutation(async ({ ctx, input }) => {
      return service.bulkDelete(ctx.db, input.ids)
    }),

  delete: adminProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    return service.deleteEmployee(ctx.db, input.id)
  }),

  getPermissions: adminProcedure
    .input(getPermissionsInputSchema)
    .output(z.array(z.string()))
    .query(async ({ ctx, input }) => {
      return service.getPermissions(ctx.db, input.employeeId)
    }),

  getMyPermissions: protectedProcedure.output(z.array(z.string())).query(async ({ ctx }) => {
    return service.getMyPermissions(ctx.db, ctx.user)
  }),

  updatePermissions: adminProcedure
    .input(updatePermissionsInputSchema)
    .mutation(async ({ ctx, input }) => {
      return service.updatePermissions(ctx.db, input.employeeId, input.permissions)
    }),

  clonePermissions: adminProcedure
    .input(clonePermissionsInputSchema)
    .mutation(async ({ ctx, input }) => {
      return service.clonePermissions(ctx.db, input.sourceEmployeeId, input.targetEmployeeId)
    }),

  applyPreset: adminProcedure.input(applyPresetInputSchema).mutation(async ({ ctx, input }) => {
    return service.applyPreset(ctx.db, input.employeeId, input.preset)
  }),
})
