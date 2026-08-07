import { z } from "zod"
import { dataTableConfig } from "../config/data-table"
import type { ExtendedColumnFilter, ExtendedColumnSort } from "../types/data-table"

// ============================================
// Sorting Schemas
// ============================================

export const sortingItemSchema = z.object({
  id: z.string(),
  desc: z.boolean(),
})

export type SortingItem = z.infer<typeof sortingItemSchema>

/**
 * Returns a Zod schema that accepts a JSON string or a pre-parsed array of
 * sort items. Framework-agnostic — no nuqs dependency.
 *
 * Use `.default([...])` on the returned schema to set a fallback when the
 * query param is absent.
 */
export const getSortingStateParser = <TData = unknown>(columnIds?: string[] | Set<string>) => {
  const validKeys = columnIds ? (columnIds instanceof Set ? columnIds : new Set(columnIds)) : null

  return z.preprocess(
    (val) => {
      if (typeof val === "string") {
        try {
          const parsed = JSON.parse(val)
          return Array.isArray(parsed) ? parsed : []
        } catch {
          return []
        }
      }
      return Array.isArray(val) ? val : []
    },
    z
      .array(sortingItemSchema)
      .refine((items) => !validKeys || items.every((item) => validKeys.has(item.id)), {
        message: "Invalid column id in sort",
      })

      .transform((items) => items as unknown as ExtendedColumnSort<TData>[])
  )
}

// ============================================
// Filter Schemas
// ============================================

export const filterItemSchema = z.object({
  id: z.string(),
  value: z.union([z.string(), z.array(z.string())]),
  variant: z.enum(dataTableConfig.filterVariants),
  operator: z.enum(dataTableConfig.operators),
  filterId: z.string(),
})

export type FilterItem = z.infer<typeof filterItemSchema>

/**
 * Returns a Zod schema that accepts a JSON string or a pre-parsed array of
 * filter items. Framework-agnostic — no nuqs dependency.
 *
 * Use `.default([])` on the returned schema to set a fallback when the
 * query param is absent.
 */
export const getFiltersStateParser = <TData = unknown>(columnIds?: string[] | Set<string>) => {
  const validKeys = columnIds ? (columnIds instanceof Set ? columnIds : new Set(columnIds)) : null

  return z.preprocess(
    (val) => {
      if (typeof val === "string") {
        try {
          const parsed = JSON.parse(val)
          return Array.isArray(parsed) ? parsed : []
        } catch {
          return []
        }
      }
      return Array.isArray(val) ? val : []
    },
    z
      .array(filterItemSchema)
      .refine((items) => !validKeys || items.every((item) => validKeys.has(item.id)), {
        message: "Invalid column id in filter",
      })

      .transform((items) => items as unknown as ExtendedColumnFilter<TData>[])
  )
}
