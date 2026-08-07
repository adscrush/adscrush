"use client"

import { IconX } from "@tabler/icons-react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import * as React from "react"

import { Button } from "@adscrush/ui/components/button"
import { cn } from "@adscrush/ui/lib/utils"

type BackdropType = "opaque" | "blur" | "transparent" | "gradient"

interface DialogContextType {
  backdrop: BackdropType
  size:
    | "sm"
    | "md"
    | "lg"
    | "xl"
    | "2xl"
    | "3xl"
    | "4xl"
    | "5xl"
    | "6xl"
    | "7xl"
    | "full"
  classNames?: {
    backdrop?: string
    content?: string
  }
}

const sizeMap = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
  "2xl": "sm:max-w-2xl",
  "3xl": "sm:max-w-3xl",
  "4xl": "sm:max-w-4xl",
  "5xl": "sm:max-w-5xl",
  "6xl": "sm:max-w-6xl",
  "7xl": "sm:max-w-7xl",
  full: "sm:max-w-full",
}

const backdropStyles: Record<BackdropType, string> = {
  opaque: "bg-black/50",
  blur: "backdrop-blur-sm backdrop-saturate-150 bg-black/50",
  transparent: "bg-transparent",
  gradient: "bg-gradient-to-t from-black/90 to-black/20 backdrop-opacity-20",
}

const DialogContext = React.createContext<DialogContextType>({
  backdrop: "gradient",
  size: "md",
})

function Dialog({
  backdrop = "gradient",
  size = "md",
  classNames,
  ref,
  ...props
}: DialogPrimitive.Root.Props & {
  ref?: React.RefObject<HTMLDivElement | null>
} & Partial<DialogContextType>) {
  return (
    <DialogContext.Provider value={{ backdrop, size, classNames }}>
      <DialogPrimitive.Root data-slot="dialog" {...props} />
    </DialogContext.Provider>
  )
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  const { backdrop, classNames } = React.useContext(DialogContext)

  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        backdropStyles[backdrop],
        classNames?.backdrop,
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  showOverlay = true,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean
  showOverlay?: boolean
}) {
  const { size, classNames } = React.useContext(DialogContext)

  return (
    <DialogPortal>
      {showOverlay && <DialogOverlay />}
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          "fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 duration-100 outline-none sm:max-w-sm data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          sizeMap[size],
          classNames?.content,
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            render={
              <Button
                variant="ghost"
                className="absolute top-2 right-2"
                size="icon-sm"
              >
                <IconX />
                <span className="sr-only">Close</span>
              </Button>
            }
          />
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close
          render={<Button variant="outline">Close</Button>}
        />
      )}
    </div>
  )
}
function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-base leading-none font-medium", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export function createDialogCloseEvent() {
  return {
    reason: "imperative-action" as const,
    event: new Event("dialog-close"),
    cancel: () => {},
    allowPropagation: () => {},
    isCanceled: false,
    isPropagationAllowed: true,
    trigger: undefined,
    preventUnmountOnClose: () => {},
  }
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
