import { auth } from "../../lib/auth"
import Elysia from "elysia"

// ─── Rate limiting (memory-backed) ─────────────────────────────────────────
// For production deployments behind a load balancer, replace this with a
// Redis-backed rate limiter (e.g., @elysiajs/rate-limit with Redis store).
// The limits below protect auth endpoints from brute force attacks.

const RATE_LIMIT_WINDOW_MS = 60_000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10    // 10 requests per window

const ipRequestCounts = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(request: Request): { allowed: boolean; retryAfter: number } {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"

  const now = Date.now()
  const entry = ipRequestCounts.get(ip)

  if (!entry || now > entry.resetAt) {
    ipRequestCounts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return { allowed: true, retryAfter: 0 }
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return { allowed: false, retryAfter }
  }

  entry.count++
  return { allowed: true, retryAfter: 0 }
}

// Periodic cleanup of stale rate limit entries to prevent memory leaks
setInterval(() => {
  const now = Date.now()
  for (const [ip, entry] of ipRequestCounts) {
    if (now > entry.resetAt) {
      ipRequestCounts.delete(ip)
    }
  }
}, 60_000)

export const authRoutes = new Elysia()
  .onBeforeHandle(({ request, set }) => {
    // Apply rate limiting to all auth routes
    const { allowed, retryAfter } = checkRateLimit(request)
    if (!allowed) {
      set.status = 429
      set.headers["retry-after"] = String(retryAfter)
      return {
        error: "RATE_LIMITED",
        message: `Too many requests. Please try again in ${retryAfter} seconds.`,
      }
    }
  })
  .get(
    "/auth/docs.json",
    async () => {
      const openAPISchema = await auth.api.generateOpenAPISchema()
      return openAPISchema
    },
    {
      detail: {
        tags: ["Authentication"],
        summary: "View Better Auth JSON Schema",
        hide: true,
      },
    }
  )
  .mount(auth.handler)
