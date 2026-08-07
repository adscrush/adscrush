import { createTRPCProxyClient, httpBatchLink } from "@trpc/client"
import type { TRPCClient } from "@trpc/client"
import type { AppRouter } from "@adscrush/server"
import { getUrl } from "./shared"
import { headers } from "next/headers"
import superjson from "superjson"
import { cache } from "react"

export const getTrpcServer = cache((): TRPCClient<AppRouter> =>
  createTRPCProxyClient<AppRouter>({
    links: [
      httpBatchLink({
        url: getUrl(),
        transformer: superjson,
        headers: async () => {
          const heads = new Map(await headers())
          heads.set("x-trpc-source", "rsc")
          const cookie = (await headers()).get("cookie")
          if (cookie) heads.set("cookie", cookie)
          return Object.fromEntries(heads)
        },
      }),
    ],
  })
)
