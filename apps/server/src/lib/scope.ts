import { eq } from "@adscrush/db/drizzle"
import {
  employees,
  employeeMediaBuyerAccess,
  employeeAdvertiserAccess,
  mediaBuyers,
  advertisers,
} from "@adscrush/db/schema"
import type { Database } from "@adscrush/db"
import { isAtLeastRole } from "@adscrush/shared/utils/roles"
import { ROLES } from "@adscrush/shared/constants/roles"

export async function getScope(db: Database, userId: string, role: string | null) {
  if (role && isAtLeastRole(role, ROLES.ADMIN)) {
    return {
      advertiserIds: [] as string[],
      mediaBuyerIds: [] as string[],
      isAllAdvertisers: true,
      isAllMediaBuyers: true,
    }
  }

  if (role === ROLES.MEDIA_BUYER) {
    const [buyer] = await db
      .select({ id: mediaBuyers.id })
      .from(mediaBuyers)
      .where(eq(mediaBuyers.userId, userId))
      .limit(1)
    return {
      advertiserIds: [] as string[],
      mediaBuyerIds: buyer ? [buyer.id] : [],
      isAllAdvertisers: false,
      isAllMediaBuyers: false,
    }
  }

  const [employee] = await db.select().from(employees).where(eq(employees.userId, userId)).limit(1)

  if (!employee) {
    return {
      advertiserIds: [],
      mediaBuyerIds: [],
      isAllAdvertisers: false,
      isAllMediaBuyers: false,
    }
  }

  const [mbAccess, managedMBs, advAccess, managedAdvs] = await Promise.all([
    employee.mediaBuyerAccess === "selected"
      ? db
          .select({ id: employeeMediaBuyerAccess.mediaBuyerId })
          .from(employeeMediaBuyerAccess)
          .where(eq(employeeMediaBuyerAccess.employeeId, employee.id))
      : Promise.resolve([]),
    employee.mediaBuyerAccess === "selected"
      ? db
          .select({ id: mediaBuyers.id })
          .from(mediaBuyers)
          .where(eq(mediaBuyers.accountManagerId, employee.id))
      : Promise.resolve([]),
    employee.advertiserAccess === "selected"
      ? db
          .select({ id: employeeAdvertiserAccess.advertiserId })
          .from(employeeAdvertiserAccess)
          .where(eq(employeeAdvertiserAccess.employeeId, employee.id))
      : Promise.resolve([]),
    employee.advertiserAccess === "selected"
      ? db
          .select({ id: advertisers.id })
          .from(advertisers)
          .where(eq(advertisers.accountManagerId, employee.id))
      : Promise.resolve([]),
  ])

  const mediaBuyerIds = Array.from(
    new Set([...mbAccess.map((a) => a.id), ...managedMBs.map((a) => a.id)])
  )
  const advertiserIds = Array.from(
    new Set([...advAccess.map((a) => a.id), ...managedAdvs.map((a) => a.id)])
  )

  return {
    mediaBuyerIds,
    advertiserIds,
    isAllAdvertisers: employee.advertiserAccess === "all",
    isAllMediaBuyers: employee.mediaBuyerAccess === "all",
  }
}
