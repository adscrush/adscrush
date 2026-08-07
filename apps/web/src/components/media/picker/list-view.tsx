"use client";

import { Button } from "@adscrush/ui/components/button";
import { Checkbox } from "@adscrush/ui/components/checkbox";
import { Skeleton } from "@adscrush/ui/components/skeleton";
import { cn } from "@adscrush/ui/lib/utils";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Eye, Loader2 } from "lucide-react";
import * as React from "react";
import type { FileItem } from "../file-picker-utils";

interface ListViewProps {
  files: FileItem[];
  isLoading: boolean;
  multiple: boolean;
  onFileClick: (id: string) => void;
  onPreviewClick: (id: string) => void;
  onSelectAll: () => void;
  onToggleSelection: (id: string) => void;
  previewFileId: string | null;
  selectedIds: Set<string>;
  error?: Error | null;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onFetchNextPage?: () => void;
}

const ROW_HEIGHT = 52;

export function ListView({
  files,
  selectedIds,
  onToggleSelection,
  onFileClick,
  onPreviewClick,
  onSelectAll,
  previewFileId,
  isLoading,
  multiple,
  error,
  hasNextPage,
  isFetchingNextPage,
  onFetchNextPage,
}: ListViewProps) {
  // Hooks must be called unconditionally at the top of the component.
  const parentRef = React.useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: files.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,
  });

  if (isLoading && files.length === 0) {
    return <ListViewSkeleton />;
  }

  const allVisibleSelected =
    files.length > 0 && files.every((f) => selectedIds.has(f.id));

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card">
      <div className="overflow-hidden">
        <table className="w-full table-fixed text-left text-sm">
          <colgroup>
            <col className="w-10" />
            <col className="w-16" />
            <col />
            <col className="w-20" />
            <col className="w-24" />
            <col className="w-28" />
            <col className="w-12" />
          </colgroup>
          <thead className="border-border border-b bg-muted font-medium text-[11px] text-muted-foreground uppercase">
            <tr>
              <th className="px-4 py-2">
                {multiple && (
                  <Checkbox
                    aria-label="Select all files"
                    checked={allVisibleSelected && files.length > 0}
                    onCheckedChange={() => onSelectAll()}
                  />
                )}
              </th>
              <th className="px-4 py-2">Preview</th>
              <th className="px-4 py-2">File name</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Orientation</th>
              <th className="px-4 py-2">Date added</th>
              <th />
            </tr>
          </thead>
        </table>
      </div>
      <div
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden"
        ref={parentRef}
      >
        <table className="w-full table-fixed text-left text-sm">
          <colgroup>
            <col className="w-10" />
            <col className="w-16" />
            <col />
            <col className="w-20" />
            <col className="w-24" />
            <col className="w-28" />
            <col className="w-12" />
          </colgroup>
          <tbody>
            {virtualizer.getVirtualItems().length === 0 && !isLoading && (
              <tr>
                <td className="px-4 py-2 text-muted-foreground text-sm" colSpan={7}>
                  {files.length === 0 ? "No files found" : ""}
                </td>
              </tr>
            )}
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const file = files[virtualRow.index]!;
              const isSelected = selectedIds.has(file.id);
              const isPreviewing = previewFileId === file.id;

              return (
                <tr
                  className={cn(
                    "cursor-pointer border-b transition-colors last:border-0 hover:bg-accent",
                    isSelected && "bg-primary/10 hover:bg-primary/10",
                    isPreviewing && !isSelected && "bg-accent"
                  )}
                  key={file.id}
                  onClick={() => onFileClick(file.id)}
                  style={{ height: `${ROW_HEIGHT}px` }}
                >
                  <td className="px-4 py-2">
                    <Checkbox
                      aria-label={`Select ${file.name}`}
                      checked={isSelected}
                      onCheckedChange={() => onToggleSelection(file.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded border bg-muted">
                      {file.type === "MP4" ||
                      file.type === "MOV" ||
                      file.type === "WEBM" ? (
                        <div className="grid h-6 w-6 grid-cols-2 gap-0.5">
                          <div className="bg-muted-foreground/20" />
                          <div className="bg-muted-foreground/20" />
                          <div className="bg-muted-foreground/20" />
                          <div className="bg-muted-foreground/20" />
                        </div>
                      ) : file.url ? (
                        <img
                          alt={file.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          src={file.url}
                        />
                      ) : (
                        <div className="h-6 w-6 rounded bg-muted-foreground/20" />
                      )}
                    </div>
                  </td>
                  <td className="truncate px-4 py-2 font-medium">
                    {file.name}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {file.type}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {file.orientation ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {file.dateAdded}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      aria-label="Preview file"
                      className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPreviewClick(file.id);
                      }}
                      type="button"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Sentinel inside the scroll area */}
        <div>
          {isFetchingNextPage && (
            <div className="flex items-center justify-center gap-2 py-4">
              <div className="flex items-center gap-2 rounded-full border bg-muted/30 px-4 py-2">
                <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                <span className="text-muted-foreground text-xs">
                  Loading more...
                </span>
              </div>
            </div>
          )}

          {error && !isFetchingNextPage && (
            <div className="flex items-center justify-center gap-2 py-4">
              <div className="flex items-center gap-2 rounded-full border border-destructive/20 bg-destructive/5 px-4 py-2">
                <span className="text-destructive text-xs">
                  Failed to load more
                </span>
                <Button
                  className="ml-1 h-6 text-xs"
                  onClick={onFetchNextPage}
                  size="sm"
                  variant="ghost"
                >
                  Retry
                </Button>
              </div>
            </div>
          )}

          {!(hasNextPage || isFetchingNextPage || error) && files.length > 0 && (
            <div className="flex items-center justify-center py-4">
              <span className="text-muted-foreground/60 text-xs">
                All files loaded
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ListViewSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <table className="w-full table-fixed text-left text-sm">
        <colgroup>
          <col className="w-10" />
          <col className="w-16" />
          <col />
          <col className="w-20" />
          <col className="w-24" />
          <col className="w-28" />
        </colgroup>
        <thead className="border-border border-b bg-muted font-medium text-[11px] text-muted-foreground uppercase">
          <tr>
            <th className="px-4 py-2">
              <Skeleton className="h-4 w-4 rounded" />
            </th>
            <th className="px-4 py-2">Preview</th>
            <th className="px-4 py-2">File name</th>
            <th className="px-4 py-2">Type</th>
            <th className="px-4 py-2">Orientation</th>
            <th className="px-4 py-2">Date added</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 8 }).map((_, i) => (
            <tr className="border-b last:border-0" key={i}>
              <td className="px-4 py-2">
                <Skeleton className="h-4 w-4 rounded" />
              </td>
              <td className="px-4 py-2">
                <Skeleton className="h-10 w-10 rounded" />
              </td>
              <td className="px-4 py-2">
                <Skeleton className="h-4 w-32 rounded" />
              </td>
              <td className="px-4 py-2">
                <Skeleton className="h-4 w-10 rounded" />
              </td>
              <td className="px-4 py-2">
                <Skeleton className="h-4 w-16 rounded" />
              </td>
              <td className="px-4 py-2">
                <Skeleton className="h-4 w-20 rounded" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
