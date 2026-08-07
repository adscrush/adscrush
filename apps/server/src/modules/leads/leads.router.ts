import { z } from "zod"
import { getScope } from "~/lib/scope"
import { permissionProcedure, router } from "~/lib/trpc/init"
import { leadOutputSchema, listLeadsInputSchema } from "./leads.types"
import * as service from "./leads.service"

export const leadsRouter = router({
  list: permissionProcedure("leads.view")
    .input(listLeadsInputSchema)
    .output(
      z.object({
        items: z.array(leadOutputSchema),
        total: z.number(),
        pageCount: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { db, user } = ctx
      const scope = await getScope(db, user.id, user.role)

      return service.listLeads(db, input, scope, user.id, user.role)
    }),

  byId: permissionProcedure("leads.view")
    .input(z.object({ id: z.string() }))
    .output(leadOutputSchema)
    .query(async ({ ctx, input }) => {
      const { db, user } = ctx
      const scope = await getScope(db, user.id, user.role)

      return service.getLeadById(db, input.id, scope, user.role)
    }),

  updateStatus: permissionProcedure("leads.manage")
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["pending", "approved", "rejected"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { db, user } = ctx

      return service.updateLeadStatus(db, input.id, input.status, user.id)
    }),

  export: permissionProcedure("report.export")
    .input(listLeadsInputSchema)
    .query(async ({ ctx, input }) => {
      const { db, user } = ctx
      const scope = await getScope(db, user.id, user.role)

      return service.exportLeads(db, input, scope, user.role)
    }),
})
