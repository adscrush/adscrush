import { createDatabase, type Database } from "@adscrush/db"
import env from "./env.js"

const DB_POOL_MAX = parseInt(process.env["DB_POOL_MAX"] ?? "10", 10)
const DB_IDLE_TIMEOUT_MS = parseInt(process.env["DB_IDLE_TIMEOUT_MS"] ?? "30_000", 10)
const DB_CONNECT_TIMEOUT_MS = parseInt(process.env["DB_CONNECT_TIMEOUT_MS"] ?? "10_000", 10)
const DB_MAX_LIFETIME_MS = parseInt(process.env["DB_MAX_LIFETIME_MS"] ?? "300_000", 10)

let _db: Database | null = null

export function getDatabase(): Database {
  if (!_db) {
    _db = createDatabase({ 
      url: env.DATABASE_URL,
      max: DB_POOL_MAX,
      idle_timeout: DB_IDLE_TIMEOUT_MS,
      connect_timeout: DB_CONNECT_TIMEOUT_MS,
      max_lifetime: DB_MAX_LIFETIME_MS,
    })
  }
  return _db
}

export function resetDatabase(): void {
  _db = null
}
