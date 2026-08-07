import { z } from "zod"
import { getScope } from "~/lib/scope"
import { adminProcedure, permissionProcedure, router } from "~/lib/trpc/init"
import {
  listProductsInputSchema,
  productOutputSchema,
  productPopoverOutputSchema,
  bulkUpdateProductStatusInputSchema,
  bulkDeleteProductsInputSchema,
} from "./products.types"
import {
  createProductSchema,
  updateProductSchema,
} from "@adscrush/shared/validators/product.schema"
import * as service from "./products.service"

export const productsRouter = router({
  list: permissionProcedure("products.view")
    .input(listProductsInputSchema)
    .output(
      z.object({
        items: z.array(productOutputSchema),
        pageCount: z.number(),
        total: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { db, user } = ctx
      const scope = await getScope(db, user.id, user.role)
      return service.listProducts(db, input, scope)
    }),

  byId: permissionProcedure("products.view")
    .input(z.object({ id: z.string() }))
    .output(productOutputSchema)
    .query(async ({ ctx, input }) => {
      const { db, user } = ctx
      const scope = await getScope(db, user.id, user.role)
      return service.getProductById(db, input.id, scope)
    }),

  getForEdit: permissionProcedure("products.edit")
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { db, user } = ctx
      const scope = await getScope(db, user.id, user.role)
      return service.getProductForEdit(db, input.id, scope)
    }),

  create: permissionProcedure("products.create")
    .input(createProductSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, user } = ctx
      const scope = await getScope(db, user.id, user.role)
      return service.createProduct(db, input, scope)
    }),

  update: permissionProcedure("products.edit")
    .input(z.object({ id: z.string(), data: updateProductSchema }))
    .mutation(async ({ ctx, input }) => {
      const { db, user } = ctx
      const scope = await getScope(db, user.id, user.role)
      return service.updateProduct(db, input.id, input.data, scope)
    }),

  delete: permissionProcedure("products.delete")
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { db, user } = ctx
      const scope = await getScope(db, user.id, user.role)
      return service.deleteProduct(db, input.id, scope)
    }),

  popoverDetails: permissionProcedure("products.view")
    .input(z.object({ id: z.string() }))
    .output(productPopoverOutputSchema)
    .query(async ({ ctx, input }) => {
      const { db, user } = ctx
      const scope = await getScope(db, user.id, user.role)
      return service.getProductPopover(db, input.id, scope)
    }),

  uploadImage: permissionProcedure("products.edit")
    .input(
      z.object({
        advertiserId: z.string().min(1),
        file: z.string().min(1),
        fileName: z.string().min(1),
        mimeType: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { db, user } = ctx
      const scope = await getScope(db, user.id, user.role)
      return service.uploadImage(db, input, scope)
    }),

  search: permissionProcedure("products.view")
    .input(
      z.object({
        q: z.string().optional(),
        limit: z.number().int().positive().default(50),
        ids: z.array(z.string()).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { db, user } = ctx
      const scope = await getScope(db, user.id, user.role)
      return service.searchProducts(db, scope, input)
    }),

  options: permissionProcedure("products.view")
    .input(
      z.object({
        limit: z.number().int().positive().default(50),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { db, user } = ctx
      const scope = await getScope(db, user.id, user.role)
      return service.getProductOptions(db, scope, input)
    }),

  statusCounts: permissionProcedure("products.view").query(async ({ ctx }) => {
    const { db, user } = ctx
    const scope = await getScope(db, user.id, user.role)
    return service.getStatusCounts(db, scope)
  }),

  bulkUpdateStatus: permissionProcedure("products.edit")
    .input(bulkUpdateProductStatusInputSchema)
    .mutation(async ({ ctx, input }) => {
      return service.bulkUpdateStatus(ctx.db, input.ids, input.status)
    }),

  bulkDelete: adminProcedure
    .input(bulkDeleteProductsInputSchema)
    .mutation(async ({ ctx, input }) => {
      return service.bulkDelete(ctx.db, input.ids)
    }),
})
