import { z } from "zod"
import { adminProcedure, protectedProcedure, router } from "~/lib/trpc/init"
import {
  categoryOutputSchema,
  listCategoriesInputSchema,
  createCategoryInputSchema,
  updateCategoryInputSchema,
  bulkDeleteCategoriesInputSchema,
} from "./categories.types"
import * as service from "./categories.service"

export const categoriesRouter = router({
  list: protectedProcedure
    .input(listCategoriesInputSchema)
    .output(z.object({ items: z.array(categoryOutputSchema), pageCount: z.number(), total: z.number() }))
    .query(async ({ ctx, input }) => service.listCategories(ctx.db, input)),

  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .output(categoryOutputSchema)
    .query(async ({ ctx, input }) => service.getCategoryById(ctx.db, input.id)),

  search: protectedProcedure
    .input(z.object({ q: z.string().optional() }))
    .query(async ({ ctx, input }) => service.searchCategories(ctx.db, input.q)),

  metafields: protectedProcedure
    .input(z.object({ categoryId: z.string() }))
    .query(async ({ ctx, input }) => service.getCategoryMetafields(ctx.db, input.categoryId)),

  create: adminProcedure
    .input(createCategoryInputSchema)
    .mutation(async ({ ctx, input }) => service.createCategory(ctx.db, input)),

  update: adminProcedure
    .input(updateCategoryInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      return service.updateCategory(ctx.db, id, data)
    }),

  bulkDelete: adminProcedure
    .input(bulkDeleteCategoriesInputSchema)
    .mutation(async ({ ctx, input }) => service.bulkDelete(ctx.db, input.ids)),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => service.deleteCategory(ctx.db, input.id)),
})
