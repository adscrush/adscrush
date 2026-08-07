import { Elysia } from "elysia"
import { getDatabase } from "../../config/database.js"
import { trackConversion } from "./service.js"
import { logger } from "../../lib/logger.js"

const log = logger({ module: "pixel" })

const PIXEL_GIF = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64")

export const pixelRoute = new Elysia().get("/conversion/pixel", async ({ query, request, set }) => {
  const clickId = (query.tid as string) || (query.click_id as string)

  if (clickId) {
    // Fire-and-forget: don't block the pixel response.
    // trackConversion resolves with an error object (it doesn't throw),
    // so we must inspect the result — otherwise failures are silently dropped.
    trackConversion(getDatabase(), {
      tid: clickId,
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
      method: (query.method as string) === "iframe" ? "iframe" : "pixel",
      referrerUrl: request.headers.get("referer") ?? undefined,
    })
      .then((result) => {
        if (!result.success) {
          log.error("Pixel conversion track failed", {
            tid: clickId,
            error: result.error,
          })
        }
      })
      .catch((err) => log.error("Pixel conversion track failed", { message: err instanceof Error ? err.message : String(err) }))
  }

  set.headers["content-type"] = "image/gif"
  set.headers["cache-control"] = "no-cache, no-store, must-revalidate"
  return new Response(PIXEL_GIF)
})
