import { createDatabase } from "@adscrush/db"
import { env } from "@/env"

export const db = createDatabase({
    url: env.DATABASE_URL,
})
