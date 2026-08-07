"use client";

import { Button } from "@adscrush/ui/components/button";
import { ScrollArea } from "@adscrush/ui/components/scroll-area";
import { cn } from "@adscrush/ui/lib/utils";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { FileItem } from "../file-picker-utils";

interface PreviewPanelProps {
  currentIndex: number;
  file: FileItem | null;
  files: FileItem[];
  onClose: () => void;
  onNavigate: (direction: "next" | "prev") => void;
}

export function PreviewPanel({
  file,
  files,
  currentIndex: _currentIndex,
  onClose,
  onNavigate,
}: PreviewPanelProps) {
  if (!file) {
    return null;
  }

  const isVideo =
    file.type === "MP4" || file.type === "MOV" || file.type === "WEBM";
  const canNavigate = files.length > 1;

  return (
    <div className="flex w-[320px] shrink-0 flex-col overflow-hidden border-border border-l bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-border border-b px-4 py-3">
        <span className="font-semibold text-foreground text-sm">Preview</span>
        <Button
          aria-label="Close preview"
          className="h-8 w-8"
          onClick={onClose}
          size="icon"
          variant="ghost"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-6 p-4 min-w-0">
          {/* Preview Image/Video */}
          <div
            className={cn(
              "group relative overflow-hidden rounded-lg border border-border bg-muted w-full",
              isVideo ? "aspect-video" : "aspect-square flex items-center justify-center"
            )}
          >
            {isVideo ? (
              <video
                className="absolute inset-0 h-full w-full rounded-lg object-contain"
                controls
                preload="metadata"
                src={file.url}
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <img
                alt={file.name}
                className="h-full w-full object-contain"
                src={file.url}
              />
            )}

            {/* Navigation arrows (visible on hover) */}
            {canNavigate && (
              <>
                <button
                  aria-label="Previous file"
                  className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full bg-background/80 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => onNavigate("prev")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  aria-label="Next file"
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full bg-background/80 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => onNavigate("next")}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}
          </div>

          {/* Metadata */}
          <div className="flex flex-col gap-1 min-w-0">
            <h3
              className="truncate font-semibold text-foreground text-sm"
              title={file.name}
            >
              {file.name}
            </h3>
            <p className="text-muted-foreground text-xs">
              {file.dateAdded} • {file.type}
              {file.dimensions ? ` • ${file.dimensions}` : ""}
            </p>
          </div>

          {/* Duration (for videos) */}
          {isVideo && file.duration && (
            <div className="flex flex-col gap-2">
              <span className="font-medium text-muted-foreground text-xs">
                Duration
              </span>
              <span className="text-foreground text-sm">{file.duration}</span>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
