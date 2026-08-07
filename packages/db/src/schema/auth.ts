import { EXTERNAL_ROLES, INTERNAL_ROLES } from "@adscrush/shared/constants/roles"
import { generateId } from "@adscrush/shared/lib/id"
import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core"

// NOTE: Better Auth owns the column names of these tables (camelCase) and the
// exact set of columns it expects. We may tune the *types* (timestamptz) but
// must not rename columns. This is the documented boundary between Better
// Auth's convention and our snake_case domain convention.

const tstz = (name: string) =>
  timestamp(name, { withTimezone: true, precision: 6 })

// User table for Better Auth
export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateId("user")),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  role: text("role", {
    enum: [...INTERNAL_ROLES, ...EXTERNAL_ROLES],
  })
    .notNull()
    .default("user"),
  banned: boolean("banned").notNull().default(false),
  banReason: text("ban_reason"),
  banExpires: tstz("ban_expires"),
  createdAt: tstz("createdAt").notNull().defaultNow(),
  updatedAt: tstz("updatedAt").notNull().defaultNow(),
})

// Session table for Better Auth
export const sessions = pgTable("session", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateId("session")),
  expiresAt: tstz("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: tstz("createdAt").notNull().defaultNow(),
  updatedAt: tstz("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  impersonatedBy: text("impersonated_by"),
  role: text("role"),
})

// Account table for Better Auth (OAuth providers)
export const accounts = pgTable("account", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateId("account")),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: tstz("accessTokenExpiresAt"),
  refreshTokenExpiresAt: tstz("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: tstz("createdAt").notNull().defaultNow(),
  updatedAt: tstz("updatedAt").notNull().defaultNow(),
})

// Verification table for Better Auth
export const verifications = pgTable("verification", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateId("verification")),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: tstz("expiresAt").notNull(),
  createdAt: tstz("createdAt").notNull().defaultNow(),
  updatedAt: tstz("updatedAt").notNull().defaultNow(),
})

// Type exports
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert
export type Account = typeof accounts.$inferSelect
export type NewAccount = typeof accounts.$inferInsert
export type Verification = typeof verifications.$inferSelect
export type NewVerification = typeof verifications.$inferInsert
