import "server-only"
import { headers } from "next/headers"
import { auth } from "./server"
import { ROLES } from "@adscrush/shared/constants/roles"

export async function requireMediaBuyer(): Promise<{
  isBuyer: boolean
  userId?: string
}> {
  const session = await auth.api.getSession({ headers: await headers() })
  const isBuyer = session?.user?.role === ROLES.MEDIA_BUYER
  return { isBuyer, userId: isBuyer ? session.user.id : undefined }
}
