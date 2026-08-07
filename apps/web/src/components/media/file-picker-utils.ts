import {
  ALLOWED_MEDIA_MIME_TYPES,
  MAX_MEDIA_FILE_SIZE,
  MIME_CATEGORIES,
  type MimeCategory,
} from "@adscrush/shared/validators/media.schema"
import { formatFileSize } from "./media-utils";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FileItem {
  dateAdded: string; // Formatted createdAt date string
  dimensions?: string; // "width × height" computed from width/height fields
  duration?: string; // For video files, formatted as m:ss or h:mm:ss
  id: string;
  mimeType: string; // Original MIME type (e.g., "image/jpeg", "video/mp4")
  name: string;
  orientation?: "Landscape" | "Portrait" | "Square"; // Computed from width/height ratio
  size: number; // fileSize in bytes
  type: string; // Uppercase extension derived from mimeType (e.g., "JPG", "MP4")
  url: string; // cdnUrl from the media file record
}

export interface MediaFilePickerProps {
  accept?: string[]; // Optional MIME type filter (e.g., ["image/jpeg", "image/png"])
  initialSelectedIds?: string[]; // IDs of files to pre-select when the picker opens
  multiple?: boolean; // Defaults to true
  onOpenChange: (open: boolean) => void;
  onSelect?: (selectedFiles: FileItem[]) => void;
  open: boolean;
}

// ─── API Response Type (from trpc.media.list) ────────────────────────────────

export interface MediaFileFromAPI {
  cdnUrl: string | null;
  contentHash: string;
  createdAt: Date;
  fileSize: number;
  folderId: string | null;
  height: number | null;
  id: string;
  mimeType: string;
  name: string;
  storagePath: string;
  tags: string[];
  updatedAt: Date;
  uploadedBy: string;
  uploaderName: string | null;
  width: number | null;
}

// ─── Utility Functions ───────────────────────────────────────────────────────

/**
 * Maps an API response media file to the FileItem interface used by the picker.
 */
export function mapMediaFileToFileItem(file: MediaFileFromAPI): FileItem {
  const extension = getExtensionFromMimeType(file.mimeType);
  const dimensions =
    file.width && file.height ? `${file.width} × ${file.height}` : undefined;
  const orientation = computeOrientation(file.width, file.height);
  const dateAdded = formatDate(file.createdAt);

  return {
    id: file.id,
    name: file.name,
    type: extension,
    mimeType: file.mimeType,
    url: file.cdnUrl ?? "",
    size: file.fileSize,
    dimensions,
    dateAdded,
    orientation,
    duration: undefined, // Duration is not stored in the DB; set externally if needed
  };
}

/**
 * Formats a duration in seconds to a human-readable string.
 * Returns `m:ss` for durations under 3600 seconds, `h:mm:ss` for 3600 seconds or more.
 */
export function formatDuration(seconds: number): string {
  if (seconds < 0) {
    seconds = 0;
  }

  const totalSeconds = Math.floor(seconds);

  if (totalSeconds < 3600) {
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Returns the number of grid columns based on container width.
 * 6 columns at ≥920px, 5 at ≥700px, 4 at ≥500px, 3 at ≥350px, 2 below 350px.
 */
export function getColumnCount(width: number): number {
  if (width >= 920) {
    return 6;
  }
  if (width >= 700) {
    return 5;
  }
  if (width >= 500) {
    return 4;
  }
  if (width >= 350) {
    return 3;
  }
  return 2;
}

/**
 * Validates a file for upload against allowed MIME types and size limit.
 * Returns { valid: true } if the file passes, or { valid: false, error: string } if not.
 */
export function validateUploadFile(
  file: File,
  allowedMimeTypes: string[] = [...ALLOWED_MEDIA_MIME_TYPES]
): { valid: boolean; error?: string } {
  if (!allowedMimeTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported file type "${file.type}". Accepted types: ${allowedMimeTypes.join(", ")}`,
    };
  }

  if (file.size > MAX_MEDIA_FILE_SIZE) {
    return {
      valid: false,
      error: `File size (${formatFileSize(file.size)}) exceeds the maximum allowed size of 500 MB.`,
    };
  }

  return { valid: true };
}

/**
 * Detects whether all provided MIME types belong to a single MIME category.
 * Returns the category name if they all belong to one, undefined otherwise.
 */
export function detectMimeCategory(
  mimeTypes: string[]
): MimeCategory | undefined {
  if (!mimeTypes || mimeTypes.length === 0) {
    return;
  }

  for (const [category, categoryMimeTypes] of Object.entries(MIME_CATEGORIES)) {
    if (
      mimeTypes.every((type) =>
        (categoryMimeTypes as readonly string[]).includes(type)
      )
    ) {
      return category as MimeCategory;
    }
  }

  return;
}

/**
 * Validates that the file size filter range is valid.
 * Returns true if min ≤ max, or if either value is undefined.
 */
export function isFileSizeFilterValid(min?: number, max?: number): boolean {
  if (min === undefined || max === undefined) {
    return true;
  }
  return min <= max;
}

/**
 * Computes the next preview index with wrapping navigation.
 * Returns the new index after moving in the given direction.
 */
export function getNextPreviewIndex(
  currentIndex: number,
  direction: "next" | "prev",
  listLength: number
): number {
  if (listLength <= 0) {
    return 0;
  }

  if (direction === "next") {
    return (currentIndex + 1) % listLength;
  }

  return (currentIndex - 1 + listLength) % listLength;
}

// ─── Internal Helpers ────────────────────────────────────────────────────────

function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    "image/jpeg": "JPG",
    "image/png": "PNG",
    "image/gif": "GIF",
    "image/webp": "WEBP",
    "image/svg+xml": "SVG",
    "image/avif": "AVIF",
    "video/mp4": "MP4",
    "video/quicktime": "MOV",
    "video/webm": "WEBM",
    "application/pdf": "PDF",
    "font/woff": "WOFF",
    "font/woff2": "WOFF2",
    "font/ttf": "TTF",
    "font/otf": "OTF",
  };

  return (
    mimeToExt[mimeType] ?? mimeType.split("/").pop()?.toUpperCase() ?? "FILE"
  );
}

function computeOrientation(
  width: number | null,
  height: number | null
): "Landscape" | "Portrait" | "Square" | undefined {
  if (!(width && height)) {
    return;
  }
  if (width > height) {
    return "Landscape";
  }
  if (height > width) {
    return "Portrait";
  }
  return "Square";
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date instanceof Date ? date : new Date(date));
}
