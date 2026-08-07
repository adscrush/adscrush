import { createEnv } from "@t3-oss/env-nextjs"
import { serverEnvValidators, clientEnvValidators } from "@adscrush/env"

export const env = createEnv({
  server: {
    BETTER_AUTH_SECRET: serverEnvValidators.BETTER_AUTH_SECRET,
    DATABASE_URL: serverEnvValidators.DATABASE_URL,
    GOOGLE_CLIENT_ID: serverEnvValidators.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: serverEnvValidators.GOOGLE_CLIENT_SECRET,
    SMTP_HOST: serverEnvValidators.SMTP_HOST,
    SMTP_PORT: serverEnvValidators.SMTP_PORT,
    SMTP_USER: serverEnvValidators.SMTP_USER,
    SMTP_PASS: serverEnvValidators.SMTP_PASS,
    SMTP_FROM: serverEnvValidators.SMTP_FROM,
    TURNSTILE_SECRET_KEY: serverEnvValidators.TURNSTILE_SECRET_KEY,
  },

  client: clientEnvValidators,

  experimental__runtimeEnv: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_TRPC_API_URL: process.env.NEXT_PUBLIC_TRPC_API_URL,
    NEXT_PUBLIC_TRACKING_DOMAIN: process.env.NEXT_PUBLIC_TRACKING_DOMAIN,
    NEXT_PUBLIC_BUNNY_CDN_URL: process.env.NEXT_PUBLIC_BUNNY_CDN_URL,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  },
})
