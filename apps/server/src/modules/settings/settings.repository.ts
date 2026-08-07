import { eq, inArray } from "@adscrush/db/drizzle"
import { settings } from "@adscrush/db/schema"
import type { Database } from "@adscrush/db"

const SETTING_KEYS = ["allowed_login_roles", "timezone", "currency"] as const

const DEFAULT_VALUES: Record<string, string> = {
  allowed_login_roles: "",
  timezone: "UTC",
  currency: "USD",
}

export async function getAllSettings(db: Database) {
  const rows = await db
    .select()
    .from(settings)
    .where(inArray(settings.key, SETTING_KEYS as unknown as string[]))

  const result: Record<string, string> = {}
  for (const key of SETTING_KEYS) {
    const row = rows.find((r) => r.key === key)
    result[key] = row?.value ?? DEFAULT_VALUES[key] ?? ""
  }

  return result
}

export async function upsertSetting(db: Database, key: string, value: string) {
  const existing = await db
    .select({ id: settings.id })
    .from(settings)
    .where(eq(settings.key, key))
    .limit(1)

  if (existing.length > 0) {
    await db.update(settings).set({ value }).where(eq(settings.key, key))
  } else {
    await db.insert(settings).values({ key, value })
  }
}
