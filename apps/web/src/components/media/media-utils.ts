import {
  IconPhoto,
  IconVideo,
  IconFileText,
  IconTypography,
} from "@tabler/icons-react"

export function getMimeIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return IconPhoto
  if (mimeType.startsWith("video/")) return IconVideo
  if (mimeType.startsWith("font/")) return IconTypography
  return IconFileText
}

export function getMimeCategory(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "Image"
  if (mimeType.startsWith("video/")) return "Video"
  if (mimeType.startsWith("font/")) return "Font"
  return "Document"
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined) return "-"
  if (bytes === 0) return "0 B"
  const units = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const size = bytes / Math.pow(1024, i)
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}
