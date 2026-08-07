import { createAccessControl } from "better-auth/plugins/access"
import { defaultStatements, adminAc, userAc } from "better-auth/plugins/admin/access"

/**
 * make sure to use `as const` so typescript can infer the type correctly
 * */
export const statement = {
  ...defaultStatements,
} as const

export const ac = createAccessControl(statement)

// admin side
export const admin = ac.newRole({ ...adminAc.statements })
export const superAdmin = ac.newRole({ ...adminAc.statements })

// internal roles
export const employee = ac.newRole({ ...adminAc.statements })
export const advertiser = ac.newRole({ ...userAc.statements })
export const mediaBuyer = ac.newRole({ ...userAc.statements })

// user side
export const user = ac.newRole({ ...userAc.statements })
