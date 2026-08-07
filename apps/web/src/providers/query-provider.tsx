"use client"

import { TanStackDevtools } from "@tanstack/react-devtools"
import { pacerDevtoolsPlugin } from "@tanstack/react-pacer-devtools"
import { QueryClientProvider } from "@tanstack/react-query"
import { httpBatchLink } from "@trpc/client"
import { useState } from "react"

import { getQueryClient } from "@/lib/query-client"
import { trpc } from "@/lib/trpc/client"
import { getUrl } from "@/lib/trpc/shared"
import superjson from "superjson"

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // NOTE: Avoid useState when initializing the query client if you want
  // to use it in SSR, as it will be re-initialized on every render if
  // not handled carefully. getQueryClient handles the singleton for us.
  const queryClient = getQueryClient()

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: getUrl(),
          transformer: superjson,
          async headers() {
            return {
              // Any custom headers if needed
            }
          },
          fetch(url, options) {
            return fetch(url, {
              ...options,
              credentials: "include",
            })
          },
        }),
      ],
    })
  )

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
        <TanStackDevtools plugins={[pacerDevtoolsPlugin()]} />
      </QueryClientProvider>
    </trpc.Provider>
  )
}
