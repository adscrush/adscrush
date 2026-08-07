import { describe, expect, it } from "vitest";
import {
  detectMimeCategory,
  formatDuration,
  getColumnCount,
  getNextPreviewIndex,
  isFileSizeFilterValid,
  type MediaFileFromAPI,
  mapMediaFileToFileItem,
  validateUploadFile,
} from "../file-picker-utils";

// ─── mapMediaFileToFileItem ──────────────────────────────────────────────────

describe("mapMediaFileToFileItem", () => {
  const baseFile: MediaFileFromAPI = {
    id: "mfile_123",
    name: "test-image.jpg",
    mimeType: "image/jpeg",
    fileSize: 1_024_000,
    width: 1920,
    height: 1080,
    cdnUrl: "https://cdn.example.com/test-image.jpg",
    storagePath: "/uploads/test-image.jpg",
    contentHash: "abc123",
    folderId: null,
    uploadedBy: "user_1",
    uploaderName: "John Doe",
    tags: ["banner"],
    createdAt: new Date("2024-05-13T10:00:00Z"),
    updatedAt: new Date("2024-05-13T10:00:00Z"),
  };

  it("maps mimeType to uppercase extension type", () => {
    const result = mapMediaFileToFileItem(baseFile);
    expect(result.type).toBe("JPG");
  });

  it("maps cdnUrl to url", () => {
    const result = mapMediaFileToFileItem(baseFile);
    expect(result.url).toBe("https://cdn.example.com/test-image.jpg");
  });

  it("maps fileSize to size", () => {
    const result = mapMediaFileToFileItem(baseFile);
    expect(result.size).toBe(1_024_000);
  });

  it("computes dimensions from width and height", () => {
    const result = mapMediaFileToFileItem(baseFile);
    expect(result.dimensions).toBe("1920 × 1080");
  });

  it("computes landscape orientation when width > height", () => {
    const result = mapMediaFileToFileItem(baseFile);
    expect(result.orientation).toBe("Landscape");
  });

  it("computes portrait orientation when height > width", () => {
    const result = mapMediaFileToFileItem({
      ...baseFile,
      width: 1080,
      height: 1920,
    });
    expect(result.orientation).toBe("Portrait");
  });

  it("computes square orientation when width equals height", () => {
    const result = mapMediaFileToFileItem({
      ...baseFile,
      width: 1080,
      height: 1080,
    });
    expect(result.orientation).toBe("Square");
  });

  it("returns undefined dimensions and orientation when width/height are null", () => {
    const result = mapMediaFileToFileItem({
      ...baseFile,
      width: null,
      height: null,
    });
    expect(result.dimensions).toBeUndefined();
    expect(result.orientation).toBeUndefined();
  });

  it("returns empty string url when cdnUrl is null", () => {
    const result = mapMediaFileToFileItem({ ...baseFile, cdnUrl: null });
    expect(result.url).toBe("");
  });

  it("formats createdAt as dateAdded string", () => {
    const result = mapMediaFileToFileItem(baseFile);
    expect(result.dateAdded).toBe("May 13, 2024");
  });

  it("maps video mimeType to MP4", () => {
    const result = mapMediaFileToFileItem({
      ...baseFile,
      mimeType: "video/mp4",
    });
    expect(result.type).toBe("MP4");
  });
});

// ─── formatDuration ──────────────────────────────────────────────────────────

describe("formatDuration", () => {
  it("formats 0 seconds as 0:00", () => {
    expect(formatDuration(0)).toBe("0:00");
  });

  it("formats 9 seconds as 0:09", () => {
    expect(formatDuration(9)).toBe("0:09");
  });

  it("formats 65 seconds as 1:05", () => {
    expect(formatDuration(65)).toBe("1:05");
  });

  it("formats 3599 seconds as 59:59", () => {
    expect(formatDuration(3599)).toBe("59:59");
  });

  it("formats 3600 seconds as 1:00:00", () => {
    expect(formatDuration(3600)).toBe("1:00:00");
  });

  it("formats 3661 seconds as 1:01:01", () => {
    expect(formatDuration(3661)).toBe("1:01:01");
  });

  it("formats 7200 seconds as 2:00:00", () => {
    expect(formatDuration(7200)).toBe("2:00:00");
  });

  it("treats negative values as 0", () => {
    expect(formatDuration(-5)).toBe("0:00");
  });
});

// ─── getColumnCount ──────────────────────────────────────────────────────────

describe("getColumnCount", () => {
  it("returns 6 for width >= 920", () => {
    expect(getColumnCount(920)).toBe(6);
    expect(getColumnCount(1500)).toBe(6);
  });

  it("returns 5 for width 700-919", () => {
    expect(getColumnCount(700)).toBe(5);
    expect(getColumnCount(919)).toBe(5);
  });

  it("returns 4 for width 500-699", () => {
    expect(getColumnCount(500)).toBe(4);
    expect(getColumnCount(699)).toBe(4);
  });

  it("returns 3 for width 350-499", () => {
    expect(getColumnCount(350)).toBe(3);
    expect(getColumnCount(499)).toBe(3);
  });

  it("returns 2 for width below 350", () => {
    expect(getColumnCount(349)).toBe(2);
    expect(getColumnCount(100)).toBe(2);
  });
});

// ─── validateUploadFile ──────────────────────────────────────────────────────

describe("validateUploadFile", () => {
  it("accepts a valid image file", () => {
    const file = new File(["content"], "test.jpg", { type: "image/jpeg" });
    Object.defineProperty(file, "size", { value: 1024 });
    const result = validateUploadFile(file);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("rejects a file with unsupported MIME type", () => {
    const file = new File(["content"], "test.exe", {
      type: "application/x-msdownload",
    });
    Object.defineProperty(file, "size", { value: 1024 });
    const result = validateUploadFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Unsupported file type");
  });

  it("rejects a file exceeding 500 MB", () => {
    const file = new File(["content"], "large.jpg", { type: "image/jpeg" });
    Object.defineProperty(file, "size", { value: 500 * 1024 * 1024 + 1 });
    const result = validateUploadFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("exceeds the maximum");
  });

  it("accepts a file exactly at 500 MB", () => {
    const file = new File(["content"], "exact.jpg", { type: "image/jpeg" });
    Object.defineProperty(file, "size", { value: 500 * 1024 * 1024 });
    const result = validateUploadFile(file);
    expect(result.valid).toBe(true);
  });

  it("validates against custom allowed MIME types", () => {
    const file = new File(["content"], "test.png", { type: "image/png" });
    Object.defineProperty(file, "size", { value: 1024 });
    const result = validateUploadFile(file, ["image/jpeg"]);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Unsupported file type");
  });
});

// ─── detectMimeCategory ──────────────────────────────────────────────────────

describe("detectMimeCategory", () => {
  it("returns 'image' when all types are image MIME types", () => {
    expect(detectMimeCategory(["image/jpeg", "image/png"])).toBe("image");
  });

  it("returns 'video' when all types are video MIME types", () => {
    expect(detectMimeCategory(["video/mp4", "video/webm"])).toBe("video");
  });

  it("returns 'document' when all types are document MIME types", () => {
    expect(detectMimeCategory(["application/pdf"])).toBe("document");
  });

  it("returns 'font' when all types are font MIME types", () => {
    expect(detectMimeCategory(["font/woff", "font/woff2"])).toBe("font");
  });

  it("returns undefined when types span multiple categories", () => {
    expect(detectMimeCategory(["image/jpeg", "video/mp4"])).toBeUndefined();
  });

  it("returns undefined for empty array", () => {
    expect(detectMimeCategory([])).toBeUndefined();
  });

  it("returns undefined for MIME types not in any category", () => {
    expect(detectMimeCategory(["application/zip"])).toBeUndefined();
  });
});

// ─── isFileSizeFilterValid ───────────────────────────────────────────────────

describe("isFileSizeFilterValid", () => {
  it("returns true when min <= max", () => {
    expect(isFileSizeFilterValid(10, 100)).toBe(true);
  });

  it("returns true when min equals max", () => {
    expect(isFileSizeFilterValid(50, 50)).toBe(true);
  });

  it("returns false when min > max", () => {
    expect(isFileSizeFilterValid(100, 10)).toBe(false);
  });

  it("returns true when min is undefined", () => {
    expect(isFileSizeFilterValid(undefined, 100)).toBe(true);
  });

  it("returns true when max is undefined", () => {
    expect(isFileSizeFilterValid(10, undefined)).toBe(true);
  });

  it("returns true when both are undefined", () => {
    expect(isFileSizeFilterValid(undefined, undefined)).toBe(true);
  });
});

// ─── getNextPreviewIndex ─────────────────────────────────────────────────────

describe("getNextPreviewIndex", () => {
  it("returns next index for forward navigation", () => {
    expect(getNextPreviewIndex(0, "next", 5)).toBe(1);
    expect(getNextPreviewIndex(2, "next", 5)).toBe(3);
  });

  it("wraps from last to first for forward navigation", () => {
    expect(getNextPreviewIndex(4, "next", 5)).toBe(0);
  });

  it("returns previous index for backward navigation", () => {
    expect(getNextPreviewIndex(3, "prev", 5)).toBe(2);
    expect(getNextPreviewIndex(1, "prev", 5)).toBe(0);
  });

  it("wraps from first to last for backward navigation", () => {
    expect(getNextPreviewIndex(0, "prev", 5)).toBe(4);
  });

  it("handles single-item list", () => {
    expect(getNextPreviewIndex(0, "next", 1)).toBe(0);
    expect(getNextPreviewIndex(0, "prev", 1)).toBe(0);
  });

  it("returns 0 for empty list", () => {
    expect(getNextPreviewIndex(0, "next", 0)).toBe(0);
    expect(getNextPreviewIndex(0, "prev", 0)).toBe(0);
  });
});
