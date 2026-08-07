import type { CDNConfig } from "./types"

const PURGE_URL = "https://api.bunny.net/purge"

export class CDNClient {
  constructor(private config: CDNConfig) {}

  get pullZoneUrl(): string {
    return this.config.pullZoneUrl ?? ""
  }

  buildUrl(path: string): string {
    if (!this.config.pullZoneUrl) return path
    const cleanPath = path.startsWith("/") ? path : `/${path}`
    const base = this.config.pullZoneUrl.replace(/\/+$/, "")
    return `${base}${cleanPath}`
  }

  async purge(url: string): Promise<boolean> {
    const encoded = encodeURIComponent(url)
    const res = await fetch(`${PURGE_URL}?url=${encoded}`, {
      method: "POST",
      headers: { AccessKey: this.config.apiKey },
    })

    return res.ok
  }
}

export function deriveFileType(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "image"
  if (mimeType.startsWith("video/")) return "video"
  if (mimeType.startsWith("audio/")) return "audio"
  if (mimeType === "application/pdf") return "document"
  if (mimeType.startsWith("text/")) return "text"
  return "other"
}

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "video/mp4",
  "video/webm",
  "video/avi",
  "video/quicktime",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "application/pdf",
  "application/zip",
  "text/plain",
  "text/html",
]

export const MAX_FILE_SIZE = 100 * 1024 * 1024
