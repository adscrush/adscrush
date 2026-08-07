"use client";

import { Button } from "@adscrush/ui/components/button";
import { Checkbox } from "@adscrush/ui/components/checkbox";
import { Input } from "@adscrush/ui/components/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@adscrush/ui/components/popover";
import { Separator } from "@adscrush/ui/components/separator";
import { cn } from "@adscrush/ui/lib/utils";
import { ChevronDown, Grid, List, RotateCw, Search, X } from "lucide-react";
import * as React from "react";
import { trpc } from "@/lib/trpc/client";
import { isFileSizeFilterValid } from "../file-picker-utils";
import type {
  FileSizeRange,
  ProductFilterItem,
  SortByField,
  SortOrderDirection,
  ViewMode,
} from "../hooks/use-file-picker-state";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PickerToolbarProps {
  fileSizeRange: FileSizeRange;
  fileTypeFilter: string[];
  productFilter: ProductFilterItem[];
  searchQuery: string;
  setFileSizeRange: (range: FileSizeRange) => void;
  setFileTypeFilter: (types: string[]) => void;
  setProductFilter: (products: ProductFilterItem[]) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: SortByField) => void;
  setSortOrder: (order: SortOrderDirection) => void;
  setUsedInFilter: (filter: "all" | "not_used") => void;
  setViewMode: (mode: ViewMode) => void;
  sortBy: SortByField;
  sortOrder: SortOrderDirection;
  usedInFilter: "all" | "not_used";
  viewMode: ViewMode;
}

// ─── Sort Options ────────────────────────────────────────────────────────────

interface SortOption {
  label: string;
  sortBy: SortByField;
  sortOrder: SortOrderDirection;
}

const SORT_OPTIONS: SortOption[] = [
  {
    label: "Date added (newest first)",
    sortBy: "dateUploaded",
    sortOrder: "desc",
  },
  {
    label: "Date added (oldest first)",
    sortBy: "dateUploaded",
    sortOrder: "asc",
  },
  { label: "File name (A-Z)", sortBy: "name", sortOrder: "asc" },
  { label: "File name (Z-A)", sortBy: "name", sortOrder: "desc" },
  { label: "File size (smallest first)", sortBy: "size", sortOrder: "asc" },
  { label: "File size (largest first)", sortBy: "size", sortOrder: "desc" },
];

// ─── File Type Options ───────────────────────────────────────────────────────

const FILE_TYPE_OPTIONS: { label: string; category: string }[] = [
  { label: "Images", category: "image" },
  { label: "Videos", category: "video" },
  { label: "Documents", category: "document" },
  { label: "Fonts", category: "font" },
];

// ─── Component ───────────────────────────────────────────────────────────────

export function PickerToolbar({
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  viewMode,
  setViewMode,
  fileTypeFilter,
  setFileTypeFilter,
  fileSizeRange,
  setFileSizeRange,
  usedInFilter,
  setUsedInFilter,
  productFilter,
  setProductFilter,
}: PickerToolbarProps) {
  return (
    <div className="flex flex-col gap-4 border-border border-b bg-card p-4">
      {/* Top row: Search, Sort, View Toggle */}
      <div className="flex items-center gap-2">
        <SearchInput onChange={setSearchQuery} value={searchQuery} />
        <SortPopover
          onSortChange={(newSortBy, newSortOrder) => {
            setSortBy(newSortBy);
            setSortOrder(newSortOrder);
          }}
          sortBy={sortBy}
          sortOrder={sortOrder}
        />
        <ViewToggle setViewMode={setViewMode} viewMode={viewMode} />
      </div>

      {/* Filter Chips Row */}
      <FilterChipRow
        fileSizeRange={fileSizeRange}
        fileTypeFilter={fileTypeFilter}
        productFilter={productFilter}
        setFileSizeRange={setFileSizeRange}
        setFileTypeFilter={setFileTypeFilter}
        setProductFilter={setProductFilter}
        setUsedInFilter={setUsedInFilter}
        usedInFilter={usedInFilter}
      />
    </div>
  );
}

// ─── SearchInput ─────────────────────────────────────────────────────────────

function SearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative flex-1">
      <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <Input
        className="pr-9 pl-9"
        maxLength={200}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search files"
        value={value}
      />
      {value.length > 0 && (
        <button
          aria-label="Clear search"
          className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          onClick={() => onChange("")}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// ─── SortPopover ─────────────────────────────────────────────────────────────

function SortPopover({
  sortBy,
  sortOrder,
  onSortChange,
}: {
  sortBy: SortByField;
  sortOrder: SortOrderDirection;
  onSortChange: (sortBy: SortByField, sortOrder: SortOrderDirection) => void;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button className="gap-2" variant="outline">
          <RotateCw className="h-4 w-4" /> Sort
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-0">
        <div className="flex flex-col p-2">
          {SORT_OPTIONS.map((option) => {
            const isActive =
              option.sortBy === sortBy && option.sortOrder === sortOrder;
            return (
              <button
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-left text-xs transition-colors",
                  isActive ? "bg-accent font-medium" : "hover:bg-accent/50"
                )}
                key={option.label}
                onClick={() => {
                  onSortChange(option.sortBy, option.sortOrder);
                  setOpen(false);
                }}
              >
                <div
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                    isActive ? "border-4 border-foreground" : "border-border"
                  )}
                />
                {option.label}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── ViewToggle ──────────────────────────────────────────────────────────────

function ViewToggle({
  viewMode,
  setViewMode,
}: {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}) {
  return (
    <div className="flex items-center rounded-md border border-border">
      <Button
        aria-label="Grid view"
        className={cn(
          "rounded-none rounded-l-md",
          viewMode === "grid" && "bg-accent"
        )}
        onClick={() => setViewMode("grid")}
        size="icon"
        variant="ghost"
      >
        <Grid className="h-4 w-4" />
      </Button>
      <Separator className="h-8" orientation="vertical" />
      <Button
        aria-label="List view"
        className={cn(
          "rounded-none rounded-r-md",
          viewMode === "list" && "bg-accent"
        )}
        onClick={() => setViewMode("list")}
        size="icon"
        variant="ghost"
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  );
}

// ─── FilterChipRow ───────────────────────────────────────────────────────────

function FilterChipRow({
  fileTypeFilter,
  setFileTypeFilter,
  fileSizeRange,
  setFileSizeRange,
  usedInFilter,
  setUsedInFilter,
  productFilter,
  setProductFilter,
}: {
  fileTypeFilter: string[];
  setFileTypeFilter: (types: string[]) => void;
  fileSizeRange: FileSizeRange;
  setFileSizeRange: (range: FileSizeRange) => void;
  usedInFilter: "all" | "not_used";
  setUsedInFilter: (filter: "all" | "not_used") => void;
  productFilter: ProductFilterItem[];
  setProductFilter: (products: ProductFilterItem[]) => void;
}) {
  return (
    <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
      <FileTypeChip onChange={setFileTypeFilter} selected={fileTypeFilter} />
      <FileSizeChip onChange={setFileSizeRange} range={fileSizeRange} />
      <UsedInChip onChange={setUsedInFilter} value={usedInFilter} />
      <ProductChip onChange={setProductFilter} selected={productFilter} />
    </div>
  );
}

// ─── FileTypeChip ────────────────────────────────────────────────────────────

function FileTypeChip({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (types: string[]) => void;
}) {
  const hasActive = selected.length > 0;

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((t) => t !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs transition-colors",
            hasActive
              ? "border-foreground bg-accent font-medium"
              : "border-border border-dashed bg-card hover:bg-accent"
          )}
        >
          File type
          {hasActive && (
            <span className="ml-0.5 rounded-full bg-foreground px-1.5 py-0.5 text-[10px] text-background leading-none">
              {selected.length}
            </span>
          )}
          <ChevronDown className="h-3 w-3 text-gray-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto min-w-[160px] p-0">
        <div className="flex max-h-[300px] flex-col overflow-y-auto p-2">
          {FILE_TYPE_OPTIONS.map((option) => (
            <label
              className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-xs hover:bg-accent"
              key={option.category}
            >
              <Checkbox
                checked={selected.includes(option.category)}
                className="h-4 w-4"
                onCheckedChange={() => toggleOption(option.category)}
              />
              {option.label}
            </label>
          ))}
          <Separator className="my-1" />
          <button
            className="rounded-md px-3 py-2 text-left text-muted-foreground text-xs hover:bg-accent"
            onClick={() => onChange([])}
          >
            Clear
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── FileSizeChip ────────────────────────────────────────────────────────────

function FileSizeChip({
  range,
  onChange,
}: {
  range: FileSizeRange;
  onChange: (range: FileSizeRange) => void;
}) {
  const [localMin, setLocalMin] = React.useState<string>(
    range.min === undefined ? "" : String(range.min)
  );
  const [localMax, setLocalMax] = React.useState<string>(
    range.max === undefined ? "" : String(range.max)
  );

  const hasActive = range.min !== undefined || range.max !== undefined;
  const isValid = isFileSizeFilterValid(range.min, range.max);

  // Sync local state when range changes externally (e.g., reset)
  React.useEffect(() => {
    setLocalMin(range.min === undefined ? "" : String(range.min));
    setLocalMax(range.max === undefined ? "" : String(range.max));
  }, [range.min, range.max]);

  const handleMinChange = (value: string) => {
    setLocalMin(value);
    const num = value === "" ? undefined : Number.parseFloat(value);
    if (value === "" || (!Number.isNaN(num!) && num! >= 0 && num! <= 5000)) {
      onChange({ ...range, min: num });
    }
  };

  const handleMaxChange = (value: string) => {
    setLocalMax(value);
    const num = value === "" ? undefined : Number.parseFloat(value);
    if (value === "" || (!Number.isNaN(num!) && num! >= 0 && num! <= 5000)) {
      onChange({ ...range, max: num });
    }
  };

  const getIndicator = (): string | null => {
    if (range.min !== undefined && range.max !== undefined) {
      return `${range.min}-${range.max} MB`;
    }
    if (range.min !== undefined) {
      return `≥${range.min} MB`;
    }
    if (range.max !== undefined) {
      return `≤${range.max} MB`;
    }
    return null;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs transition-colors",
            hasActive
              ? "border-foreground bg-accent font-medium"
              : "border-border border-dashed bg-card hover:bg-accent"
          )}
        >
          File size
          {hasActive && getIndicator() && (
            <span className="ml-0.5 text-[10px] text-muted-foreground">
              ({getIndicator()})
            </span>
          )}
          <ChevronDown className="h-3 w-3 text-gray-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto min-w-[160px] p-0">
        <div className="flex w-64 flex-col gap-4 p-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-medium text-xs">Min size (MB)</label>
            <Input
              max={5000}
              min={0}
              onChange={(e) => handleMinChange(e.target.value)}
              placeholder="0"
              step="0.01"
              type="number"
              value={localMin}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-medium text-xs">Max size (MB)</label>
            <Input
              max={5000}
              min={0}
              onChange={(e) => handleMaxChange(e.target.value)}
              placeholder="5000"
              step="0.01"
              type="number"
              value={localMax}
            />
          </div>
          {!isValid && (
            <p className="text-red-500 text-xs">
              Minimum size must not exceed maximum size.
            </p>
          )}
          <Button
            className="h-auto w-fit p-0 text-gray-500 text-xs"
            onClick={() => {
              onChange({});
              setLocalMin("");
              setLocalMax("");
            }}
            variant="ghost"
          >
            Clear
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── UsedInChip ──────────────────────────────────────────────────────────────

function UsedInChip({
  value,
  onChange,
}: {
  value: "all" | "not_used";
  onChange: (filter: "all" | "not_used") => void;
}) {
  const [open, setOpen] = React.useState(false);
  const hasActive = value !== "all";

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs transition-colors",
            hasActive
              ? "border-foreground bg-accent font-medium"
              : "border-border border-dashed bg-card hover:bg-accent"
          )}
        >
          Used in
          {hasActive && (
            <span className="ml-0.5 text-[10px] text-muted-foreground">
              (Not used)
            </span>
          )}
          <ChevronDown className="h-3 w-3 text-gray-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto min-w-[160px] p-0">
        <div className="flex flex-col p-2">
          {(["all", "not_used"] as const).map((option) => {
            const label = option === "all" ? "All" : "Not used";
            const isActive = value === option;
            return (
              <button
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-left text-xs transition-colors",
                  isActive ? "bg-accent font-medium" : "hover:bg-accent/50"
                )}
                key={option}
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
              >
                <div
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                    isActive ? "border-4 border-foreground" : "border-border"
                  )}
                />
                {label}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── ProductChip ─────────────────────────────────────────────────────────────

function ProductChip({
  selected,
  onChange,
}: {
  selected: ProductFilterItem[];
  onChange: (products: ProductFilterItem[]) => void;
}) {
  const [search, setSearch] = React.useState("");
  const hasActive = selected.length > 0;

  const { data: products = [] } = trpc.products.options.useQuery(
    { search: search || undefined, limit: 50 },
    { enabled: true }
  );

  const toggleProduct = (product: ProductFilterItem) => {
    const already = selected.find((p) => p.id === product.id);
    if (already) {
      onChange(selected.filter((p) => p.id !== product.id));
    } else {
      onChange([...selected, product]);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs transition-colors",
            hasActive
              ? "border-foreground bg-accent font-medium"
              : "border-border border-dashed bg-card hover:bg-accent"
          )}
        >
          Product
          {hasActive && (
            <span className="ml-0.5 rounded-full bg-foreground px-1.5 py-0.5 text-[10px] text-background leading-none">
              {selected.length}
            </span>
          )}
          <ChevronDown className="h-3 w-3 text-gray-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto min-w-[160px] p-0">
        <div className="flex w-64 flex-col p-2">
          <div className="relative mb-2">
            <Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <Input
              className="h-8 pl-8 text-xs"
              maxLength={100}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for products"
              value={search}
            />
          </div>
          <div className="flex max-h-[250px] flex-col overflow-y-auto">
            {products.map((product) => (
              <label
                className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-xs hover:bg-accent"
                key={product.id}
              >
                <Checkbox
                  checked={selected.some((p) => p.id === product.id)}
                  className="h-4 w-4"
                  onCheckedChange={() => toggleProduct(product)}
                />
                <span className="truncate">{product.name}</span>
              </label>
            ))}
            {products.length === 0 && (
              <p className="px-3 py-2 text-muted-foreground text-xs">
                {search ? "No products found" : "No products available"}
              </p>
            )}
          </div>
          <Separator className="my-1" />
          <button
            className="rounded-md px-3 py-2 text-left text-muted-foreground text-xs hover:bg-accent"
            onClick={() => {
              onChange([]);
              setSearch("");
            }}
          >
            Clear
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
