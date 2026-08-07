import type { Database } from "@adscrush/db"
import type { UpdateSettingsInput } from "./settings.types"
import * as repository from "./settings.repository"

export async function getAllSettings(db: Database) {
  return repository.getAllSettings(db)
}

export async function updateSettings(db: Database, input: UpdateSettingsInput) {
  const entries: { key: string; value: string }[] = []

  if (input.allowedLoginRoles) {
    entries.push({ key: "allowed_login_roles", value: input.allowedLoginRoles.join(",") })
  }
  if (input.timezone) {
    entries.push({ key: "timezone", value: input.timezone })
  }
  if (input.currency) {
    entries.push({ key: "currency", value: input.currency })
  }

  for (const entry of entries) {
    await repository.upsertSetting(db, entry.key, entry.value)
  }

  return { success: true }
}
