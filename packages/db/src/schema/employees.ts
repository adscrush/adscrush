import { jsonb, pgTable, text, uniqueIndex, index } from "drizzle-orm/pg-core"
import { users } from "./auth"
import { departments } from "./departments"
import { advertisers } from "./advertisers"
import { mediaBuyers } from "./media-buyers"
import { generateId } from "@adscrush/shared/lib/id"
import {
  EMPLOYEE_STATUS,
  EMPLOYEE_STATUS_VALUES,
} from "@adscrush/shared/constants/status"
import type { Permission } from "@adscrush/shared/constants/permissions"
import { createdAtColumn, deletedAtColumn, idColumn, updatedAtColumn } from "./_lib"

export const employees = pgTable(
  "employees",
  {
    id: idColumn("employee"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    departmentId: text("department_id").references(() => departments.id, {
      onDelete: "set null",
    }),
    status: text("status", { enum: EMPLOYEE_STATUS_VALUES })
      .notNull()
      .default(EMPLOYEE_STATUS.PENDING),
    advertiserAccess: text("advertiser_access", { enum: ["all", "selected"] })
      .notNull()
      .default("all"),
    mediaBuyerAccess: text("media_buyer_access", { enum: ["all", "selected"] })
      .notNull()
      .default("all"),
    phoneNumber: text("phone_number"),
    socialContact: text("social_contact"),
    permissions: jsonb("permissions").$type<Permission[]>().notNull().default([]),
    deletedAt: deletedAtColumn(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [
    uniqueIndex("employees_user_id_idx").on(table.userId),
    index("employees_status_idx").on(table.status),
    index("employees_department_id_idx").on(table.departmentId),
  ]
)

export const employeeMediaBuyerAccess = pgTable(
  "employee_media_buyer_access",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateId("emp_mb_access")),
    employeeId: text("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    mediaBuyerId: text("media_buyer_id")
      .notNull()
      .references(() => mediaBuyers.id, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("emp_mb_access_idx").on(table.employeeId, table.mediaBuyerId),
  ]
)

export const employeeAdvertiserAccess = pgTable(
  "employee_advertiser_access",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateId("emp_adv_access")),
    employeeId: text("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    advertiserId: text("advertiser_id")
      .notNull()
      .references(() => advertisers.id, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("emp_adv_access_idx").on(table.employeeId, table.advertiserId),
  ]
)

export type Employee = typeof employees.$inferSelect
export type NewEmployee = typeof employees.$inferInsert
export type EmployeeMediaBuyerAccess = typeof employeeMediaBuyerAccess.$inferSelect
export type NewEmployeeMediaBuyerAccess = typeof employeeMediaBuyerAccess.$inferInsert
export type EmployeeAdvertiserAccess = typeof employeeAdvertiserAccess.$inferSelect
export type NewEmployeeAdvertiserAccess = typeof employeeAdvertiserAccess.$inferInsert
