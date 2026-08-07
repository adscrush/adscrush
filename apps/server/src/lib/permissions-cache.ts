import type { Database } from "@adscrush/db"
import {
  filterValidPermissions,
  type Permission,
} from "@adscrush/shared/constants/permissions"
import { logger } from "~/lib/logger"
import { eq } from "@adscrush/db/drizzle"
import { employees } from "@adscrush/db/schema"
import Redis from "ioredis"
import { LRUCache } from "lru-cache"
import { env } from "~/env"

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

export interface PermissionCache {
  getPermissions(employeeId: string, db: Database): Promise<Permission[]>
  invalidatePermissions(employeeId: string): Promise<void>
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CACHE_KEY = (id: string) => `permissions:${id}`
const TTL_SECONDS = env.PERMISSION_CACHE_TTL_SECONDS ?? 300

// ---------------------------------------------------------------------------
// Redis client (lazy, only when REDIS_URL is set)
// ---------------------------------------------------------------------------

let redisClient: Redis | null = null

function getRedis(): Redis | null {
  const url = env.REDIS_URL
  if (!url) return null

  if (!redisClient) {
    redisClient = new Redis(url, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
      lazyConnect: true,
    })

    redisClient.on("error", (err: Error) => {
      logger({ module: "permissions-cache" }).error("Redis connection error", { err: err.message })
    })
  }

  return redisClient
}

// ---------------------------------------------------------------------------
// In-memory LRU fallback — bounded to prevent unbounded growth under load
// ---------------------------------------------------------------------------

/**
 * LRU cache capped at 10,000 entries. When full, the least-recently-used entry
 * is evicted first. This prevents memory exhaustion when thousands of employees
 * access the system simultaneously.
 */
const memCache = new LRUCache<string, { permissions: Permission[]; expiresAt: number }>({
  max: 10_000,
  ttl: TTL_SECONDS * 1000,
})

function memGet(key: string): Permission[] | null {
  const entry = memCache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    memCache.delete(key)
    return null
  }
  return entry.permissions
}

function memSet(key: string, permissions: Permission[]): void {
  memCache.set(key, {
    permissions,
    expiresAt: Date.now() + TTL_SECONDS * 1000,
  })
}

function memDel(key: string): void {
  memCache.delete(key)
}

// ---------------------------------------------------------------------------
// DB loader
// ---------------------------------------------------------------------------

async function loadFromDb(
  employeeId: string,
  db: Database,
): Promise<Permission[]> {
  const row = await db.query.employees.findFirst({
    where: eq(employees.id, employeeId),
    columns: { permissions: true },
  })

  const raw = (row?.permissions ?? []) as string[]
  return filterValidPermissions(raw)
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

async function getPermissions(
  employeeId: string,
  db: Database,
): Promise<Permission[]> {
  const redis = getRedis()
  const key = CACHE_KEY(employeeId)

  if (redis) {
    // --- Redis path ---
    try {
      const cached = await redis.get(key)
      if (cached !== null) {
        return JSON.parse(cached) as Permission[]
      }
    } catch (err) {
      logger({ module: "permissions-cache", employeeId }).error(
        "Redis GET failed, falling back to DB",
        { err: err instanceof Error ? err.message : String(err) },
      )
      return loadFromDb(employeeId, db)
    }

    // Cache miss — load from DB
    const permissions = await loadFromDb(employeeId, db)

    try {
      await redis.set(key, JSON.stringify(permissions), "EX", TTL_SECONDS)
    } catch (err) {
      logger({ module: "permissions-cache", employeeId }).error(
        "Redis SET failed",
        { err: err instanceof Error ? err.message : String(err) },
      )
    }

    return permissions
  }

  // --- In-memory LRU fallback path ---
  const cached = memGet(key)
  if (cached !== null) {
    return cached
  }

  const permissions = await loadFromDb(employeeId, db)
  memSet(key, permissions)
  return permissions
}

async function invalidatePermissions(employeeId: string): Promise<void> {
  const key = CACHE_KEY(employeeId)
  const redis = getRedis()

  if (redis) {
    try {
      await redis.del(key)
    } catch (err) {
      logger({ module: "permissions-cache", employeeId }).error(
        "Redis DEL failed",
        { err: err instanceof Error ? err.message : String(err) },
      )
    }
  }

  memDel(key)
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

export const permissionsCache: PermissionCache = {
  getPermissions,
  invalidatePermissions,
}
