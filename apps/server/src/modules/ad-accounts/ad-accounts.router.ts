import { z } from "zod"
import { permissionProcedure, router } from "~/lib/trpc/init"
import {
  adAccountOutputSchema,
  listAdAccountsInputSchema,
  bulkUpdateAdAccountStatusInputSchema,
  bulkUpdateMediaBuyerInputSchema,
  bulkDeleteAdAccountsInputSchema,
  bulkImportInputSchema,
  createAdAccountSchema,
  updateAdAccountSchema,
} from "./ad-accounts.types"
import * as service from "./ad-accounts.service"

export const adAccountsRouter = router({
  list: permissionProcedure("ad_accounts.view")
    .input(listAdAccountsInputSchema)
    .output(
      z.object({
        items: z.array(adAccountOutputSchema),
        pageCount: z.number(),
        total: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { db } = ctx
      return service.listAdAccounts(db, input)
    }),

  byId: permissionProcedure("ad_accounts.view")
    .input(z.object({ id: z.string() }))
    .output(adAccountOutputSchema)
    .query(async ({ ctx, input }) => {
      const { db } = ctx
      return service.getAdAccountById(db, input.id)
    }),

  create: permissionProcedure("ad_accounts.manage")
    .input(createAdAccountSchema)
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx
      return service.createAdAccount(db, input)
    }),

  update: permissionProcedure("ad_accounts.manage")
    .input(z.object({ id: z.string(), data: updateAdAccountSchema }))
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx
      return service.updateAdAccount(db, input.id, input.data)
    }),

  delete: permissionProcedure("ad_accounts.manage")
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx
      return service.deleteAdAccount(db, input.id)
    }),

  getSpend: permissionProcedure("ad_accounts.view")
    .input(z.object({ id: z.string(), dateFrom: z.string().optional(), dateTo: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const { db } = ctx
      return service.getAdAccountSpend(db, input.id, input.dateFrom, input.dateTo)
    }),

  syncSpend: permissionProcedure("ad_accounts.manage")
    .input(z.object({ id: z.string() }))
    .mutation(async () => {
      return { success: true, message: "Spend sync triggered (worker implementation pending)" }
    }),

  tagCreative: permissionProcedure("ad_accounts.manage")
    .input(z.object({ creativeId: z.string(), performed: z.boolean().default(true) }))
    .mutation(async () => {
      return { success: true }
    }),

  untagCreative: permissionProcedure("ad_accounts.manage")
    .input(z.object({ creativeId: z.string() }))
    .mutation(async () => {
      return { success: true }
    }),

  bulkImport: permissionProcedure("ad_accounts.manage")
    .input(bulkImportInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx
      return service.bulkImport(db, input.accounts)
    }),

  bulkUpdateStatus: permissionProcedure("ad_accounts.manage")
    .input(bulkUpdateAdAccountStatusInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx
      return service.bulkUpdateStatus(db, input.ids, input.status)
    }),

  bulkUpdateMediaBuyer: permissionProcedure("ad_accounts.manage")
    .input(bulkUpdateMediaBuyerInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx
      return service.bulkUpdateMediaBuyer(db, input.ids, input.mediaBuyerId)
    }),

  bulkDelete: permissionProcedure("ad_accounts.manage")
    .input(bulkDeleteAdAccountsInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx
      return service.bulkDelete(db, input.ids)
    }),
})
