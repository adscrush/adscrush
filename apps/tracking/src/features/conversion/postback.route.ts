import { Elysia, t } from "elysia"
import { getDatabase } from "../../config/database.js"
import { trackConversion } from "./service.js"
import { logger } from "../../lib/logger.js"

const log = logger({ module: "postback" })

const PostbackQuerySchema = t.Object({
  tid: t.Optional(t.String()),
  click_id: t.Optional(t.String()),
  payout: t.Optional(t.String()),
  sale_amount: t.Optional(t.String()),
  currency: t.Optional(t.String()),
  event: t.Optional(t.String()),
  coupon: t.Optional(t.String()),
  adv_sub1: t.Optional(t.String()),
  adv_sub2: t.Optional(t.String()),
  adv_sub3: t.Optional(t.String()),
  adv_sub4: t.Optional(t.String()),
  adv_sub5: t.Optional(t.String()),
})

export const postbackRoute = new Elysia().get("/conversion/postback", async ({ query, request, set }) => {
  const tid = (query.tid ?? query.click_id) as string | undefined

  if (!tid) {
    set.status = 400
    return { success: false, error: "INVALID_PARAMETERS", message: "tid or click_id is required" }
  }

  try {
    const result = await trackConversion(getDatabase(), {
      tid,
      event: (query.event as string) ?? "conversion",
      payout: query.payout as string | undefined,
      saleAmount: query.sale_amount as string | undefined,
      currency: query.currency as string | undefined,
      coupon: query.coupon as string | undefined,
      advSub1: query.adv_sub1 as string | undefined,
      advSub2: query.adv_sub2 as string | undefined,
      advSub3: query.adv_sub3 as string | undefined,
      advSub4: query.adv_sub4 as string | undefined,
      advSub5: query.adv_sub5 as string | undefined,
      ipAddress:
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
      method: "postback",
      referrerUrl: request.headers.get("referer") ?? undefined,
    })

    if (!result.success) {
      set.status = 400
      return result
    }

    return result
  } catch (error) {
    log.error("Postback conversion tracking failed", {
      tid,
      message: error instanceof Error ? error.message : String(error),
    })
    set.status = 500
    return { success: false, error: "TRACKING_ERROR", message: "Failed to track conversion via postback" }
  }
}, {
  query: PostbackQuerySchema,
})
