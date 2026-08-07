import { env } from "@/env"

export function getBaseUrl() {
  return env.NEXT_PUBLIC_TRPC_API_URL
}

export function getUrl() {
  return getBaseUrl()
}
