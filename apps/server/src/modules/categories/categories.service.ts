import { type categories } from "@adscrush/db/schema"
import type { Database } from "@adscrush/db"
import { throwNotFound, throwInternalError } from "~/lib/helpers/errors"
import type { ListCategoriesInput } from "./categories.types"
import * as repository from "./categories.repository"

export async function listCategories(db: Database, input: ListCategoriesInput) {
  return repository.findCategoriesPaginated(db, input)
}

export async function getCategoryById(db: Database, id: string) {
  const result = await repository.findCategoryById(db, id)
  if (!result) throwNotFound("Category")
  return result
}

export async function searchCategories(db: Database, q?: string) {
  return repository.searchCategories(db, q)
}

export async function getCategoryMetafields(db: Database, categoryId: string) {
  return repository.findCategoryMetafields(db, categoryId)
}

export async function createCategory(db: Database, data: typeof categories.$inferInsert) {
  const category = await repository.createCategory(db, data)
  if (!category) throwInternalError("Failed to create category")
  return category
}

export async function updateCategory(db: Database, id: string, data: Partial<typeof categories.$inferInsert>) {
  const updated = await repository.updateCategory(db, id, data)
  if (!updated) throwNotFound("Category")
  return updated
}

export async function deleteCategory(db: Database, id: string) {
  const deleted = await repository.deleteCategory(db, id)
  if (!deleted) throwNotFound("Category")
  return { success: true }
}

export async function bulkDelete(db: Database, ids: string[]) {
  return repository.bulkDeleteCategories(db, ids)
}
