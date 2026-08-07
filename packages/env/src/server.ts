import { z } from "zod"
import { sharedEnvValidators } from "./shared"

/**
 * Server-only env validators.
 * Combines shared vars with server-specific vars.
 */
export const serverEnvValidators = {
  ...sharedEnvValidators,

  // Server
  PORT: z.coerce.number().default(4000),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),

  // Public URLs
  PUBLIC_FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  PUBLIC_API_URL: z.string().url().default("http://localhost:4000"),
  FRONTEND_APP_URL: z.string().url().default("http://localhost:3000"),

  // Social Login
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),

  // SMTP Mailing
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().default(465),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),
  SMTP_FROM: z.string().min(1),

  // Tracking app
  TRACKING_APP_URL: z.string().url().default("http://localhost:3002"),

  // Bunny CDN & Storage
  BUNNY_STORAGE_REGION: z.string().default("de"),
  BUNNY_STORAGE_ZONE: z.string().default("merlin-02"),
  BUNNY_STORAGE_API_KEY: z.string().min(1),
  BUNNY_CDN_URL: z.string().url().default("https://merlin-02.b-cdn.net"),

  // PII encryption (optional, used by tracking and potentially server)
  PII_MASTER_KEY: z.string().min(1).optional(),
  PII_PEPPER: z.string().min(1).optional(),

  // Tracking-specific (optional, only used by tracking app)
  TRACKING_PORT: z.coerce.number().default(3002),
  GEOIP_ASN_DB_PATH: z.string().default("/var/lib/geoip/GeoLite2-ASN.mmdb"),
  LEAD_API_KEY: z.string().min(1).optional(),

  // Permission cache
  PERMISSION_CACHE_TTL_SECONDS: z.coerce.number().default(300),

  // DB connection pool config (used by tracking and server)
  DB_POOL_MAX: z.coerce.number().default(10),
  DB_IDLE_TIMEOUT_MS: z.coerce.number().default(30_000),
  DB_CONNECT_TIMEOUT_MS: z.coerce.number().default(10_000),
  DB_MAX_LIFETIME_MS: z.coerce.number().default(300_000),
} as const

export type ServerEnv = z.infer<z.ZodObject<typeof serverEnvValidators>>

/**
 * Parse and validate server env vars from process.env.
 * Apps must load dotenv BEFORE calling this.
 *
 * @param overrides - Optional env var overrides (useful for testing)
 */
export function parseServerEnv(overrides?: Record<string, unknown>): ServerEnv {
  const merged = { ...process.env, ...overrides }
  const { data, error } = z.object(serverEnvValidators).safeParse(merged)

  if (error) {
    const errorMessage = `❌ Invalid env - ${Object.entries(error.flatten().fieldErrors)
      .map(([key, errors]) => `${key}: ${errors?.join(",")}`)
      .join(" | ")}`
    throw new Error(errorMessage)
  }

  return data
}
