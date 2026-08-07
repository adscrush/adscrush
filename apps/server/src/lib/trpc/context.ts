import { db } from "~/lib/db"
import { auth } from "~/lib/auth"
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch"

export interface Scope {
  advertiserIds: string[]
  mediaBuyerIds: string[]
  isAllAdvertisers: boolean
  isAllMediaBuyers: boolean
}

export const createContext = async ({ req, resHeaders }: FetchCreateContextFnOptions) => {
  const session = await auth.api.getSession({
    headers: req.headers,
  })

  return {
    db,
    auth,
    user: session?.user ?? null,
    session: session?.session ?? null,
    req,
    resHeaders,
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>
