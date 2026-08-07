"use client"

import { Avatar, AvatarFallback } from "@adscrush/ui/components/avatar"
import { getInitials } from "@adscrush/shared/lib/initials"
import {
  useFilterResource,
  type UseFilterResourceOptions,
} from "./hooks/use-filter-resource"

interface DynamicFilterChipDisplayProps extends Pick<UseFilterResourceOptions, "selectedValues"> {
  resourceType: string
}

/**
 * Displays selected items for dynamic filters inside the filter chip.
 *
 * Delegates data fetching and mapping to the `useFilterResource` hook so
 * that this component only worries about rendering the chip content.
 */
export function DynamicFilterChipDisplay({
  resourceType,
  selectedValues,
}: DynamicFilterChipDisplayProps) {
  const { selectedItems, isLoading, config } = useFilterResource(resourceType, {
    searchQuery: "",
    selectedValues,
    showOnlySelectedByDefault: true,
  })

  const useAvatar = config?.useAvatar

  if (isLoading || selectedItems.length === 0) {
    return (
      <span className="truncate text-xs">
        {selectedValues.length > 1
          ? `${selectedValues.length} selected`
          : "Loading..."}
      </span>
    )
  }

  return (
    <>
      <div className="flex items-center -space-x-2 rtl:space-x-reverse">
        {selectedItems.slice(0, 3).map((item) => {
          const hasImage = item.image
          if (useAvatar) {
            return (
              <Avatar
                key={item.id}
                className="size-5 shrink-0 border bg-background"
              >
                <AvatarFallback className="text-[0.5rem]">
                  {getInitials(item.name)}
                </AvatarFallback>
              </Avatar>
            )
          }
          return hasImage ? (
            <div key={item.id} className="rounded-full border bg-background">
              <img
                src={item.image as string}
                alt=""
                className="size-5 rounded-full object-cover"
              />
            </div>
          ) : (
            <div
              key={item.id}
              className="flex size-5 items-center justify-center rounded-full border bg-muted text-[8px] font-medium"
            >
              {item.name.charAt(0).toUpperCase()}
            </div>
          )
        })}
      </div>
      <span className="truncate text-xs">
        {selectedItems.length > 1
          ? `${selectedItems.length} selected`
          : selectedItems[0]?.name}
      </span>
    </>
  )
}
