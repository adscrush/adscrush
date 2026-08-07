import "dotenv/config"
import { parseServerEnv } from "@adscrush/env/server"

const env = parseServerEnv()
export type Env = typeof env
export default env
