import { createAuth } from "@adscrush/auth"
import { db } from "./db"
import { env } from "../env"

export const auth = createAuth({
  db: db,
  secret: env.BETTER_AUTH_SECRET,
  apiURL: env.PUBLIC_API_URL,
  appURL: env.FRONTEND_APP_URL,
  turnstileSecretKey: env.TURNSTILE_SECRET_KEY,
})
