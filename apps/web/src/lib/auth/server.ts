import { createAuth } from "@adscrush/auth"
import { db } from "../db"
import { env } from "@/env"

export const auth = createAuth({
  db: db,
  secret: env.BETTER_AUTH_SECRET,
  apiURL: env.NEXT_PUBLIC_API_URL,
  appURL: env.NEXT_PUBLIC_APP_URL,
  turnstileSecretKey: env.TURNSTILE_SECRET_KEY,
})
