"use client"

import { Skeleton } from "@adscrush/ui/components/skeleton"
import { Separator } from "@adscrush/ui/components/separator"

export function EmployeeDetailsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header row: avatar + name/email lines + quick action buttons */}
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <Skeleton className="size-16 rounded-full" />

        {/* Name and email lines */}
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>

        {/* Quick action button skeletons */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      <Separator />

      {/* Tab trigger skeletons */}
      <div className="flex gap-2">
        <Skeleton className="h-9 w-16" />
        <Skeleton className="h-9 w-16" />
      </div>

      {/* Form field row skeletons (label + input pairs) */}
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
