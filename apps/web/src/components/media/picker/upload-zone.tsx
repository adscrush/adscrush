"use client";

import { Button } from "@adscrush/ui/components/button";
import { Input } from "@adscrush/ui/components/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@adscrush/ui/components/dropdown-menu";
import { cn } from "@adscrush/ui/lib/utils";
import { AlertCircle, ChevronDown, Link, Loader2, RotateCw, Upload } from "lucide-react";
import * as React from "react";
import { validateUploadFile } from "../file-picker-utils";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UploadProgressItem {
  error?: string | null;
  fileName: string;
  progress: number;
  status: "queued" | "uploading" | "success" | "error" | "duplicate";
}

interface UploadZoneProps {
  accept?: string[];
  onAddFromUrl?: (url: string) => Promise<void>;
  onFilesSelected: (files: File[]) => void;
  onRetry?: (fileName: string) => void;
  uploadProgress?: UploadProgressItem[];
}

// ─── Component ───────────────────────────────────────────────────────────────

export function UploadZone({
  onFilesSelected,
  accept,
  uploadProgress = [],
  onRetry,
  onAddFromUrl,
}: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [errors, setErrors] = React.useState<string[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const dragCounterRef = React.useRef(0);

  // ─── Add-from-URL state ──────────────────────────────────────────────────
  const [urlMode, setUrlMode] = React.useState(false);
  const [urlValue, setUrlValue] = React.useState("");
  const [urlError, setUrlError] = React.useState<string | null>(null);
  const [urlSubmitting, setUrlSubmitting] = React.useState(false);

  const handleSubmitUrl = React.useCallback(async () => {
    const trimmed = urlValue.trim();
    if (!trimmed || !onAddFromUrl) {
      return;
    }
    let isValid = false;
    try {
      const parsed = new URL(trimmed);
      isValid = parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      isValid = false;
    }
    if (!isValid) {
      setUrlError("Enter a valid http(s) URL");
      return;
    }
    setUrlError(null);
    setUrlSubmitting(true);
    try {
      await onAddFromUrl(trimmed);
      setUrlValue("");
      setUrlMode(false);
    } catch (err) {
      setUrlError(
        err instanceof Error ? err.message : "Failed to add file from URL"
      );
    } finally {
      setUrlSubmitting(false);
    }
  }, [urlValue, onAddFromUrl]);

  const handleValidateAndUpload = React.useCallback(
    (files: File[]) => {
      const validFiles: File[] = [];
      const newErrors: string[] = [];

      for (const file of files) {
        const result = validateUploadFile(file, accept);
        if (result.valid) {
          validFiles.push(file);
        } else {
          newErrors.push(`${file.name}: ${result.error}`);
        }
      }

      if (newErrors.length > 0) {
        setErrors(newErrors);
      }

      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
    },
    [accept, onFilesSelected]
  );

  // ─── Drag and Drop Handlers ──────────────────────────────────────────────

  const handleDragEnter = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      dragCounterRef.current = 0;

      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length > 0) {
        setErrors([]);
        handleValidateAndUpload(droppedFiles);
      }
    },
    [handleValidateAndUpload]
  );

  // ─── File Input Handler ──────────────────────────────────────────────────

  const handleFileInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (files.length > 0) {
        setErrors([]);
        handleValidateAndUpload(files);
      }
      // Reset input so the same file can be selected again
      e.target.value = "";
    },
    [handleValidateAndUpload]
  );

  const handleUploadFilesClick = React.useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // ─── Dismiss errors ──────────────────────────────────────────────────────

  const dismissErrors = React.useCallback(() => {
    setErrors([]);
  }, []);

  // ─── Active uploads (queued, uploading, error) ───────────────────────────

  const activeUploads = uploadProgress.filter(
    (item) =>
      item.status === "queued" ||
      item.status === "uploading" ||
      item.status === "error"
  );

  // Build accept string for file input
  const acceptString = accept ? accept.join(",") : undefined;

  return (
    <div className="flex flex-col gap-3">
      {/* Drop Zone */}
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-lg border-2 bg-card p-8 text-center transition-colors",
          isDragOver
            ? "border-primary border-solid bg-primary/5"
            : "border-border border-dashed"
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="mb-2 flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-2" variant="outline">
                Add media <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                className="gap-2"
                onClick={handleUploadFilesClick}
              >
                <Upload className="h-4 w-4" /> Upload files
              </DropdownMenuItem>
              {onAddFromUrl && (
                <DropdownMenuItem
                  className="gap-2"
                  onClick={() => {
                    setUrlError(null);
                    setUrlMode(true);
                  }}
                >
                  <Link className="h-4 w-4" /> Add from URL
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <p className="text-muted-foreground text-sm">
          Drag and drop images, videos, 3D models, and files
        </p>
      </div>

      {/* Hidden file input */}
      <input
        accept={acceptString}
        className="hidden"
        multiple
        onChange={handleFileInputChange}
        ref={fileInputRef}
        type="file"
      />

      {/* Add from URL */}
      {urlMode && (
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
          <div className="flex items-center gap-2">
            <Input
              autoFocus
              className="h-8 flex-1 text-sm"
              disabled={urlSubmitting}
              onChange={(e) => setUrlValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleSubmitUrl();
                }
              }}
              placeholder="https://example.com/image.jpg"
              type="url"
              value={urlValue}
            />
            <Button
              disabled={urlSubmitting || !urlValue.trim()}
              onClick={() => void handleSubmitUrl()}
              size="sm"
            >
              {urlSubmitting && (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              )}
              Add
            </Button>
            <Button
              disabled={urlSubmitting}
              onClick={() => {
                setUrlMode(false);
                setUrlValue("");
                setUrlError(null);
              }}
              size="sm"
              variant="ghost"
            >
              Cancel
            </Button>
          </div>
          {urlError && <p className="text-red-600 text-xs">{urlError}</p>}
        </div>
      )}

      {/* Validation Errors */}
      {errors.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <div className="flex flex-col gap-1">
                {errors.map((error, index) => (
                  <p className="text-red-700 text-xs" key={index}>
                    {error}
                  </p>
                ))}
              </div>
            </div>
            <button
              aria-label="Dismiss errors"
              className="shrink-0 text-red-500 text-xs hover:text-red-700"
              onClick={dismissErrors}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Upload Progress Indicators */}
      {activeUploads.length > 0 && (
        <div className="flex flex-col gap-2">
          {activeUploads.map((item) => (
            <UploadProgressIndicator
              item={item}
              key={item.fileName}
              onRetry={onRetry}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Upload Progress Indicator ─────────────────────────────────────────────

function UploadProgressIndicator({
  item,
  onRetry,
}: {
  item: UploadProgressItem;
  onRetry?: (fileName: string) => void;
}) {
  if (item.status === "error") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
        <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-red-700 text-xs">
            {item.fileName}
          </p>
          <p className="text-[10px] text-red-500">
            {item.error ?? "Upload failed"}
          </p>
        </div>
        {onRetry && (
          <Button
            className="h-7 px-2 text-red-600 text-xs hover:bg-red-100 hover:text-red-700"
            onClick={() => onRetry(item.fileName)}
            size="sm"
            variant="ghost"
          >
            <RotateCw className="mr-1 h-3 w-3" />
            Retry
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2">
      <Upload className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground text-xs">
          {item.fileName}
        </p>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-300"
            style={{ width: `${item.progress}%` }}
          />
        </div>
      </div>
      <span className="shrink-0 text-[10px] text-muted-foreground">
        {item.status === "queued" ? "Waiting..." : `${item.progress}%`}
      </span>
    </div>
  );
}
