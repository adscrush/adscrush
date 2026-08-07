import { StorageClient, CDNClient, StorageRegion } from "~/lib/storage"
import { env } from "~/env"

/**
 * Extracts the storage path from a CDN URL.
 *
 * @param cdnUrl - The full CDN URL
 * @param cdnBaseUrl - The base CDN URL to strip
 * @returns The storage path, or null if the URL doesn't match
 *
 * @example
 * ```ts
 * const path = extractStoragePath(
 *   "https://cdn.example.com/products/image.jpg",
 *   "https://cdn.example.com"
 * )
 * // Returns: "products/image.jpg"
 * ```
 */
export function extractStoragePath(cdnUrl: string, cdnBaseUrl: string): string | null {
  const base = cdnBaseUrl.replace(/\/+$/, "")
  if (cdnUrl.startsWith(base)) {
    return cdnUrl.slice(base.length + 1)
  }
  if (cdnUrl.startsWith("/")) {
    return cdnUrl.slice(1)
  }
  return null
}

/**
 * Checks if a URL is a Bunny CDN URL.
 *
 * @param url - The URL to check
 * @returns true if the URL is a Bunny CDN URL
 *
 * @example
 * ```ts
 * if (isBunnyUrl(product.image)) {
 *   await deleteBunnyFile(product.image)
 * }
 * ```
 */
export function isBunnyUrl(url: string): boolean {
  return url.startsWith(env.BUNNY_CDN_URL)
}

/**
 * Creates a new StorageClient instance with Bunny CDN configuration.
 *
 * @returns A new StorageClient instance
 *
 * @example
 * ```ts
 * const storage = createStorageClient()
 * await storage.upload(prefix, fileName, fileBuffer, mimeType)
 * ```
 */
export function createStorageClient(): StorageClient {
  return new StorageClient({
    region: StorageRegion[env.BUNNY_STORAGE_REGION as keyof typeof StorageRegion] ?? StorageRegion.Falkenstein,
    storageZone: env.BUNNY_STORAGE_ZONE,
    apiKey: env.BUNNY_STORAGE_API_KEY,
  })
}

/**
 * Creates a new CDNClient instance with Bunny CDN configuration.
 *
 * @returns A new CDNClient instance
 *
 * @example
 * ```ts
 * const cdn = createCDNClient()
 * const url = cdn.buildUrl(result.cdnUrl)
 * ```
 */
export function createCDNClient(): CDNClient {
  return new CDNClient({
    apiKey: env.BUNNY_STORAGE_API_KEY,
    pullZoneUrl: env.BUNNY_CDN_URL,
  })
}

/**
 * Deletes a file from Bunny Storage if it's a Bunny CDN URL.
 * Silently returns if the URL is not a Bunny URL.
 *
 * @param url - The CDN URL of the file to delete
 *
 * @example
 * ```ts
 * // Safe to call with any URL - only deletes Bunny URLs
 * await deleteBunnyFile(oldImage)
 * ```
 */
export async function deleteBunnyFile(url: string): Promise<void> {
  if (!isBunnyUrl(url)) return

  const storage = createStorageClient()
  const storagePath = extractStoragePath(url, env.BUNNY_CDN_URL)

  if (storagePath) {
    await storage.delete(storagePath)
  }
}
