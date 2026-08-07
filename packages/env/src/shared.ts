import { z } from "zod"

/**
 * Shared env validators used across multiple apps.
 * These are the base vars that every app needs.
 */
export const sharedEnvValidators = {
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().default("redis://localhost:6379"),
  BETTER_AUTH_SECRET: z.string().min(1),

  // Turnstile captcha (optional — verification is skipped when unset)
  TURNSTILE_SECRET_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1).optional(),
} as const

export type SharedEnv = z.infer<z.ZodObject<typeof sharedEnvValidators>>
