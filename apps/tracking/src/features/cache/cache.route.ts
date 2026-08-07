import { Elysia } from "elysia"

// Cache invalidation endpoint removed with offer-targeting.
// Targeting rules were deleted — no cache to invalidate.
export const cacheRoute = new Elysia()
