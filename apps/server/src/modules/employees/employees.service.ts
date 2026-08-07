import type { Auth } from "@adscrush/auth"
import { eq } from "@adscrush/db/drizzle"
import { users } from "@adscrush/db/schema"
import { TRPCError } from "@trpc/server"
import { ROLES, type ALL_ROLES } from "@adscrush/shared/constants/roles"
import { canManageRole } from "@adscrush/shared/utils/roles"
import {
  ALL_PERMISSION_KEYS,
  MEDIA_BUYER_PERMISSIONS,
  PERMISSION_PRESETS,
  filterValidPermissions,
  type Permission,
} from "@adscrush/shared/constants/permissions"
import type { Database } from "@adscrush/db"
import type { Employee } from "@adscrush/db/schema"
import type { ListEmployeesInput } from "./employees.types"
import * as repository from "./employees.repository"
import { permissionsCache } from "~/lib/permissions-cache"
import { setUserPassword } from "~/lib/user-password"

// ─── Query Operations ────────────────────────────────────────────────────────

export async function listEmployees(db: Database, input: ListEmployeesInput) {
  return repository.findEmployees(db, input)
}

export async function getEmployeeById(db: Database, id: string) {
  const employee = await repository.findEmployeeById(db, id)

  if (!employee) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Employee not found" })
  }

  const access = await repository.findEmployeeAccess(db, id)

  return {
    ...employee,
    ...access,
  }
}

export async function searchEmployees(db: Database, q?: string) {
  return repository.searchEmployees(db, q)
}

// ─── Mutation Operations ─────────────────────────────────────────────────────

export async function createEmployee(
  db: Database,
  auth: Auth,
  user: { role: string | null },
  input: {
    name: string
    email: string
    password: string
    departmentId?: string
    role?: (typeof ALL_ROLES)[number]
  }
) {
  const { name, email, password, departmentId, role: inputRole } = input

  // Determine target role (default to employee)
  const targetRole = inputRole ?? ROLES.EMPLOYEE

  // Hierarchical role check — actor cannot assign a role above their own level
  if (!user.role || !canManageRole(user.role, targetRole)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `You don't have permission to assign the ${targetRole} role`,
    })
  }

  const userResult = await auth.api.signUpEmail({
    body: { name, email, password },
  })

  const userId = typeof userResult === "object" && "user" in userResult ? userResult.user.id : null

  if (!userId) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to create user account",
    })
  }

  // Set role to the specified role (or employee by default)
  await db.update(users).set({ role: targetRole as (typeof ALL_ROLES)[number] }).where(eq(users.id, userId))

  const employee = await repository.createEmployee(db, {
    userId,
    departmentId,
  })

  if (!employee) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to create employee record",
    })
  }

  return employee
}

export async function updateEmployee(
  db: Database,
  user: { role: string | null },
  input: {
    id: string
    name?: string
    role?: (typeof ALL_ROLES)[number]
    departmentId?: string
    status?: Employee["status"]
    phoneNumber?: string
    socialContact?: string
  }
) {
  const { id, name, role, ...employeeData } = input

  // Update employee
  const employee = await repository.updateEmployee(db, id, employeeData)

  if (!employee) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Employee not found" })
  }

  // Update user if name or role changed
  if (name || role) {
    const updateData: { name?: string; role?: (typeof ALL_ROLES)[number] } = {}
    if (name) updateData.name = name

    if (role) {
      // Hierarchical role check
      if (!user.role || !canManageRole(user.role, role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `You don't have permission to assign the ${role} role`,
        })
      }
      updateData.role = role
    }

    await repository.updateUser(db, employee.userId, updateData)
  }

  return employee
}

export async function changePassword(
  db: Database,
  auth: Auth,
  req: Request,
  employeeId: string,
  password: string
) {
  const employee = await db.query.employees.findFirst({
    where: (employees, { eq }) => eq(employees.id, employeeId),
  })

  if (!employee) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Employee not found" })
  }

  try {
    const hasPermission = await auth.api.userHasPermission({
      body: {
        permissions: { user: ["set-password"] },
      },
      headers: req.headers,
    })

    if (!hasPermission.success) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You don't have permission to change password",
      })
    }
    await setUserPassword(auth, req.headers, employee.userId, password)
  } catch (error) {
    if (error instanceof TRPCError) throw error
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to change password",
    })
  }

  return { success: true }
}

export async function updateAccess(
  db: Database,
  input: {
    id: string
    advertiserAccess?: "all" | "selected"
    mediaBuyerAccess?: "all" | "selected"
    advertiserIds?: string[]
    mediaBuyerIds?: string[]
    managedAdvertiserIds?: string[]
    managedMediaBuyerIds?: string[]
  }
) {
  const {
    id,
    advertiserAccess,
    mediaBuyerAccess,
    advertiserIds,
    mediaBuyerIds,
    managedAdvertiserIds,
    managedMediaBuyerIds,
  } = input

  // Update access control settings
  if (advertiserAccess || mediaBuyerAccess) {
    await repository.updateEmployeeAccessControl(db, id, {
      advertiserAccess,
      mediaBuyerAccess,
    })
  }

  // Sync advertiser access
  if (advertiserIds !== undefined) {
    await repository.syncAdvertiserAccess(db, id, advertiserIds)
  }

  // Sync media buyer access
  if (mediaBuyerIds !== undefined) {
    await repository.syncMediaBuyerAccess(db, id, mediaBuyerIds)
  }

  // Sync managed advertisers
  if (managedAdvertiserIds !== undefined) {
    await repository.syncManagedAdvertisers(db, id, managedAdvertiserIds)
  }

  // Sync managed media buyers
  if (managedMediaBuyerIds !== undefined) {
    await repository.syncManagedMediaBuyers(db, id, managedMediaBuyerIds)
  }

  return { success: true }
}

export async function bulkUpdateStatus(db: Database, ids: string[], status: Employee["status"]) {
  return repository.updateEmployeeStatus(db, ids, status)
}

export async function deleteEmployee(db: Database, id: string) {
  const deleted = await repository.deleteEmployee(db, id)

  if (!deleted) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Employee not found" })
  }

  return { success: true }
}

export async function bulkDelete(db: Database, ids: string[]) {
  return repository.bulkDeleteEmployees(db, ids)
}

// ─── Permissions Operations ──────────────────────────────────────────────────

export async function getPermissions(db: Database, employeeId: string) {
  const employee = await repository.findEmployeePermissions(db, employeeId)

  if (!employee) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Employee not found" })
  }

  return permissionsCache.getPermissions(employeeId, db)
}

export async function getMyPermissions(db: Database, user: { id: string; role: string | null }) {
  // Media buyers have no employee record — return their per-buyer
  // permissions (stored set or defaults) so client-side gates work.
  if (user.role === ROLES.MEDIA_BUYER) {
    const buyer = await db.query.mediaBuyers.findFirst({
      where: (mediaBuyers, { eq }) => eq(mediaBuyers.userId, user.id),
      columns: { permissions: true },
    })

    const raw = (buyer?.permissions ?? []) as string[]
    const effective = raw.length > 0 ? raw : [...MEDIA_BUYER_PERMISSIONS]
    return filterValidPermissions(effective)
  }

  const employee = await repository.findEmployeeByUserId(db, user.id)
  if (!employee) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Employee record not found" })
  }

  return permissionsCache.getPermissions(employee.id, db)
}

export async function updatePermissions(
  db: Database,
  employeeId: string,
  rawKeys: string[]
) {
  // Validate all keys exist in registry
  const invalidKeys = rawKeys.filter((k) => !(ALL_PERMISSION_KEYS as string[]).includes(k))
  if (invalidKeys.length > 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Invalid permission keys: ${invalidKeys.join(", ")}`,
    })
  }

  const validKeys = rawKeys as Permission[]

  const updated = await repository.updateEmployeePermissions(db, employeeId, validKeys)

  if (!updated) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Employee not found" })
  }

  await permissionsCache.invalidatePermissions(employeeId)

  return { success: true }
}

export async function clonePermissions(
  db: Database,
  sourceEmployeeId: string,
  targetEmployeeId: string
) {
  const source = await repository.findEmployeePermissions(db, sourceEmployeeId)
  if (!source) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Source employee not found" })
  }

  const target = await repository.findEmployeePermissions(db, targetEmployeeId)
  if (!target) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Target employee not found" })
  }

  const sourcePermissions = (source.permissions ?? []) as Permission[]

  await repository.updateEmployeePermissions(db, targetEmployeeId, sourcePermissions)

  // Invalidate target cache only — source is not modified
  await permissionsCache.invalidatePermissions(targetEmployeeId)

  return { success: true }
}

export async function applyPreset(
  db: Database,
  employeeId: string,
  preset: "full" | "manager" | "readonly"
) {
  const presetKeys = PERMISSION_PRESETS[preset] as Permission[]

  const updated = await repository.updateEmployeePermissions(db, employeeId, presetKeys)

  if (!updated) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Employee not found" })
  }

  await permissionsCache.invalidatePermissions(employeeId)

  return { success: true }
}
