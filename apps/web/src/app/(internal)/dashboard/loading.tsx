import { Skeleton } from "@adscrush/ui/components/skeleton"

export default function DashboardLoading() {
  return (
    <div className="flex flex-col rounded-none bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-background p-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>

      {/* KPI Cards */}
      <div className="flex w-full flex-col border-b md:flex-row">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex flex-1 flex-col justify-center border-b p-6 bg-background last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0"
          >
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-9 w-32 mb-2" />
            <Skeleton className="h-4 w-36" />
          </div>
        ))}
      </div>

      {/* Main Charts Grid: Revenue Chart + Geography */}
      <div className="grid grid-cols-1 border-b border-border lg:grid-cols-3">
        <div className="border-b border-border p-6 lg:col-span-2 lg:border-r lg:border-b-0">
          <Skeleton className="h-5 w-32 mb-4" />
          <Skeleton className="h-[280px] w-full rounded-lg" />
        </div>
        <div className="p-6 lg:col-span-1">
          <Skeleton className="h-5 w-28 mb-4" />
          <Skeleton className="h-[280px] w-full rounded-lg" />
        </div>
      </div>

      {/* Bottom Grid: Browser, Hourly, Conversion Trend */}
      <div className="grid grid-cols-1 border-b border-border lg:grid-cols-3">
        <div className="border-b border-border p-6 lg:col-span-1 lg:border-r lg:border-b-0">
          <Skeleton className="h-5 w-32 mb-4" />
          <Skeleton className="h-[250px] w-full rounded-lg" />
        </div>
        <div className="border-b border-border p-6 lg:col-span-1 lg:border-r lg:border-b-0">
          <Skeleton className="h-5 w-24 mb-4" />
          <Skeleton className="h-[250px] w-full rounded-lg" />
        </div>
        <div className="p-6 lg:col-span-1">
          <Skeleton className="h-5 w-32 mb-4" />
          <Skeleton className="h-[250px] w-full rounded-lg" />
        </div>
      </div>

      {/* Traffic by Source + Top Media Buyers Row */}
      <div className="grid grid-cols-1 border-b border-border lg:grid-cols-2">
        <div className="border-b border-border p-6 lg:col-span-1 lg:border-r lg:border-b-0">
          <Skeleton className="h-5 w-32 mb-4" />
          <Skeleton className="h-[250px] w-full rounded-lg" />
        </div>
        <div className="p-6 lg:col-span-1">
          <Skeleton className="h-5 w-32 mb-4" />
          <Skeleton className="h-[250px] w-full rounded-lg" />
        </div>
      </div>

      {/* Active Products Full Width */}
      <div className="border-b border-border p-6">
        <Skeleton className="h-5 w-28 mb-4" />
        <div className="space-y-3">
          <Skeleton className="h-8 w-full rounded-md" />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-10 w-full rounded-md" />
          ))}
        </div>
      </div>
    </div>
  )
}
