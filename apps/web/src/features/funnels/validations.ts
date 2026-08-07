import {
  getFiltersStateParser,
  getSortingStateParser,
} from "@adscrush/shared/lib/parsers"
import { flagConfig } from "@/config/flag"
import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server"
import { LANDING_PAGE_STATUS_VALUES } from "@adscrush/shared/constants/status"
import { z } from "zod"
import { type Funnel } from "./queries"

export const createFunnelFormSchema = z.object({
  productId: z.string().min(1, "Select a product"),
  name: z.string().min(1, "Funnel name is required"),
  language: z.string().default("en"),
  domain: z.string().optional().nullable(),
  pageUrl: z.string().optional().nullable(),
  thankYouPageUrl: z.string().optional().nullable(),
  status: z.enum(["active", "inactive"]).default("active"),
})

export const updateFunnelFormSchema = z.object({
  name: z.string().min(1).optional(),
  language: z.string().optional(),
  domain: z.string().optional().nullable(),
  pageUrl: z.string().optional().nullable(),
  thankYouPageUrl: z.string().optional().nullable(),
  status: z.enum(["active", "inactive"]).optional(),
})

export type CreateFunnelFormInput = z.infer<typeof createFunnelFormSchema>
export type UpdateFunnelFormInput = z.infer<typeof updateFunnelFormSchema>

/**
 * Subset of {@link Funnel} columns that the list view can sort by.
 * Mirrors the `OfferListSortableColumns` pattern in the offers feature.
 */
export type FunnelListSortableColumns = Omit<
  Funnel,
  "product" | "landingPages"
> & {
  product: string
  landingPages: string
}

export const searchParamsCache = createSearchParamsCache({
  filterFlag: parseAsStringEnum(
    flagConfig.featureFlags.map((flag) => flag.value)
  ).withDefault("commandFilters"),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(20),

  sort: getSortingStateParser<FunnelListSortableColumns>().withDefault([
    { id: "createdAt", desc: true },
  ]),
  search: parseAsString.withDefault(""),
  status: parseAsArrayOf(
    parseAsStringEnum(LANDING_PAGE_STATUS_VALUES)
  ).withDefault([]),
  productId: parseAsString.withDefault(""),
  language: parseAsString.withDefault(""),

  // advanced filter
  filters: getFiltersStateParser().withDefault([]),
  joinOperator: parseAsStringEnum(["and", "or"]).withDefault("and"),
})

export type GetFunnelsSchema = Awaited<
  ReturnType<typeof searchParamsCache.parse>
>
