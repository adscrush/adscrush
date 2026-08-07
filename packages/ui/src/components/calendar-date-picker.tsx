"use client"

import {
  IconCalendar,
  IconCalendarEvent,
  IconClock,
  IconRefresh,
  IconSelector,
} from "@tabler/icons-react"
import { cva, VariantProps } from "class-variance-authority"
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
} from "date-fns"
import { formatInTimeZone, toDate } from "date-fns-tz"
import * as React from "react"
import { DateRange } from "react-day-picker"

import { Button, buttonVariants } from "@adscrush/ui/components/button"
import { Calendar } from "@adscrush/ui/components/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@adscrush/ui/components/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@adscrush/ui/components/select"
import { cn } from "@adscrush/ui/lib/utils"

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

const multiSelectVariants = cva(
  "flex items-center justify-center rounded-md text-sm font-medium whitespace-nowrap text-foreground ring-offset-background transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "text-background hover:bg-accent hover:text-accent-foreground",
        link: "text-background underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

// ─── Time Select Sub-Component ─────────────────────────────────────

interface TimeSelectProps {
  value: string
  min: number
  max: number
  onChange: (value: number) => void
}

function TimeSelect({ value, min, max, onChange }: TimeSelectProps) {
  const [open, setOpen] = React.useState(false)

  const options = React.useMemo(() => {
    const items: number[] = []
    for (let i = min; i <= max; i++) {
      items.push(i)
    }
    return items
  }, [min, max])

  const currentNum = parseInt(value, 10)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "inline-flex items-center justify-between gap-1 rounded-md",
            "h-7 min-w-[2.25rem] px-1.5",
            "border border-input bg-input/20 text-xs/relaxed font-mono",
            "hover:bg-accent hover:text-accent-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-ring",
            "transition-colors cursor-default select-none",
            "dark:bg-input/30 dark:hover:bg-input/50"
          )}
        >
          <span className="tabular-nums">{value}</span>
          <IconSelector className="pointer-events-none size-3 shrink-0 text-muted-foreground/60" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto min-w-[3rem] p-1 rounded-lg bg-popover/70 text-popover-foreground shadow-md ring-1 ring-foreground/10 before:pointer-events-none before:absolute before:inset-0 before:-z-1 before:rounded-[inherit] before:backdrop-blur-2xl before:backdrop-saturate-150"
        align="center"
        side="top"
        sideOffset={4}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex flex-col gap-0.5 max-h-40 overflow-y-auto py-0.5 scrollbar-thin">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              className={cn(
                "relative flex min-h-7 w-full cursor-default items-center justify-center rounded-md px-2 py-1 text-xs/relaxed font-mono outline-hidden select-none transition-colors",
                opt === currentNum &&
                  "bg-foreground/10 text-foreground font-medium",
                opt !== currentNum &&
                  "text-muted-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
              )}
              onClick={() => {
                onChange(opt)
                setOpen(false)
              }}
            >
              {pad2(opt)}
            </button>
          ))}
          {options.length === 0 && (
            <div className="flex min-h-7 items-center justify-center px-2 py-1 text-xs text-muted-foreground">
              {pad2(parseInt(value, 10))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

/** Pad number to 2 digits */
const pad2 = (n: number) => n.toString().padStart(2, "0")

/** Check if two dates fall on the same calendar day */
const isSameDay = (a: Date | undefined, b: Date | undefined) => {
  if (!a || !b) return false
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/** Icon for each predefined date range */
function RangeIcon({ label }: { label: string }) {
  const lower = label.toLowerCase()
  if (
    lower.includes("day") ||
    lower.includes("yesterday")
  ) {
    return <IconClock className="size-4 shrink-0" />
  }
  return <IconCalendarEvent className="size-4 shrink-0" />
}

export interface CalendarTime {
  hours: number
  minutes: number
  seconds: number
}

interface CalendarDatePickerProps
  extends React.HTMLAttributes<HTMLButtonElement>, VariantProps<typeof multiSelectVariants> {
  id?: string
  className?: string
  date: DateRange
  numberOfMonths?: 1 | 2
  yearsRange?: number
  size?: VariantProps<typeof buttonVariants>["size"]
  onDateSelect: (range: { from: Date; to: Date }) => void
  /** Enable start/end time selection */
  enableTime?: boolean
  /** Called when time changes */
  onTimeChange?: (startTime: CalendarTime, endTime: CalendarTime) => void
  /** Initial start time (default 00:00:00) */
  startTime?: CalendarTime
  /** Initial end time (default 23:59:59) */
  endTime?: CalendarTime
  /** Selected range label to display on button (e.g., "Today", "Last 30 Days") */
  selectedRange?: string | null
  /** Called when a quick range is selected */
  onRangeChange?: (range: string | null) => void
  /** Single combined apply callback — receives dates + range label at once */
  onApply?: (dates: { from: Date; to: Date }, range: string | null) => void
  /** Disable specific dates (e.g., future dates) */
  disabled?: (date: Date) => boolean
}

export const CalendarDatePicker = React.forwardRef<HTMLButtonElement, CalendarDatePickerProps>(
  (
    {
      id = "calendar-date-picker",
      className,
      date,
      numberOfMonths = 2,
      yearsRange = 10,
      onDateSelect,
      variant,
      size = "default",
      enableTime = true,
      onTimeChange,
      startTime: initialStartTime = { hours: 0, minutes: 0, seconds: 0 },
      endTime: initialEndTime = { hours: 23, minutes: 59, seconds: 59 },
      selectedRange: selectedRangeProp,
      onRangeChange,
      onApply,
      disabled,
      ...props
    },
    ref
  ) => {
    const [isPopoverOpen, setIsPopoverOpen] = React.useState(false)
    const [selectedRange, setSelectedRange] = React.useState<string | null>(
      selectedRangeProp ?? "Today"
    )
    const [monthFrom, setMonthFrom] = React.useState<Date | undefined>(date?.from)
    const [yearFrom, setYearFrom] = React.useState<number | undefined>(date?.from?.getFullYear())
    const [monthTo, setMonthTo] = React.useState<Date | undefined>(numberOfMonths === 2 ? date?.to : date?.from)
    const [yearTo, setYearTo] = React.useState<number | undefined>(
      numberOfMonths === 2 ? date?.to?.getFullYear() : date?.from?.getFullYear()
    )
    // ─── Pending state for draft changes before Apply ───────────────
    const [pendingDate, setPendingDate] = React.useState<DateRange>(date)
    const [pendingStartTime, setPendingStartTime] = React.useState<CalendarTime>(initialStartTime)
    const [pendingEndTime, setPendingEndTime] = React.useState<CalendarTime>(initialEndTime)
    const [pendingSelectedRange, setPendingSelectedRange] = React.useState<string | null>(selectedRange)

    // Compute end time min constraints when from/to are the same day (uses pending)
    const sameDay = isSameDay(pendingDate?.from, pendingDate?.to)
    const endHourMin = sameDay ? pendingStartTime.hours : 0
    const endMinuteMin = sameDay && pendingStartTime.hours === pendingEndTime.hours ? pendingStartTime.minutes : 0
    const endSecondMin =
      sameDay && pendingStartTime.hours === pendingEndTime.hours && pendingStartTime.minutes === pendingEndTime.minutes
        ? Math.min(pendingStartTime.seconds + 1, 59)
        : 0

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

    const handleTogglePopover = () => setIsPopoverOpen((prev) => !prev)

    // ─── Reset back to the currently-committed date ─────────────────
    const handleReset = () => {
      setPendingDate(date)
      setPendingStartTime(initialStartTime)
      setPendingEndTime(initialEndTime)
      setPendingSelectedRange(selectedRange)
      setMonthFrom(date?.from)
      setYearFrom(date?.from?.getFullYear())
      setMonthTo(numberOfMonths === 2 ? date?.to : date?.from)
      setYearTo(numberOfMonths === 2 ? date?.to?.getFullYear() : date?.from?.getFullYear())
    }

    // ─── Apply pending changes ──────────────────────────────────────
    const handleApply = () => {
      const dates = { from: pendingDate.from!, to: pendingDate.to! }
      if (onApply) {
        onApply(dates, pendingSelectedRange)
      } else {
        onDateSelect(dates)
        onRangeChange?.(pendingSelectedRange)
      }
      setSelectedRange(pendingSelectedRange)
      if (enableTime) {
        onTimeChange?.(pendingStartTime, pendingEndTime)
      }
      setIsPopoverOpen(false)
    }

    // ─── Cancel – discard pending, close ────────────────────────────
    const handleCancel = () => {
      handleReset()
      setIsPopoverOpen(false)
    }

    const selectDateRange = (from: Date, to: Date, range: string) => {
      const startDate = startOfDay(toDate(from, { timeZone }))
      const endDate = numberOfMonths === 2 ? endOfDay(toDate(to, { timeZone })) : startDate
      setPendingDate({ from: startDate, to: endDate })
      setPendingSelectedRange(range)
      setMonthFrom(from)
      setYearFrom(from.getFullYear())
      setMonthTo(to)
      setYearTo(to.getFullYear())
    }

    const handleDateSelect = (range: DateRange | undefined) => {
      if (range) {
        let from = startOfDay(toDate(range.from as Date, { timeZone }))
        let to = range.to ? endOfDay(toDate(range.to, { timeZone })) : from
        if (numberOfMonths === 1) {
          if (range.from !== pendingDate.from) {
            to = from
          } else {
            from = startOfDay(toDate(range.to as Date, { timeZone }))
          }
        }
        setPendingDate({ from, to })
        setMonthFrom(from)
        setYearFrom(from.getFullYear())
        setMonthTo(to)
        setYearTo(to.getFullYear())
      }
      setPendingSelectedRange(null)
    }

    const handleMonthChange = (newMonthIndex: number, part: string) => {
      setPendingSelectedRange(null)
      if (part === "from") {
        if (yearFrom !== undefined) {
          if (newMonthIndex < 0 || newMonthIndex > yearsRange + 1) return
          const newMonth = new Date(yearFrom, newMonthIndex, 1)
          const from =
            numberOfMonths === 2
              ? startOfMonth(toDate(newMonth, { timeZone }))
              : pendingDate?.from
                ? new Date(pendingDate.from.getFullYear(), newMonth.getMonth(), pendingDate.from.getDate())
                : newMonth
          const to =
            numberOfMonths === 2
              ? pendingDate.to
                ? endOfDay(toDate(pendingDate.to, { timeZone }))
                : endOfMonth(toDate(newMonth, { timeZone }))
              : from
          if (from <= to) {
            setPendingDate({ from, to })
            setMonthFrom(newMonth)
            setMonthTo(pendingDate.to)
          }
        }
      } else {
        if (yearTo !== undefined) {
          if (newMonthIndex < 0 || newMonthIndex > yearsRange + 1) return
          const newMonth = new Date(yearTo, newMonthIndex, 1)
          const from = pendingDate.from
            ? startOfDay(toDate(pendingDate.from, { timeZone }))
            : startOfMonth(toDate(newMonth, { timeZone }))
          const to = numberOfMonths === 2 ? endOfMonth(toDate(newMonth, { timeZone })) : from
          if (from <= to) {
            setPendingDate({ from, to })
            setMonthTo(newMonth)
            setMonthFrom(pendingDate.from)
          }
        }
      }
    }

    const handleYearChange = (newYear: number, part: string) => {
      setPendingSelectedRange(null)
      if (part === "from") {
        if (years.includes(newYear)) {
          const newMonth = monthFrom
            ? new Date(newYear, monthFrom ? monthFrom.getMonth() : 0, 1)
            : new Date(newYear, 0, 1)
          const from =
            numberOfMonths === 2
              ? startOfMonth(toDate(newMonth, { timeZone }))
              : pendingDate.from
                ? new Date(newYear, newMonth.getMonth(), pendingDate.from.getDate())
                : newMonth
          const to =
            numberOfMonths === 2
              ? pendingDate.to
                ? endOfDay(toDate(pendingDate.to, { timeZone }))
                : endOfMonth(toDate(newMonth, { timeZone }))
              : from
          if (from <= to) {
            setPendingDate({ from, to })
            setYearFrom(newYear)
            setMonthFrom(newMonth)
            setYearTo(pendingDate.to?.getFullYear())
            setMonthTo(pendingDate.to)
          }
        }
      } else {
        if (years.includes(newYear)) {
          const newMonth = monthTo ? new Date(newYear, monthTo.getMonth(), 1) : new Date(newYear, 0, 1)
          const from = pendingDate.from
            ? startOfDay(toDate(pendingDate.from, { timeZone }))
            : startOfMonth(toDate(newMonth, { timeZone }))
          const to = numberOfMonths === 2 ? endOfMonth(toDate(newMonth, { timeZone })) : from
          if (from <= to) {
            setPendingDate({ from, to })
            setYearTo(newYear)
            setMonthTo(newMonth)
            setYearFrom(pendingDate.from?.getFullYear())
            setMonthFrom(pendingDate.from)
          }
        }
      }
    }

    const today = new Date()

    const years = Array.from({ length: yearsRange + 1 }, (_, i) => today.getFullYear() - yearsRange / 2 + i)

    const dateRanges = [
      { label: "Today", start: today, end: today },
      { label: "Yesterday", start: subDays(today, 1), end: subDays(today, 1) },
      { label: "Last 7 Days", start: subDays(today, 6), end: today },
      { label: "Last 30 Days", start: subDays(today, 29), end: today },
      {
        label: "This Week",
        start: startOfWeek(today, { weekStartsOn: 1 }),
        end: endOfWeek(today, { weekStartsOn: 1 }),
      },
      {
        label: "Last Week",
        start: subDays(startOfWeek(today, { weekStartsOn: 1 }), 7),
        end: subDays(endOfWeek(today, { weekStartsOn: 1 }), 7),
      },
      { label: "This Month", start: startOfMonth(today), end: endOfMonth(today) },      { label: "Last Month",
        start: startOfMonth(subDays(today, today.getDate())),
        end: endOfMonth(subDays(today, today.getDate())),
      },
      { label: "This Year", start: startOfYear(today), end: endOfYear(today) },
      { label: "Last Year", start: startOfYear(subDays(today, 365)), end: endOfYear(subDays(today, 365)) },
    ]

    const pendingTimeRef = React.useRef({ startTime: pendingStartTime, endTime: pendingEndTime })

    // Keep ref in sync with pending state
    React.useEffect(() => {
      pendingTimeRef.current = { startTime: pendingStartTime, endTime: pendingEndTime }
    }, [pendingStartTime, pendingEndTime])

    const handleTimeChange = (part: "start" | "end", field: "hours" | "minutes" | "seconds", value: number) => {
      const key = part === "start" ? "startTime" : "endTime"
      const current = pendingTimeRef.current[key]
      const updated = { ...current, [field]: value }
      pendingTimeRef.current[key] = updated
      if (part === "start") {
        setPendingStartTime(pendingTimeRef.current.startTime)
      } else {
        setPendingEndTime(pendingTimeRef.current.endTime)
      }
    }

    const formatWithTz = (date: Date, fmt: string) => formatInTimeZone(date, timeZone, fmt)

    // Compact button format
    const buttonLabel = React.useMemo(() => {
      // Show range name if provided (e.g., "Today", "Last 30 Days")
      if (selectedRangeProp) {
        return <span>{selectedRangeProp}</span>
      }
      // Otherwise show date range
      if (!date?.from) return <span>Select date</span>
      if (!date.to) {
        return (
          <span>
            {formatWithTz(date.from, "dd MMM, yyyy")}
          </span>
        )
      }
      return (
        <span>
          {formatWithTz(date.from, "dd MMM, yyyy")} - {formatWithTz(date.to, "dd MMM, yyyy")}
        </span>
      )
    }, [date?.from, date?.to, selectedRangeProp])

    return (
        <Popover open={isPopoverOpen} onOpenChange={(open) => {
          if (!open) handleCancel()
          setIsPopoverOpen(open)
        }}>
          <PopoverTrigger asChild>
            <Button
              id="date"
              ref={ref}
              {...props}
              className={cn("w-auto h-7", multiSelectVariants({ variant, className }), "text-xs")}
              size={size}
              onClick={handleTogglePopover}
              suppressHydrationWarning
            >
              <IconCalendar className="size-3.5 shrink-0" />
              {buttonLabel}
            </Button>
          </PopoverTrigger>
          {isPopoverOpen && (
            <PopoverContent
              className="w-auto"
              align="end"
              sideOffset={8}
              onEscapeKeyDown={handleCancel}
              onInteractOutside={(e) => e.preventDefault()}
              style={{
                maxHeight: "var(--radix-popover-content-available-height)",
                overflowY: "auto",
              }}
            >
              <div className="flex">
                {numberOfMonths === 2 && (
                  <div className="flex flex-col gap-0.5 border-r border-foreground/10 pr-3 text-left">
                    <span className="px-2 pb-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wider select-none">
                      Quick ranges
                    </span>
                    {/* Days */}
                    {dateRanges.slice(0, 4).map(({ label, start, end }) => (
                      <Button
                        key={label}
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "justify-start text-xs h-7 px-2 gap-2 hover:bg-primary/90 hover:text-white",
                          pendingSelectedRange === label &&
                            "bg-primary text-white hover:bg-primary/90 hover:text-white"
                        )}
                        onClick={() => {
                          selectDateRange(start, end, label)
                          setMonthFrom(start)
                          setYearFrom(start.getFullYear())
                          setMonthTo(end)
                          setYearTo(end.getFullYear())
                        }}
                      >
                        <RangeIcon label={label} />
                        {label}
                      </Button>
                    ))}
                    <div className="my-1 border-t border-foreground/10" />
                    {/* Weeks */}
                    {dateRanges.slice(4, 6).map(({ label, start, end }) => (
                      <Button
                        key={label}
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "justify-start text-xs h-7 px-2 gap-2 hover:bg-primary/90 hover:text-white",
                          pendingSelectedRange === label &&
                            "bg-primary text-white hover:bg-primary/90 hover:text-white"
                        )}
                        onClick={() => {
                          selectDateRange(start, end, label)
                          setMonthFrom(start)
                          setYearFrom(start.getFullYear())
                          setMonthTo(end)
                          setYearTo(end.getFullYear())
                        }}
                      >
                        <RangeIcon label={label} />
                        {label}
                      </Button>
                    ))}
                    <div className="my-1 border-t border-foreground/10" />
                    {/* Months + Years */}
                    {dateRanges.slice(6).map(({ label, start, end }) => (
                      <Button
                        key={label}
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "justify-start text-xs h-7 px-2 gap-2 hover:bg-primary/90 hover:text-white",
                          pendingSelectedRange === label &&
                            "bg-primary text-white hover:bg-primary/90 hover:text-white"
                        )}
                        onClick={() => {
                          selectDateRange(start, end, label)
                          setMonthFrom(start)
                          setYearFrom(start.getFullYear())
                          setMonthTo(end)
                          setYearTo(end.getFullYear())
                        }}
                      >
                        <RangeIcon label={label} />
                        {label}
                      </Button>
                    ))}
                  </div>
                )}
                <div className="flex flex-col">
                  <div className="flex items-center gap-3">
                    <div className="ml-2 flex w-full gap-1.5">
                      <Select
                        onValueChange={(value) => {
                          handleMonthChange(months.indexOf(value), "from")
                          setPendingSelectedRange(null)
                        }}
                        value={monthFrom ? months[monthFrom.getMonth()] : undefined}
                      >
                        <SelectTrigger className="w-full min-w-[100px] h-7 text-xs font-medium hover:bg-accent hover:text-accent-foreground focus:ring-0 focus:ring-offset-0">
                          <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent>
                          {months.map((month, idx) => (
                            <SelectItem key={idx} value={month} className="text-xs">
                              {month}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        onValueChange={(value) => {
                          handleYearChange(Number(value), "from")
                          setPendingSelectedRange(null)
                        }}
                        value={yearFrom ? yearFrom.toString() : undefined}
                      >
                        <SelectTrigger className="w-[70px] h-7 text-xs font-medium hover:bg-accent hover:text-accent-foreground focus:ring-0 focus:ring-offset-0">
                          <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                          {years.map((year, idx) => (
                            <SelectItem key={idx} value={year.toString()} className="text-xs">
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {numberOfMonths === 2 && (
                      <div className="flex w-full gap-1.5">
                        <Select
                          onValueChange={(value) => {
                            handleMonthChange(months.indexOf(value), "to")
                            setPendingSelectedRange(null)
                          }}
                          value={monthTo ? months[monthTo.getMonth()] : undefined}
                        >
                          <SelectTrigger className="w-full min-w-[100px] h-7 text-xs font-medium hover:bg-accent hover:text-accent-foreground focus:ring-0 focus:ring-offset-0">
                            <SelectValue placeholder="Month" />
                          </SelectTrigger>
                          <SelectContent>
                            {months.map((month, idx) => (
                              <SelectItem key={idx} value={month} className="text-xs">
                                {month}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          onValueChange={(value) => {
                            handleYearChange(Number(value), "to")
                            setPendingSelectedRange(null)
                          }}
                          value={yearTo ? yearTo.toString() : undefined}
                        >
                          <SelectTrigger className="w-[70px] h-7 text-xs font-medium hover:bg-accent hover:text-accent-foreground focus:ring-0 focus:ring-offset-0">
                            <SelectValue placeholder="Year" />
                          </SelectTrigger>
                          <SelectContent>
                            {years.map((year, idx) => (
                              <SelectItem key={idx} value={year.toString()} className="text-xs">
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  <div className="flex">
                    <Calendar
                      mode="range"
                      defaultMonth={monthFrom}
                      month={monthFrom}
                      onMonthChange={setMonthFrom}
                      selected={pendingDate}
                      onSelect={handleDateSelect}
                      numberOfMonths={numberOfMonths}
                      showOutsideDays={true}
                      className="w-full pr-0"
                      fixedWeeks
                      disabled={disabled}
                    />
                  </div>
                  {/* Time selectors */}
                  {enableTime && (
                    <div className="grid grid-cols-2 gap-x-4 border-t border-border pt-3 mt-2 pl-2">
                      {/* Start time */}
                      <div className="flex items-center justify-center gap-1">
                        <TimeSelect
                          value={pad2(pendingStartTime.hours)}
                          max={23}
                          min={0}
                          onChange={(v) => handleTimeChange("start", "hours", v)}
                        />
                        <span className="text-xs font-bold text-muted-foreground/40 select-none">:</span>
                        <TimeSelect
                          value={pad2(pendingStartTime.minutes)}
                          max={59}
                          min={0}
                          onChange={(v) => handleTimeChange("start", "minutes", v)}
                        />
                        <span className="text-xs font-bold text-muted-foreground/40 select-none">:</span>
                        <TimeSelect
                          value={pad2(pendingStartTime.seconds)}
                          max={59}
                          min={0}
                          onChange={(v) => handleTimeChange("start", "seconds", v)}
                        />
                      </div>
                      {/* End time */}
                      <div className="flex items-center justify-center gap-1">
                        <TimeSelect
                          value={pad2(pendingEndTime.hours)}
                          max={23}
                          min={endHourMin}
                          onChange={(v) => handleTimeChange("end", "hours", v)}
                        />
                        <span className="text-xs font-bold text-muted-foreground/40 select-none">:</span>
                        <TimeSelect
                          value={pad2(pendingEndTime.minutes)}
                          max={59}
                          min={endMinuteMin}
                          onChange={(v) => handleTimeChange("end", "minutes", v)}
                        />
                        <span className="text-xs font-bold text-muted-foreground/40 select-none">:</span>
                        <TimeSelect
                          value={pad2(pendingEndTime.seconds)}
                          max={59}
                          min={endSecondMin}
                          onChange={(v) => handleTimeChange("end", "seconds", v)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {/* ─── Footer: Reset / Cancel / Apply ─────────────────── */}
              <div className="flex items-center justify-between border-t border-border pt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                  onClick={handleReset}
                >
                  <IconRefresh className="size-3.5" />
                  Reset
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="text-xs"
                    onClick={handleApply}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </PopoverContent>
          )}
        </Popover>
    )
  }
)

CalendarDatePicker.displayName = "CalendarDatePicker"
