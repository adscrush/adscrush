import { decryptPII } from "@adscrush/db/encrypt"

export async function safeDecryptIp(encrypted: string | null): Promise<string | null> {
  if (!encrypted) return null
  try {
    return await decryptPII(encrypted)
  } catch {
    return null
  }
}
