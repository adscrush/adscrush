"use client"

import * as React from "react"
import { useDebouncedCallback } from "@/hooks/use-debounced-callback"
import { trpc } from "@/lib/trpc/client"
import type { FilterResourceOption, FilterResourceConfig } from "../filter-resource-registry"
import {
  getResourceConfig,
  entityToFilterOption,
  reportValueToFilterOption,
} from "../filter-resource-registry"

// ── Public interface ───────────────────────────────────────────────────
export interface UseFilterResourceOptions {
  searchQuery: string
  selectedValues: string[]
  showOnlySelectedByDefault?: boolean
}

export interface UseFilterResourceReturn {
  searchResults: FilterResourceOption[]
  selectedItems: FilterResourceOption[]
  mergedResults: FilterResourceOption[]
  isLoading: boolean
  config: FilterResourceConfig | undefined
}

/**
 * Central hook that drives both the value-selector and chip-display
 * components.  Uses the resource-type registry to determine which tRPC
 * queries to fire and how to map the raw response data into a uniform
 * `FilterResourceOption[]` shape.
 *
 * React Rules of Hooks: all queries are called unconditionally at the
 * top level; each is gated by its own `enabled` flag so unused queries
 * are no-ops over the wire.
 */
export function useFilterResource(
  resourceType: string,
  {
    searchQuery,
    selectedValues,
    showOnlySelectedByDefault = false,
  }: UseFilterResourceOptions,
): UseFilterResourceReturn {
  const config = getResourceConfig(resourceType)

  // ── Debounced query (for server-side search) ──────────────────────────
  const [debouncedQuery, setDebouncedQuery] = React.useState(searchQuery)
  const updateDebouncedQuery = useDebouncedCallback((q: string) => {
    setDebouncedQuery(q)
  }, 300)

  React.useEffect(() => {
    updateDebouncedQuery(searchQuery)
  }, [searchQuery, updateDebouncedQuery])

  const isActivelySearching = debouncedQuery.trim().length > 0
  const shouldFetchAllResults = !showOnlySelectedByDefault || isActivelySearching

  // ── Entity-type queries ───────────────────────────────────────────────
  const productsSearch = trpc.products.search.useQuery(
    { q: debouncedQuery || undefined, limit: 50 },
    {
      enabled: resourceType === "products" && shouldFetchAllResults,
      staleTime: 2 * 60 * 1000,
    },
  )
  const productsSelected = trpc.products.search.useQuery(
    { ids: selectedValues, limit: selectedValues.length || 1 },
    {
      enabled: resourceType === "products" && selectedValues.length > 0,
      staleTime: 5 * 60 * 1000,
    },
  )

  const funnelsSearch = trpc.funnels.search.useQuery(
    { q: debouncedQuery || undefined, limit: 50 },
    {
      enabled: resourceType === "funnels" && shouldFetchAllResults,
      staleTime: 2 * 60 * 1000,
    },
  )
  const funnelsSelected = trpc.funnels.search.useQuery(
    { ids: selectedValues, limit: selectedValues.length || 1 },
    {
      enabled: resourceType === "funnels" && selectedValues.length > 0,
      staleTime: 5 * 60 * 1000,
    },
  )

  const mediaBuyersSearch = trpc.mediaBuyers.search.useQuery(
    { q: debouncedQuery || undefined, ids: undefined },
    {
      enabled: resourceType === "mediaBuyers" && shouldFetchAllResults,
      staleTime: 2 * 60 * 1000,
    },
  )
  const mediaBuyersSelected = trpc.mediaBuyers.search.useQuery(
    { q: undefined, ids: selectedValues },
    {
      enabled: resourceType === "mediaBuyers" && selectedValues.length > 0,
      staleTime: 5 * 60 * 1000,
    },
  )

  const advertisersSearch = trpc.advertisers.search.useQuery(
    { q: debouncedQuery || undefined, ids: undefined },
    {
      enabled: resourceType === "advertisers" && shouldFetchAllResults,
      staleTime: 2 * 60 * 1000,
    },
  )
  const advertisersSelected = trpc.advertisers.search.useQuery(
    { q: undefined, ids: selectedValues },
    {
      enabled: resourceType === "advertisers" && selectedValues.length > 0,
      staleTime: 5 * 60 * 1000,
    },
  )

  // ── Click-log options query ───────────────────────────────────────────
  const isClickLog = config?.group === "clickLog"
  const clickLogColumn = isClickLog ? config.column : undefined
  const clickLogOptions = trpc.reports.clickLogOptions.useQuery(
    {
      column: clickLogColumn as string,
      q: debouncedQuery || undefined,
      ids: isActivelySearching ? undefined : selectedValues,
    },
    { enabled: isClickLog, staleTime: 2 * 60 * 1000 },
  )

  // ── Conversion-log options query ──────────────────────────────────────
  const isConversionLog = config?.group === "conversionLog"
  const conversionLogColumn = isConversionLog ? config.column : undefined
  const conversionLogOptions = trpc.reports.conversionLogOptions.useQuery(
    {
      column: conversionLogColumn as string,
      q: debouncedQuery || undefined,
      ids: isActivelySearching ? undefined : selectedValues,
    },
    { enabled: isConversionLog, staleTime: 2 * 60 * 1000 },
  )

  // ── Derive search results ────────────────────────────────────────────
  const searchResults: FilterResourceOption[] = React.useMemo(() => {
    switch (resourceType) {
      case "products":
        return (productsSearch.data ?? []).map(entityToFilterOption)
      case "funnels":
        return (funnelsSearch.data ?? []).map(entityToFilterOption)
      case "mediaBuyers":
        return (mediaBuyersSearch.data ?? []).map(entityToFilterOption)
      case "advertisers":
        return (advertisersSearch.data ?? []).map(entityToFilterOption)
      default: {
        if (isClickLog)
          return (clickLogOptions.data ?? []).map(reportValueToFilterOption)
        if (isConversionLog)
          return (conversionLogOptions.data ?? []).map(
            reportValueToFilterOption,
          )
        return []
      }
    }
  }, [
    resourceType,
    isClickLog,
    isConversionLog,
    productsSearch.data,
    funnelsSearch.data,
    mediaBuyersSearch.data,
    advertisersSearch.data,
    clickLogOptions.data,
    conversionLogOptions.data,
  ])

  // ── Derive selected items ────────────────────────────────────────────
  const selectedItems: FilterResourceOption[] = React.useMemo(() => {
    switch (resourceType) {
      case "products":
        return (productsSelected.data ?? []).map(entityToFilterOption)
      case "funnels":
        return (funnelsSelected.data ?? []).map(entityToFilterOption)
      case "mediaBuyers":
        return (mediaBuyersSelected.data ?? []).map(entityToFilterOption)
      case "advertisers":
        return (advertisersSelected.data ?? []).map(entityToFilterOption)
      default: {
        // Click-log and conversion-log values are plain strings
        if (isClickLog || isConversionLog)
          return selectedValues.map((v) => ({ id: v, name: v }))
        return []
      }
    }
  }, [
    resourceType,
    isClickLog,
    isConversionLog,
    selectedValues,
    productsSelected.data,
    funnelsSelected.data,
    mediaBuyersSelected.data,
    advertisersSelected.data,
  ])

  // ── Merge results (selected on top, deduped) ──────────────────────────
  const mergedResults = React.useMemo(() => {
    const results = shouldFetchAllResults ? searchResults : []
    if (showOnlySelectedByDefault && !isActivelySearching) return selectedItems

    const resultMap = new Map(results.map((item) => [item.id, item]))
    const missingSelected = selectedItems.filter(
      (item) => !resultMap.has(item.id),
    )
    return [...missingSelected, ...results]
  }, [
    searchResults,
    selectedItems,
    showOnlySelectedByDefault,
    isActivelySearching,
    shouldFetchAllResults,
  ])

  // ── Loading state ─────────────────────────────────────────────────────
  const isLoading = (() => {
    switch (resourceType) {
      case "products":
        return productsSearch.isLoading
      case "funnels":
        return funnelsSearch.isLoading
      case "mediaBuyers":
        return mediaBuyersSearch.isLoading
      case "advertisers":
        return advertisersSearch.isLoading
      default: {
        if (isClickLog) return clickLogOptions.isLoading
        if (isConversionLog) return conversionLogOptions.isLoading
        return false
      }
    }
  })()

  return {
    searchResults,
    selectedItems,
    mergedResults,
    isLoading,
    config,
  }
}
