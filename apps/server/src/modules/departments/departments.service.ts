import { type departments } from "@adscrush/db/schema"
import type { Database } from "@adscrush/db"
import { throwNotFound, throwInternalError } from "~/lib/helpers/errors"
import type { ListDepartmentsInput } from "./departments.types"
import * as repository from "./departments.repository"

export async function listDepartments(db: Database, input: ListDepartmentsInput) {
  return repository.findDepartmentsPaginated(db, input)
}

export async function getDepartmentById(db: Database, id: string) {
  const result = await repository.findDepartmentById(db, id)
  if (!result) throwNotFound("Department")
  return result
}

export async function searchDepartments(db: Database, q?: string) {
  return repository.searchDepartments(db, q)
}

export async function createDepartment(db: Database, data: typeof departments.$inferInsert) {
  const department = await repository.createDepartment(db, data)
  if (!department) throwInternalError("Failed to create department")
  return department
}

export async function updateDepartment(db: Database, id: string, data: Partial<typeof departments.$inferInsert>) {
  const updated = await repository.updateDepartment(db, id, data)
  if (!updated) throwNotFound("Department")
  return updated
}

export async function deleteDepartment(db: Database, id: string) {
  const deleted = await repository.deleteDepartment(db, id)
  if (!deleted) throwNotFound("Department")
  return { success: true }
}

export async function bulkUpdateStatus(db: Database, ids: string[], status: string) {
  return repository.bulkUpdateDepartmentStatus(db, ids, status)
}

export async function bulkDelete(db: Database, ids: string[]) {
  return repository.bulkDeleteDepartments(db, ids)
}
