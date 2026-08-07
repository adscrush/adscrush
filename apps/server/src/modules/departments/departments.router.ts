import { z } from "zod"
import { adminProcedure, protectedProcedure, router } from "~/lib/trpc/init"
import {
  departmentOutputSchema,
  listDepartmentsInputSchema,
  createDepartmentInputSchema,
  updateDepartmentInputSchema,
  bulkUpdateDepartmentStatusInputSchema,
  bulkDeleteDepartmentsInputSchema,
} from "./departments.types"
import * as service from "./departments.service"

export const departmentsRouter = router({
  list: protectedProcedure
    .input(listDepartmentsInputSchema)
    .output(z.object({ items: z.array(departmentOutputSchema), pageCount: z.number(), total: z.number() }))
    .query(async ({ ctx, input }) => service.listDepartments(ctx.db, input)),

  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .output(departmentOutputSchema)
    .query(async ({ ctx, input }) => service.getDepartmentById(ctx.db, input.id)),

  search: protectedProcedure
    .input(z.object({ q: z.string().optional() }))
    .query(async ({ ctx, input }) => service.searchDepartments(ctx.db, input.q)),

  create: adminProcedure
    .input(createDepartmentInputSchema)
    .mutation(async ({ ctx, input }) => service.createDepartment(ctx.db, input)),

  update: adminProcedure
    .input(updateDepartmentInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      return service.updateDepartment(ctx.db, id, data)
    }),

  bulkUpdateStatus: adminProcedure
    .input(bulkUpdateDepartmentStatusInputSchema)
    .mutation(async ({ ctx, input }) => service.bulkUpdateStatus(ctx.db, input.ids, input.status)),

  bulkDelete: adminProcedure
    .input(bulkDeleteDepartmentsInputSchema)
    .mutation(async ({ ctx, input }) => service.bulkDelete(ctx.db, input.ids)),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => service.deleteDepartment(ctx.db, input.id)),
})
