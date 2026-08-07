"use client"

import * as React from "react"
import { CalendarDatePicker } from "@adscrush/ui/components/calendar-date-picker"
import { useRouter, useSearchParams } from "next/navigation"
import { startOfDay, endOfDay, isAfter } from "date-fns"
import type { DateRange } from "react-day-picker"

interface PeriodSelectorProps {
  dateFrom?: string
  dateTo?: string
  rangeLabel?: string
}

export function PeriodSelector({ dateFrom, dateTo, rangeLabel }: PeriodSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentDateRange: DateRange = React.useMemo(() => {
    if (dateFrom && dateTo) {
      return { from: new Date(dateFrom), to: new Date(dateTo) }
    }
    // Default to today
    const today = new Date()
    return { from: startOfDay(today), to: endOfDay(today) }
  }, [dateFrom, dateTo])

  const handleApply = (dates: { from: Date; to: Date }, range: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("from", dates.from.toISOString())
    params.set("to", dates.to.toISOString())
    if (range) {
      params.set("range", range)
    } else {
      params.delete("range")
    }
    router.replace(`?${params.toString()}`)
  }

  // Disable dates after today
  const disableFutureDates = React.useCallback((date: Date) => {
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    return isAfter(date, today)
  }, [])

  return (
    <CalendarDatePicker
      date={currentDateRange}
      onDateSelect={() => {}}
      onApply={handleApply}
      enableTime={true}
      variant="outline"
      size="sm"
      selectedRange={rangeLabel ?? null}
      disabled={disableFutureDates}
    />
  )
}
