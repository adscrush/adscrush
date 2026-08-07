/**
 * Central MIME type registry — single source of truth for file extension → MIME mappings.
 *
 * Used by server routers (products, creatives) to determine MIME types from
 * file extensions during upload and URL-based upload detection.
 *
 * The comprehensive list covers the image, video, audio, document, and archive
 * categories that the platform supports for creatives / product images.
 */

export const MIME_GUESSES: Record<string, string> = {
  // Images
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  avif: "image/avif",
  // Videos
  mp4: "video/mp4",
  webm: "video/webm",
  avi: "video/avi",
  mov: "video/quicktime",
  mkv: "video/x-matroska",
  // Audio
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  flac: "audio/flac",
  // Documents
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  csv: "text/csv",
  // Web / text
  html: "text/html",
  htm: "text/html",
  txt: "text/plain",
  json: "application/json",
  xml: "application/xml",
  // Archives
  zip: "application/zip",
  rar: "application/vnd.rar",
  "7z": "application/x-7z-compressed",
  tar: "application/x-tar",
  gz: "application/gzip",
}

/**
 * Guess the MIME type from a file name using its extension.
 * Falls back to "application/octet-stream" for unknown extensions.
 */
export function guessMimeType(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? ""
  return MIME_GUESSES[ext] ?? "application/octet-stream"
}
