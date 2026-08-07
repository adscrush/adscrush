import { Elysia } from "elysia"
import { logger } from "../../lib/logger.js"
import { handleLeadSubmission } from "./lead.service.js"
import env from "../../config/env.js"

const log = logger({ module: "lead-pixel" })

if (!env.LEAD_API_KEY) {
  log.warn("LEAD_API_KEY not configured — lead pixel is open to unauthenticated requests")
}

const PIXEL_GIF = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64")

export const leadPixelRoute = new Elysia().get("/lead/pixel", async ({ query, request, set }) => {
  const tid = (query.tid as string) || (query.click_id as string)

  if (tid) {
    // Fire-and-forget: don't block the pixel response.
    // handleLeadSubmission resolves with an error object (it doesn't throw),
    // so we must inspect the result — otherwise failures are silently dropped.
    handleLeadSubmission({
      tid,
      name: query.name as string | undefined,
      phone: query.phone as string | undefined,
      email: query.email as string | undefined,
      address: query.address as string | undefined,
      pincode: query.pincode as string | undefined,
      city: query.city as string | undefined,
      state: query.state as string | undefined,
      sub1: query.sub1 as string | undefined,
      sub2: query.sub2 as string | undefined,
      sub3: query.sub3 as string | undefined,
      sub4: query.sub4 as string | undefined,
      sub5: query.sub5 as string | undefined,
      payout: query.payout as string | undefined,
      currency: query.currency as string | undefined,
      method: "pixel",
      request,
    })
      .then((result) => {
        if (!result.success) {
          log.error("Lead pixel track failed", {
            tid,
            error: result.error,
            status: result.status,
          })
        }
      })
      .catch((err) => log.error("Lead pixel track failed", { message: err instanceof Error ? err.message : String(err) }))
  }

  set.headers["content-type"] = "image/gif"
  set.headers["cache-control"] = "no-cache, no-store, must-revalidate"
  return new Response(PIXEL_GIF)
})
