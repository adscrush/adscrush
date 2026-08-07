"use client";

import { Checkbox } from "@adscrush/ui/components/checkbox";
import { Skeleton } from "@adscrush/ui/components/skeleton";
import { cn } from "@adscrush/ui/lib/utils";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Eye, FileText, ImageOff, Type, Video } from "lucide-react";
import * as React from "react";
import type { FileItem } from "../file-picker-utils";
import { formatDuration, getColumnCount } from "../file-picker-utils";

const IMAGE_TYPES = new Set([
  "JPG",
  "JPEG",
  "PNG",
  "GIF",
  "WEBP",
  "SVG",
  "AVIF",
]);
const VIDEO_TYPES = new Set(["MP4", "MOV", "WEBM"]);
const FONT_TYPES = new Set(["WOFF", "WOFF2", "TTF", "OTF"]);

const GRID_CLASSES = "grid grid-cols-6 gap-x-2 gap-y-1";

interface ThumbnailGridProps {
  files: FileItem[];
  isLoading: boolean;
  onFileClick: (id: string) => void;
  onPreviewClick: (id: string) => void;
  onToggleSelection: (id: string) => void;
  previewFileId: string | null;
  selectedIds: Set<string>;
}

export function ThumbnailGrid({
  files,
  selectedIds,
  onToggleSelection,
  onFileClick,
  onPreviewClick,
  previewFileId,
  isLoading,
}: ThumbnailGridProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = React.useState(0);
  const parentRef = React.useRef<HTMLDivElement>(null);
  const [columns, setColumns] = React.useState(6);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const updateWidth = () => setContainerWidth(container.clientWidth);
    updateWidth();
    const observer = new ResizeObserver(() => updateWidth());
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (containerWidth > 0) {
      setColumns(getColumnCount(containerWidth));
    }
  }, [containerWidth]);

  if (isLoading) {
    return (
      <div className="@container" ref={containerRef}>
        <div className={GRID_CLASSES}>
          {Array.from({ length: 12 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (files.length === 0) {
    return null;
  }

  const rows = [];
  for (let i = 0; i < files.length; i += columns) {
    rows.push(files.slice(i, i + columns));
  }

  const gap = 8; // gap-x-2 is 8px
  const totalGaps = (columns - 1) * gap;
  const cardWidth = containerWidth > 0 ? (containerWidth - totalGaps) / columns : 150;
  const rowHeight = cardWidth + 8; // Card height plus 8px vertical gap between rows

  return (
    <div className="@container flex min-h-0 flex-1 flex-col" ref={containerRef}>
      <div
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden"
        ref={parentRef}
      >
        <VirtualizedGrid
          cardWidth={cardWidth}
          columns={columns}
          onFileClick={onFileClick}
          onPreviewClick={onPreviewClick}
          onToggleSelection={onToggleSelection}
          parentRef={parentRef}
          previewFileId={previewFileId}
          rowHeight={rowHeight}
          rows={rows}
          selectedIds={selectedIds}
        />
      </div>
    </div>
  );
}

function VirtualizedGrid({
  rows,
  columns,
  parentRef,
  selectedIds,
  onToggleSelection,
  onFileClick,
  onPreviewClick,
  previewFileId,
  cardWidth,
  rowHeight,
}: {
  rows: FileItem[][];
  columns: number;
  parentRef: React.RefObject<HTMLDivElement | null>;
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onFileClick: (id: string) => void;
  onPreviewClick: (id: string) => void;
  previewFileId: string | null;
  cardWidth: number;
  rowHeight: number;
}) {
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 2,
  });

  // Remeasure the items when rowHeight changes dynamically
  React.useEffect(() => {
    virtualizer.measure();
  }, [rowHeight, virtualizer]);

  return (
    <div
      className="relative"
      style={{ height: `${virtualizer.getTotalSize()}px` }}
    >
      {virtualizer.getVirtualItems().map((virtualRow) => {
        const rowFiles = rows[virtualRow.index]!;
        return (
          <div
            className="absolute right-0 left-0 grid gap-x-2"
            key={virtualRow.index}
            style={{
              gridTemplateColumns: `repeat(${columns}, 1fr)`,
              transform: `translateY(${virtualRow.start}px)`,
              height: `${cardWidth}px`,
            }}
          >
            {rowFiles.map((file) => (
              <FileCard
                file={file}
                isPreview={previewFileId === file.id}
                isSelected={selectedIds.has(file.id)}
                key={file.id}
                onFileClick={onFileClick}
                onPreviewClick={onPreviewClick}
                onToggleSelection={onToggleSelection}
              />
            ))}
            {rowFiles.length < columns &&
              Array.from({ length: columns - rowFiles.length }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
          </div>
        );
      })}
    </div>
  );
}

interface FileCardProps {
  file: FileItem;
  isPreview: boolean;
  isSelected: boolean;
  onFileClick: (id: string) => void;
  onPreviewClick: (id: string) => void;
  onToggleSelection: (id: string) => void;
}

function FileCard({
  file,
  isSelected,
  isPreview,
  onToggleSelection,
  onFileClick,
  onPreviewClick,
}: FileCardProps) {
  const [imgError, setImgError] = React.useState(false);

  const isImage = IMAGE_TYPES.has(file.type);
  const isVideo = VIDEO_TYPES.has(file.type);
  const isFont = FONT_TYPES.has(file.type);

  return (
    <div
      className={cn(
        "group relative flex aspect-square cursor-pointer flex-col overflow-hidden rounded-lg border border-border bg-card",
        isSelected && "border-primary ring-1 ring-primary",
        isPreview && !isSelected && "bg-accent"
      )}
      onClick={() => onFileClick(file.id)}
    >
      <div
        className={cn(
          "absolute top-2 left-2 z-20 transition-opacity",
          isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}
      >
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelection(file.id)}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      <div className="absolute top-2 right-2 z-20 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          aria-label="Preview file"
          className="flex h-7 w-7 items-center justify-center rounded-md bg-background/80 text-foreground shadow-sm hover:bg-background"
          onClick={(e) => {
            e.stopPropagation();
            onPreviewClick(file.id);
          }}
          type="button"
        >
          <Eye className="h-4 w-4" />
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-muted">
        {isImage && !imgError && file.url ? (
          <img
            alt={file.name}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
            src={file.url}
          />
        ) : isImage && (imgError || !file.url) ? (
          <ImageOff className="h-8 w-8 text-gray-300" />
        ) : isVideo ? (
          <VideoThumbnail duration={file.duration} />
        ) : isFont ? (
          <Type className="h-10 w-10 text-gray-300" />
        ) : (
          <FileText className="h-10 w-10 text-gray-300" />
        )}
      </div>

      <div className="px-2 pb-1.5 pt-2">
        <p className="truncate font-medium text-[11px] text-foreground leading-tight">
          {file.name}
        </p>
        <p className="text-[10px] text-muted-foreground uppercase">
          {file.type}
        </p>
      </div>
    </div>
  );
}

function VideoThumbnail({ duration }: { duration?: string }) {
  const formattedDuration = React.useMemo(() => {
    if (!duration) {
      return null;
    }
    const asNumber = Number(duration);
    if (!Number.isNaN(asNumber)) {
      return formatDuration(asNumber);
    }
    return duration;
  }, [duration]);

  return (
    <div className="flex h-full w-full items-center justify-center text-gray-400">
      <Video className="h-10 w-10" />
      {formattedDuration && (
        <span className="absolute right-2 bottom-2 rounded bg-black/60 px-1.5 py-0.5 font-medium text-[10px] text-white">
          {formattedDuration}
        </span>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="flex aspect-square flex-col overflow-hidden rounded-lg border bg-card">
      <div className="flex-1">
        <Skeleton className="h-full w-full rounded-none" />
      </div>
      <div className="space-y-1 border-t p-2">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-2.5 w-1/3" />
      </div>
    </div>
  );
}
