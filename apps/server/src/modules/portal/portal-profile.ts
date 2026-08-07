import { eq } from "@adscrush/db/drizzle"
import { employees, mediaBuyers, users } from "@adscrush/db/schema"
import { z } from "zod"
import { mediaBuyerProcedure, router } from "~/lib/trpc/init"

export const portalProfileRouter = router({

  // ─── Profile ─────────────────────────────────────────────────────────────

  profile: mediaBuyerProcedure.query(async ({ ctx }) => {
    const { mediaBuyer } = ctx

    let accountManager: { id: string; name: string } | null = null
    if (mediaBuyer.accountManagerId) {
      const emp = await ctx.db
        .select({ id: employees.id, userId: employees.userId })
        .from(employees)
        .where(eq(employees.id, mediaBuyer.accountManagerId))
        .limit(1)
      if (emp[0]) {
        const u = await ctx.db.select({ name: users.name }).from(users).where(eq(users.id, emp[0].userId)).limit(1)
        accountManager = { id: emp[0].id, name: u[0]?.name ?? "" }
      }
    }

    return {
      id: mediaBuyer.id,
      name: mediaBuyer.name,
      email: mediaBuyer.email,
      companyName: mediaBuyer.companyName,
      phoneNumber: mediaBuyer.phoneNumber,
      country: mediaBuyer.country,
      trafficSources: mediaBuyer.trafficSources,
      paymentMethod: mediaBuyer.paymentMethod,
      paymentDetails: mediaBuyer.paymentDetails,
      status: mediaBuyer.status,
      accountManager,
      createdAt: mediaBuyer.createdAt,
    }
  }),

  updateProfile: mediaBuyerProcedure
    .input(
      z.object({
        name: z.string().min(1).optional(),
        companyName: z.string().optional(),
        phoneNumber: z.string().optional(),
        country: z.string().optional(),
        trafficSources: z.array(z.string()).optional(),
        paymentMethod: z.string().optional(),
        paymentDetails: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(mediaBuyers)
        .set(input)
        .where(eq(mediaBuyers.id, ctx.mediaBuyer.id))
        .returning()
      return updated
    }),
})