import "dotenv/config"
import { parseServerEnv } from "@adscrush/env/server"

export const env = parseServerEnv()
export type Env = typeof env
