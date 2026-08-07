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
import { CAMPAIGN_STATUS_VALUES } from "@adscrush/shared/constants/status"
import { type Campaign } from "./queries"
import { z } from "zod"

// ---------------------------------------------------------------------------
// Search Params (list page URL state)
// ---------------------------------------------------------------------------

export type CampaignListSortableColumns = Omit<Campaign, "funnel"> & {
  funnelName: string
}

export const searchParamsCache = createSearchParamsCache({
  filterFlag: parseAsStringEnum(
    flagConfig.featureFlags.map((flag) => flag.value)
  ).withDefault("commandFilters"),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),

  sort: getSortingStateParser<CampaignListSortableColumns>().withDefault([
    { id: "createdAt", desc: true },
  ]),
  search: parseAsString.withDefault(""),
  status: parseAsArrayOf(parseAsStringEnum(CAMPAIGN_STATUS_VALUES)).withDefault(
    []
  ),

  funnelId: parseAsString.withDefault(""),

  // advanced filter
  filters: getFiltersStateParser().withDefault([]),
  joinOperator: parseAsStringEnum(["and", "or"]).withDefault("and"),
})

export type GetCampaignsSchema = Awaited<
  ReturnType<typeof searchParamsCache.parse>
>

// ---------------------------------------------------------------------------
// Campaign Form Schemas (creation & edit)
// ---------------------------------------------------------------------------

export const createCampaignFormSchema = z
  .object({
    name: z
      .string()
      .min(1, "Campaign name is required")
      .max(255, "Campaign name must be 255 characters or less"),
    funnelId: z.string().min(1, "Funnel is required"),
    creativeIds: z.array(z.string()).default([]),
    status: z.enum(CAMPAIGN_STATUS_VALUES).default("active"),
    startDate: z.coerce.date().optional().nullable(),
    endDate: z.coerce.date().optional().nullable(),
    internalNotes: z
      .string()
      .max(2000, "Internal notes must be 2000 characters or less")
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.endDate >= data.startDate
      }
      return true
    },
    {
      message: "End date must be equal to or later than start date",
      path: ["endDate"],
    }
  )

export const updateCampaignFormSchema = z
  .object({
    name: z
      .string()
      .min(1, "Campaign name is required")
      .max(255, "Campaign name must be 255 characters or less")
      .optional(),
    status: z.enum(CAMPAIGN_STATUS_VALUES).optional(),
    startDate: z.coerce.date().optional().nullable(),
    endDate: z.coerce.date().optional().nullable(),
    internalNotes: z
      .string()
      .max(2000, "Internal notes must be 2000 characters or less")
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.endDate >= data.startDate
      }
      return true
    },
    {
      message: "End date must be equal to or later than start date",
      path: ["endDate"],
    }
  )

// ---------------------------------------------------------------------------
// Inferred Types
// ---------------------------------------------------------------------------

export type CreateCampaignFormInput = z.infer<typeof createCampaignFormSchema>
export type UpdateCampaignFormInput = z.infer<typeof updateCampaignFormSchema>
