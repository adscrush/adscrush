"use client";

import { Button } from "@adscrush/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@adscrush/ui/components/dialog";
import { ScrollArea } from "@adscrush/ui/components/scroll-area";
import { AlertCircle, FileX } from "lucide-react";
import * as React from "react";
import { trpc } from "@/lib/trpc/client";
import {
  type FileItem,
  getNextPreviewIndex,
  type MediaFilePickerProps,
} from "./file-picker-utils";
import { useFilePickerState } from "./hooks/use-file-picker-state";
import { InfiniteScrollSentinel } from "./picker/infinite-scroll-sentinel";
import { ListView } from "./picker/list-view";
import { PickerFooter } from "./picker/picker-footer";
import { PickerHeader } from "./picker/picker-header";
import { PickerToolbar } from "./picker/picker-toolbar";
import { PreviewPanel } from "./picker/preview-panel";
import { ThumbnailGrid } from "./picker/thumbnail-grid";
import { type UploadProgressItem, UploadZone } from "./picker/upload-zone";
import { useUploadQueue } from "./use-upload-queue";

// Re-export types for consumers
export type { FileItem, MediaFilePickerProps };

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_SELECTION = 50;

// ─── Component ───────────────────────────────────────────────────────────────

export function MediaFilePicker({
  open,
  onOpenChange,
  onSelect,
  multiple = true,
  accept,
  initialSelectedIds,
}: MediaFilePickerProps) {
  const utils = trpc.useUtils();

  // ── State management via custom hook ─────────────────────────────────────
  const state = useFilePickerState({ open, accept, multiple, initialSelectedIds });

  // ── Upload queue ─────────────────────────────────────────────────────────
  const handleUploadComplete = React.useCallback(() => {
    void utils.media.list.invalidate();
  }, [utils.media.list]);

  const uploadQueue = useUploadQueue(null, handleUploadComplete);

  // ── Add from URL ─────────────────────────────────────────────────────────
  const addFromUrl = trpc.media.uploadFromUrl.useMutation();

  const handleAddFromUrl = React.useCallback(
    async (url: string) => {
      await addFromUrl.mutateAsync({ url });
      void utils.media.list.invalidate();
    },
    [addFromUrl, utils.media.list]
  );

  // ── Map upload queue items to UploadProgressItem for UploadZone ──────────
  const uploadProgress: UploadProgressItem[] = React.useMemo(
    () =>
      uploadQueue.items.map((item) => ({
        fileName: item.file.name,
        progress: item.progress,
        status: item.status,
        error: item.error,
      })),
    [uploadQueue.items]
  );

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleClose = React.useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleDone = React.useCallback(() => {
    const selectedFiles = state.files.filter((f) =>
      state.selectedIds.has(f.id)
    );
    onSelect?.(selectedFiles);
    onOpenChange(false);
  }, [state.files, state.selectedIds, onSelect, onOpenChange]);

  const handleFilesSelected = React.useCallback(
    (files: File[]) => {
      uploadQueue.addFiles(files);
    },
    [uploadQueue]
  );

  const handleRetryUpload = React.useCallback(
    (fileName: string) => {
      const item = uploadQueue.items.find((i) => i.file.name === fileName);
      if (item) {
        uploadQueue.retryUpload(item.id);
      }
    },
    [uploadQueue]
  );

  const handleFileClick = React.useCallback(
    (id: string) => {
      state.toggleSelection(id);
    },
    [state]
  );

  const handlePreviewClick = React.useCallback(
    (id: string) => {
      state.setPreviewFileId(id);
    },
    [state]
  );

  const handleSelectAll = React.useCallback(() => {
    const allVisibleSelected =
      state.files.length > 0 &&
      state.files.every((f) => state.selectedIds.has(f.id));

    if (allVisibleSelected) {
      // Deselect all visible files
      for (const file of state.files) {
        if (state.selectedIds.has(file.id)) {
          state.toggleSelection(file.id);
        }
      }
    } else {
      // Select all visible files up to max
      for (const file of state.files) {
        if (
          !state.selectedIds.has(file.id) &&
          state.selectedIds.size < MAX_SELECTION
        ) {
          state.toggleSelection(file.id);
        }
      }
    }
  }, [state]);

  const handlePreviewNavigate = React.useCallback(
    (direction: "next" | "prev") => {
      if (!state.previewFileId || state.files.length === 0) {
        return;
      }
      const currentIndex = state.files.findIndex(
        (f) => f.id === state.previewFileId
      );
      if (currentIndex === -1) {
        return;
      }
      const nextIndex = getNextPreviewIndex(
        currentIndex,
        direction,
        state.files.length
      );
      const nextFile = state.files[nextIndex];
      if (nextFile) {
        state.setPreviewFileId(nextFile.id);
      }
    },
    [state]
  );

  const handlePreviewClose = React.useCallback(() => {
    state.setPreviewFileId(null);
  }, [state]);

  // ── Derived state ────────────────────────────────────────────────────────

  const previewFile = React.useMemo(
    () => state.files.find((f) => f.id === state.previewFileId) ?? null,
    [state.files, state.previewFileId]
  );

  const previewIndex = React.useMemo(() => {
    if (!state.previewFileId) {
      return -1;
    }
    return state.files.findIndex((f) => f.id === state.previewFileId);
  }, [state.files, state.previewFileId]);

  const showEmptyState =
    !(state.isLoading || state.error) && state.files.length === 0;

  const showErrorState = !state.isLoading && state.error !== null;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent
        className="!max-w-5xl !p-0 !gap-0 !h-[85vh] !rounded-lg flex flex-col overflow-hidden bg-muted"
        showCloseButton={false}
      >
        {/* Visually hidden title for accessibility */}
        <DialogTitle className="sr-only">Select file</DialogTitle>

        {/* Header */}
        <PickerHeader onClose={handleClose} />

        {/* Toolbar */}
        <PickerToolbar
          fileSizeRange={state.fileSizeRange}
          fileTypeFilter={state.fileTypeFilter}
          productFilter={state.productFilter}
          searchQuery={state.searchQuery}
          setFileSizeRange={state.setFileSizeRange}
          setFileTypeFilter={state.setFileTypeFilter}
          setProductFilter={state.setProductFilter}
          setSearchQuery={state.setSearchQuery}
          setSortBy={state.setSortBy}
          setSortOrder={state.setSortOrder}
          setUsedInFilter={state.setUsedInFilter}
          setViewMode={state.setViewMode}
          sortBy={state.sortBy}
          sortOrder={state.sortOrder}
          usedInFilter={state.usedInFilter}
          viewMode={state.viewMode}
        />

        {/* Content Area */}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* Main content (scrollable) */}
          <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
            <ScrollArea className="h-full max-h-full flex-1">
              <div className="flex h-full flex-col gap-4 p-4">
                {/* Upload Zone */}
                <UploadZone
                  accept={accept}
                  onAddFromUrl={handleAddFromUrl}
                  onFilesSelected={handleFilesSelected}
                  onRetry={handleRetryUpload}
                  uploadProgress={uploadProgress}
                />

                {/* Error State */}
                {showErrorState && (
                  <div className="flex flex-col items-center justify-center gap-4 py-16">
                    <AlertCircle className="h-10 w-10 text-destructive" />
                    <div className="text-center">
                      <p className="font-medium text-foreground text-sm">
                        Failed to load files
                      </p>
                      <p className="mt-1 text-muted-foreground text-xs">
                        {state.error?.message ?? "An unexpected error occurred"}
                      </p>
                    </div>
                    <Button onClick={state.refetch} variant="outline">
                      Retry
                    </Button>
                  </div>
                )}

                {/* Empty State */}
                {showEmptyState && (
                  <div className="flex flex-col items-center justify-center gap-3 py-16">
                    <FileX className="h-10 w-10 text-muted-foreground/50" />
                    <div className="text-center">
                      <p className="font-medium text-foreground text-sm">
                        No files found
                      </p>
                      <p className="mt-1 text-muted-foreground text-xs">
                        {state.debouncedSearch
                          ? `No files match "${state.debouncedSearch}"`
                          : "No files match the current filters"}
                      </p>
                    </div>
                  </div>
                )}

                {/* File Grid / List */}
                {!(showErrorState || showEmptyState) && (
                  <>
                    {state.viewMode === "grid" ? (
                      <ThumbnailGrid
                        files={state.files}
                        isLoading={state.isLoading}
                        onFileClick={handleFileClick}
                        onPreviewClick={handlePreviewClick}
                        onToggleSelection={state.toggleSelection}
                        previewFileId={state.previewFileId}
                        selectedIds={state.selectedIds}
                      />
                    ) : (
                      <ListView
                        error={state.error}
                        files={state.files}
                        hasNextPage={state.hasNextPage}
                        isFetchingNextPage={state.isFetchingNextPage}
                        isLoading={state.isLoading}
                        multiple={multiple}
                        onFetchNextPage={state.fetchNextPage}
                        onFileClick={handleFileClick}
                        onPreviewClick={handlePreviewClick}
                        onSelectAll={handleSelectAll}
                        onToggleSelection={state.toggleSelection}
                        previewFileId={state.previewFileId}
                        selectedIds={state.selectedIds}
                      />
                    )}

                    {/* Infinite Scroll Sentinel (grid only) */}
                    {state.viewMode === "grid" && !state.isLoading && (
                      <InfiniteScrollSentinel
                        error={state.error}
                        hasNextPage={state.hasNextPage}
                        isFetchingNextPage={state.isFetchingNextPage}
                        onIntersect={state.fetchNextPage}
                        onRetry={state.fetchNextPage}
                      />
                    )}
                  </>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Preview Panel */}
          {previewFile && (
            <PreviewPanel
              currentIndex={previewIndex}
              file={previewFile}
              files={state.files}
              onClose={handlePreviewClose}
              onNavigate={handlePreviewNavigate}
            />
          )}
        </div>

        {/* Footer */}
        <PickerFooter
          onCancel={handleClose}
          onDone={handleDone}
          selectedCount={state.selectedIds.size}
        />
      </DialogContent>
    </Dialog>
  );
}
