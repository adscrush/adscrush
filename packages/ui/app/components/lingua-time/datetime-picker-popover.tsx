"use client"

import { useEffect, useState } from "react"

import { useMediaQuery } from "@adscrush/ui/hooks/use-media-query"
import { Calendar } from "@adscrush/ui/components/calendar"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@adscrush/ui/components/drawer"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@adscrush/ui/components/popover"

import { TimePicker } from "../time-picker/time-picker"
import { generateDateString } from "./datetime-utils"

interface DateTimePickerPopoverProps {
  children: React.ReactNode
  onOpen: () => void
  dateTime: Date | undefined
  setDateTime: React.Dispatch<React.SetStateAction<Date | undefined>>
  setInputValue: React.Dispatch<React.SetStateAction<string>>
}

export function DateTimePickerPopover({
  children,
  onOpen,
  dateTime,
  setDateTime,
  setInputValue,
}: DateTimePickerPopoverProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const isDesktop = useMediaQuery("(min-width: 640px)")

  useEffect(() => {
    if (dateTime) {
      setInputValue(generateDateString(dateTime))
    }
  }, [dateTime, setInputValue])

  if (!isDesktop) {
    return (
      <Drawer
        open={isDrawerOpen}
        onOpenChange={(value) => {
          onOpen()
          setIsDrawerOpen(value)
        }}
        shouldScaleBackground
      >
        <DrawerTrigger asChild>{children}</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader className="sr-only text-left">
            <DrawerTitle>Date Time Picker</DrawerTitle>
            <DrawerDescription>Select date and time</DrawerDescription>
          </DrawerHeader>
          <div className="flex flex-col py-5">
            <Calendar
              mode="single"
              selected={dateTime}
              onSelect={setDateTime}
              className="self-center"
            />
            <div className="border-t border-border p-3">
              <TimePicker date={dateTime} setDate={setDateTime} />
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Popover
      open={isPopoverOpen}
      onOpenChange={(value) => {
        onOpen()
        setIsPopoverOpen(value)
      }}
    >
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="center" side="right" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={dateTime}
          onSelect={setDateTime}
        />
        <div className="border-t border-border p-3">
          <TimePicker date={dateTime} setDate={setDateTime} />
        </div>
      </PopoverContent>
    </Popover>
  )
}
