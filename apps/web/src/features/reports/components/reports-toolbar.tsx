"use client"

import { Button } from "@adscrush/ui/components/button"
import { CalendarDatePicker } from "@adscrush/ui/components/calendar-date-picker"
import { Play, LayoutGrid, Users, Briefcase, Tags, Calendar } from "lucide-react"
import { useQueryStates } from "nuqs"
import { performanceSearchParams } from "../validations"
import { startOfDay, endOfDay, format } from "date-fns"
import { Filters, type Filter, type FilterFieldConfig } from "@adscrush/ui/components/reui/filters"
import { trpc } from "@/lib/trpc/client"
import { useMemo } from "react"

export function ReportsToolbar() {
  const [params, setParams] = useQueryStates(performanceSearchParams, {
    shallow: false,
  })

  const { data: productsData } = trpc.products.list.useQuery({ perPage: 100 })
  const { data: affiliates } = trpc.mediaBuyers.list.useQuery({ perPage: 100 })
  const { data: advertisers } = trpc.advertisers.list.useQuery({ perPage: 100 })

  const filterFields = useMemo<FilterFieldConfig<string>[]>(() => [
    {
      key: "period",
      label: "Period",
      icon: <Calendar className="size-3.5" />,
      type: "select",
      options: [
        { label: "Today", value: "today" },
        { label: "Yesterday", value: "yesterday" },
        { label: "This Week", value: "this_week" },
        { label: "Last Week", value: "last_week" },
        { label: "This Month", value: "this_month" },
        { label: "Last Month", value: "last_month" },
        { label: "All Time", value: "all_time" },
        { label: "Custom", value: "custom" },
      ],
    },
    {
      key: "groupBy",
      label: "Group By",
      icon: <LayoutGrid className="size-3.5" />,
      type: "select",
      options: [
        { label: "Campaign", value: "campaign" },
        { label: "Funnel", value: "funnel" },
        { label: "Product", value: "product" },
        { label: "Media Buyer", value: "media_buyer" },
        { label: "Ad Account", value: "adAccount" },
        { label: "Advertiser", value: "advertiser" },
        { label: "Landing Page", value: "landing_page" },
        { label: "Country", value: "country" },
        { label: "Source", value: "source" },
        { label: "Creative", value: "creative" },
        { label: "Device Type", value: "deviceType" },
        { label: "OS", value: "os" },
        { label: "Browser", value: "browser" },
        { label: "IP Address", value: "ip" },
        { label: "Daily", value: "daily" },
      ],
    },
    {
      key: "productId",
      label: "Product",
      icon: <Tags className="size-3.5" />,
      type: "select",
      searchable: true,
      options: productsData?.items.map(p => ({ label: p.name, value: p.id })) ?? [],
    },
    {
      key: "mediaBuyerId",
      label: "Media Buyer",
      icon: <Users className="size-3.5" />,
      type: "select",
      searchable: true,
      options: affiliates?.items.map(a => ({ label: a.name, value: a.id })) ?? [],
    },
    {
      key: "advertiserId",
      label: "Advertiser",
      icon: <Briefcase className="size-3.5" />,
      type: "select",
      searchable: true,
      options: advertisers?.items.map(a => ({ label: a.name, value: a.id })) ?? [],
    },
  ], [productsData, affiliates, advertisers])

  const activeFilters = useMemo(() => {
    const filters: Filter<string>[] = []
    if (params.period) filters.push({ id: "period", field: "period", operator: "is", values: [params.period] })
    if (params.groupBy) filters.push({ id: "groupBy", field: "groupBy", operator: "is", values: [params.groupBy] })
    if (params.productId) filters.push({ id: "productId", field: "productId", operator: "is", values: [params.productId] })
    if (params.mediaBuyerId) filters.push({ id: "mediaBuyerId", field: "mediaBuyerId", operator: "is", values: [params.mediaBuyerId] })
    if (params.advertiserId) filters.push({ id: "advertiserId", field: "advertiserId", operator: "is", values: [params.advertiserId] })
    return filters
  }, [params.period, params.groupBy, params.productId, params.mediaBuyerId, params.advertiserId])

  const handleFilterChange = (filters: Filter<string>[]) => {
    const newParams: {
      period: string
      groupBy: string
      productId: string | null
      mediaBuyerId: string | null
      advertiserId: string | null
    } = {
      period: "today",
      groupBy: "campaign",
      productId: null,
      mediaBuyerId: null,
      advertiserId: null,
    }

    filters.forEach(f => {
      if (f.field === "period") newParams.period = f.values[0] ?? "today"
      if (f.field === "groupBy") newParams.groupBy = f.values[0] ?? "campaign"
      if (f.field === "productId") newParams.productId = f.values[0] ?? null
      if (f.field === "mediaBuyerId") newParams.mediaBuyerId = f.values[0] ?? null
      if (f.field === "advertiserId") newParams.advertiserId = f.values[0] ?? null
    })

    setParams(newParams as Parameters<typeof setParams>[0])
  }

  return (
    <div className="flex flex-wrap items-center gap-4 border border-border bg-card/30 p-4">
      <Filters
        fields={filterFields}
        filters={activeFilters}
        onChange={handleFilterChange}
        variant="solid"
        size="sm"
      />

      {params.period === "custom" && (
        <div className="flex items-center gap-2 border-l border-border pl-4">
          <CalendarDatePicker
            date={{
              from: params.dateFrom ? new Date(params.dateFrom) : startOfDay(new Date()),
              to: params.dateTo ? new Date(params.dateTo) : endOfDay(new Date()),
            }}
            onDateSelect={(d) =>
              setParams({
                dateFrom: d.from ? format(d.from, "yyyy-MM-dd") : null,
                dateTo: d.to ? format(d.to, "yyyy-MM-dd") : null,
              })
            }
            className="w-fit max-w-[220px] px-5 text-xs"
            variant={"outline"}
          />
        </div>
      )}

      <div className="ml-auto flex gap-2">
        <Button
          size="sm"
          className="h-8 gap-2 rounded-none bg-primary/90 px-4 text-[11px] font-bold tracking-wider uppercase hover:bg-primary"
          onClick={() => {
            // TRPC query will automatically refetch when params change, 
            // but we can add a manual trigger if needed
          }}
        >
          <Play className="size-3 fill-current" /> Run Report
        </Button>
      </div>
    </div>
  )
}
