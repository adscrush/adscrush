import { Elysia } from "elysia"
import { cors } from "@elysiajs/cors"
import env from "./config/env.js"
import { healthRoute } from "./features/health/health.route.js"
import { clickRoute } from "./features/click/route.js"
import { pixelRoute } from "./features/conversion/pixel.route.js"
import { conversionRoute } from "./features/conversion/track.route.js"
import { postbackRoute } from "./features/conversion/postback.route.js"
import { leadPostbackRoute } from "./features/lead/postback.route.js"
import { leadPixelRoute } from "./features/lead/pixel.route.js"
import { leadStatusRoute } from "./features/lead/status.route.js"
import { cacheRoute } from "./features/cache/cache.route.js"
import { logger } from "./lib/logger.js"

const log = logger()

const app = new Elysia()
  .use(
    cors({
      origin: true,
      methods: ["GET", "POST", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
    })
  )
  .onError(({ error, set, request }) => {
    log.error(`Tracking error at ${request.url}`, { message: error instanceof Error ? error.message : String(error) })

    if (set.status === 404) {
      return { error: "NOT_FOUND", status: 404, message: "The requested resource was not found" }
    }

    set.status = 500
    return { error: "INTERNAL_SERVER_ERROR", status: 500, message: "An unexpected error occurred" }
  })
  .use(healthRoute)
  .use(clickRoute)
  .use(pixelRoute)
  .use(conversionRoute)
  .use(postbackRoute)
  .use(leadPostbackRoute)
  .use(leadPixelRoute)
  .use(leadStatusRoute)
  .use(cacheRoute)
  .all("*", ({ request, set }) => {
    log.warn(`Unhandled request: ${request.method} ${request.url}`)
    set.status = 404
    return { error: "NOT_FOUND", message: `No route found for ${new URL(request.url).pathname}` }
  })
  .listen(env.TRACKING_PORT)

log.info(`AdsCrush Tracking running at http://localhost:${app.server?.port}`)

export type TrackingApp = typeof app
