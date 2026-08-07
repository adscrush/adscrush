"use client";

import type { MimeCategory } from "@adscrush/shared/validators/media.schema";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { trpc } from "@/lib/trpc/client";
import {
  detectMimeCategory,
  type FileItem,
  type MediaFileFromAPI,
  mapMediaFileToFileItem,
} from "../file-picker-utils";
import { useDebouncedValue } from "@tanstack/react-pacer";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UseFilePickerStateOptions {
  accept?: string[];
  initialSelectedIds?: string[];
  multiple: boolean;
  open: boolean;
}

export interface FileSizeRange {
  max?: number;
  min?: number;
}

export interface ProductFilterItem {
  id: string;
  image: string | null;
  name: string;
}

export type SortByField = "name" | "size" | "dateUploaded" | "fileType";
export type SortOrderDirection = "asc" | "desc";
export type ViewMode = "grid" | "list";

export interface FilePickerState {
  debouncedSearch: string;
  error: Error | null;
  fetchNextPage: () => void;

  // Client-side filters
  fileSizeRange: FileSizeRange;

  // Data
  files: FileItem[];
  fileTypeFilter: string[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isLoading: boolean;
  mimeCategory: MimeCategory | undefined;
  previewFileId: string | null;
  productFilter: ProductFilterItem[];
  refetch: () => void;
  reset: () => void;
  // Query params
  searchQuery: string;
  selectedIds: Set<string>;
  setFileSizeRange: (range: FileSizeRange) => void;
  setFileTypeFilter: (types: string[]) => void;
  setPreviewFileId: (id: string | null) => void;
  setProductFilter: (products: ProductFilterItem[]) => void;

  // Actions
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: SortByField) => void;
  setSortOrder: (order: SortOrderDirection) => void;
  setUsedInFilter: (filter: "all" | "not_used") => void;
  setViewMode: (mode: ViewMode) => void;
  sortBy: SortByField;
  sortOrder: SortOrderDirection;
  toggleSelection: (id: string) => void;
  usedInFilter: "all" | "not_used";

  // View state
  viewMode: ViewMode;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const VIEW_MODE_STORAGE_KEY = "shopify-file-picker-view-mode";
const MAX_SELECTION = 50;
const PAGE_SIZE = 50;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getStoredViewMode(): ViewMode {
  if (typeof window === "undefined") {
    return "grid";
  }
  try {
    const stored = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    if (stored === "grid" || stored === "list") {
      return stored;
    }
  } catch {
    // localStorage may be unavailable (SSR, private browsing, etc.)
  }
  return "grid";
}

function persistViewMode(mode: ViewMode): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useFilePickerState(
  options: UseFilePickerStateOptions
): FilePickerState {
  const { open, accept, multiple, initialSelectedIds } = options;

  // Track previous open state for reset detection
  const prevOpenRef = useRef(false);

  // Stable ref for initialSelectedIds so resetState stays referentially stable
  const initialSelectedIdsRef = useRef(initialSelectedIds);
  initialSelectedIdsRef.current = initialSelectedIds;

  // ── Search state ─────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch] = useDebouncedValue(searchQuery, { wait: 300 });

  // ── Filter state ─────────────────────────────────────────────────────────
  const [fileTypeFilter, setFileTypeFilter] = useState<string[]>([]);
  const [fileSizeRange, setFileSizeRange] = useState<FileSizeRange>({});
  const [usedInFilter, setUsedInFilter] = useState<"all" | "not_used">("all");
  const [productFilter, setProductFilter] = useState<ProductFilterItem[]>([]);

  // ── Sort state ───────────────────────────────────────────────────────────
  const [sortBy, setSortBy] = useState<SortByField>("dateUploaded");
  const [sortOrder, setSortOrder] = useState<SortOrderDirection>("desc");

  // ── View mode with localStorage persistence ──────────────────────────────
  const [viewMode, setViewModeState] = useState<ViewMode>(getStoredViewMode);

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
    persistViewMode(mode);
  }, []);

  // ── Selection state ──────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(initialSelectedIds ?? [])
  );

  // ── Preview state ────────────────────────────────────────────────────────
  const [previewFileId, setPreviewFileId] = useState<string | null>(null);

  // ── Compute mimeCategory from accept prop ────────────────────────────────
  const mimeCategory = useMemo<MimeCategory | undefined>(() => {
    if (!accept || accept.length === 0) {
      return;
    }
    return detectMimeCategory(accept);
  }, [accept]);

  // ── Reset state when dialog opens (false → true transition) ──────────────
  const resetState = useCallback(() => {
    setSearchQuery("");
    setFileTypeFilter([]);
    setFileSizeRange({});
    setUsedInFilter("all");
    setProductFilter([]);
    setSortBy("dateUploaded");
    setSortOrder("desc");
    setSelectedIds(new Set(initialSelectedIdsRef.current ?? []));
    setPreviewFileId(null);
  }, []);

  useEffect(() => {
    if (open && !prevOpenRef.current) {
      // Dialog just opened (false → true transition)
      resetState();
    }
    prevOpenRef.current = open;
  }, [open, resetState]);

  // ── tRPC infinite query ──────────────────────────────────────────────────
  const {
    data,
    fetchNextPage: fetchNext,
    hasNextPage: hasNext,
    isFetchingNextPage,
    isLoading,
    error: queryError,
    refetch: queryRefetch,
  } = trpc.media.list.useInfiniteQuery(
    {
      pageSize: PAGE_SIZE,
      search: debouncedSearch || undefined,
      mimeCategory,
      mimeCategories:
        fileTypeFilter.length > 0
          ? (fileTypeFilter as ("image" | "video" | "document" | "font")[])
          : undefined,
      usedIn: usedInFilter !== "all" ? usedInFilter : undefined,
      productIds:
        productFilter.length > 0
          ? productFilter.map((p) => p.id)
          : undefined,
      sortBy,
      sortOrder,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      enabled: open,
      refetchOnWindowFocus: false,
    }
  );

  // ── Map API results to FileItem and apply client-side filters ─────────────
  const files = useMemo<FileItem[]>(() => {
    if (!data?.pages) {
      return [];
    }

    const allItems = data.pages.flatMap((page) =>
      page.items.map((item) =>
        mapMediaFileToFileItem(item as unknown as MediaFileFromAPI)
      )
    );

    // File-type, used-in and product filters are applied server-side (see the
    // media.list query above). Size is filtered client-side over loaded pages.
    if (fileSizeRange.min === undefined && fileSizeRange.max === undefined) {
      return allItems;
    }
    return allItems.filter((file) => {
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeRange.min !== undefined && fileSizeMB < fileSizeRange.min) {
        return false;
      }
      if (fileSizeRange.max !== undefined && fileSizeMB > fileSizeRange.max) {
        return false;
      }
      return true;
    });
  }, [data?.pages, fileSizeRange]);

  // ── Toggle selection with cap enforcement ────────────────────────────────
  const toggleSelection = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        if (!multiple) {
          // Single-select mode: replace selection
          if (prev.has(id)) {
            return new Set();
          }
          return new Set([id]);
        }

        // Multi-select mode
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          // Enforce max 50 cap
          if (next.size >= MAX_SELECTION) {
            return prev; // Don't modify — cap reached
          }
          next.add(id);
        }
        return next;
      });
    },
    [multiple]
  );

  // ── Expose fetchNextPage safely ──────────────────────────────────────────
  const fetchNextPage = useCallback(() => {
    if (hasNext && !isFetchingNextPage) {
      void fetchNext();
    }
  }, [hasNext, isFetchingNextPage, fetchNext]);

  // ── Expose refetch ───────────────────────────────────────────────────────
  const refetch = useCallback(() => {
    void queryRefetch();
  }, [queryRefetch]);

  return {
    // Query params
    searchQuery,
    debouncedSearch,
    mimeCategory,
    sortBy,
    sortOrder,

    // Client-side filters
    fileSizeRange,
    usedInFilter,
    productFilter,
    fileTypeFilter,

    // View state
    viewMode,
    selectedIds,
    previewFileId,

    // Data
    files,
    isLoading,
    isFetchingNextPage,
    hasNextPage: hasNext ?? false,
    error: queryError as Error | null,

    // Actions
    setSearchQuery,
    setSortBy,
    setSortOrder,
    setFileSizeRange,
    setUsedInFilter,
    setProductFilter,
    setFileTypeFilter,
    toggleSelection,
    setPreviewFileId,
    setViewMode,
    fetchNextPage,
    refetch,
    reset: resetState,
  };
}
