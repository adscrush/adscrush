import { Elysia, t } from "elysia"
import { getDatabase } from "../../config/database.js"
import { trackConversion } from "./service.js"
import { logger } from "../../lib/logger.js"

const log = logger({ module: "conversion" })

const ConversionSchema = t.Object({
  tid: t.Optional(t.String()),
  click_id: t.Optional(t.String()),
  offer_id: t.Optional(t.String()),
  coupon: t.Optional(t.String()),
  event: t.Optional(t.String()),
  payout: t.Optional(t.String()),
  sale_amount: t.Optional(t.String()),
  currency: t.Optional(t.String()),
  adv_sub1: t.Optional(t.String()),
  adv_sub2: t.Optional(t.String()),
  adv_sub3: t.Optional(t.String()),
  adv_sub4: t.Optional(t.String()),
  adv_sub5: t.Optional(t.String()),
})

export const conversionRoute = new Elysia().post("/conversion/track", async ({ body, request, set }) => {
  const tid = (body.tid || body.click_id)

  if (!tid) {
    set.status = 400
    return { success: false, error: "INVALID_PARAMETERS", message: "tid or click_id is required" }
  }

  try {
    const trackingResult = await trackConversion(getDatabase(), {
      tid,
      event: body.event ?? "conversion",
      payout: body.payout,
      saleAmount: body.sale_amount,
      currency: body.currency,
      coupon: body.coupon,
      advSub1: body.adv_sub1,
      advSub2: body.adv_sub2,
      advSub3: body.adv_sub3,
      advSub4: body.adv_sub4,
      advSub5: body.adv_sub5,
      ipAddress:
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
      method: "s2s",
      referrerUrl: request.headers.get("referer") ?? undefined,
    })

    if (!trackingResult.success) {
      set.status = 400
      return trackingResult
    }

    return trackingResult
  } catch (error) {
    log.error("Critical error in conversion tracking", { message: error instanceof Error ? error.message : String(error) })
    set.status = 500
    return { success: false, error: "TRACKING_ERROR", message: "Failed to track conversion" }
  }
}, {
  body: ConversionSchema,
})
