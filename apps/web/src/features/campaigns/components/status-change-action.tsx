"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@adscrush/ui/components/select"
import { toast } from "@adscrush/ui/sonner"
import { IconLoader2 } from "@tabler/icons-react"
import * as React from "react"
import { useUpdateCampaign } from "../queries"

// Only "active" and "inactive" are user-selectable for manual status changes
const USER_SELECTABLE_STATUSES = ["active", "inactive"] as const

type UserSelectableStatus = (typeof USER_SELECTABLE_STATUSES)[number]

interface StatusChangeActionProps {
  campaignId: string
  currentStatus: string
  onSuccess?: () => void
}

const STATUS_TIMEOUT_MS = 10_000

export function StatusChangeAction({
  campaignId,
  currentStatus,
  onSuccess,
}: StatusChangeActionProps) {
  const updateCampaign = useUpdateCampaign()

  // Optimistic displayed status
  const [displayedStatus, setDisplayedStatus] = React.useState(currentStatus)
  const [isUpdating, setIsUpdating] = React.useState(false)

  // Keep displayed status in sync with prop when not updating
  React.useEffect(() => {
    if (!isUpdating) {
      setDisplayedStatus(currentStatus)
    }
  }, [currentStatus, isUpdating])

  const handleStatusChange = React.useCallback(
    (newStatus: string) => {
      // Prevent changes while a request is in progress
      if (isUpdating) return

      const previousStatus = displayedStatus

      // Optimistic update
      setDisplayedStatus(newStatus)
      setIsUpdating(true)

      // Set up timeout
      const timeoutId = setTimeout(() => {
        // Timeout reached — revert and show error
        setDisplayedStatus(previousStatus)
        setIsUpdating(false)
        toast.error("Status change failed. Please try again.")
      }, STATUS_TIMEOUT_MS)

      updateCampaign.mutate(
        { id: campaignId, data: { status: newStatus as UserSelectableStatus } },
        {
          onSuccess: () => {
            clearTimeout(timeoutId)
            setIsUpdating(false)
            onSuccess?.()
          },
          onError: (error) => {
            clearTimeout(timeoutId)
            setDisplayedStatus(previousStatus)
            setIsUpdating(false)
            toast.error(
              error.message || "Status change failed. Please try again."
            )
          },
        }
      )
    },
    [campaignId, displayedStatus, isUpdating, onSuccess, updateCampaign]
  )

  return (
    <div className="relative inline-flex items-center gap-2">
      <Select
        value={displayedStatus}
        onValueChange={handleStatusChange}
        disabled={isUpdating}
      >
        <SelectTrigger className="w-[130px]" aria-label="Campaign status">
          {isUpdating ? (
            <span className="flex items-center gap-2">
              <IconLoader2 className="size-3.5 animate-spin" />
              <span className="capitalize">{displayedStatus}</span>
            </span>
          ) : (
            <SelectValue placeholder="Select status" />
          )}
        </SelectTrigger>
        <SelectContent>
          {USER_SELECTABLE_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              <span className="capitalize">{status}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
