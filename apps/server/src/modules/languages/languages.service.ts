import { type languages } from "@adscrush/db/schema"
import type { Database } from "@adscrush/db"
import { throwNotFound, throwInternalError } from "~/lib/helpers/errors"
import type { ListLanguagesInput } from "./languages.types"
import * as repository from "./languages.repository"

export async function listLanguages(db: Database, input: ListLanguagesInput) {
  return repository.findLanguagesPaginated(db, input)
}

export async function getAllActiveLanguages(db: Database) {
  return repository.findAllActiveLanguages(db)
}

export async function getLanguageById(db: Database, id: string) {
  const result = await repository.findLanguageById(db, id)
  if (!result) throwNotFound("Language")
  return result
}

export async function searchLanguages(db: Database, q?: string) {
  return repository.searchLanguages(db, q)
}

export async function createLanguage(db: Database, data: typeof languages.$inferInsert) {
  const language = await repository.createLanguage(db, data)
  if (!language) throwInternalError("Failed to create language")
  return language
}

export async function updateLanguage(db: Database, id: string, data: Partial<typeof languages.$inferInsert>) {
  const updated = await repository.updateLanguage(db, id, data)
  if (!updated) throwNotFound("Language")
  return updated
}

export async function deleteLanguage(db: Database, id: string) {
  const deleted = await repository.deleteLanguage(db, id)
  if (!deleted) throwNotFound("Language")
  return { success: true }
}

export async function bulkDelete(db: Database, ids: string[]) {
  return repository.bulkDeleteLanguages(db, ids)
}
