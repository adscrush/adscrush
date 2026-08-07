import { z } from "zod"

/**
 * Client-only env validators (NEXT_PUBLIC_* vars).
 * These are safe to expose to the browser.
 */
export const clientEnvValidators = {
  NEXT_PUBLIC_APP_URL: z.string().min(1),
  NEXT_PUBLIC_API_URL: z.string().min(1),
  NEXT_PUBLIC_TRPC_API_URL: z.string().min(1).default("http://localhost:4000/trpc"),
  NEXT_PUBLIC_TRACKING_DOMAIN: z.string().min(1).default("http://localhost:3002"),
  NEXT_PUBLIC_BUNNY_CDN_URL: z.string().url().optional(),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1).optional(),
} as const

export type ClientEnv = z.infer<z.ZodObject<typeof clientEnvValidators>>
