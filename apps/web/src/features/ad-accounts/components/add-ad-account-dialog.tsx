"use client"

import { AD_ACCOUNT_STATUS_VALUES } from "@adscrush/shared/constants/status"
import type { CreateAdAccountInput } from "@adscrush/shared/validators/ad-account.schema"
import { createAdAccountSchema } from "@adscrush/shared/validators/ad-account.schema"
import { Button } from "@adscrush/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@adscrush/ui/components/dialog"
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@adscrush/ui/components/field"
import { Input } from "@adscrush/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@adscrush/ui/components/select"
import { toast } from "@adscrush/ui/sonner"
import { zodResolver } from "@hookform/resolvers/zod"
import { IconLoader2 } from "@tabler/icons-react"
import React, { useState } from "react"
import { Controller, useForm, type SubmitHandler } from "react-hook-form"
import { useCreateAdAccount } from "../queries"
import { MediaBuyerCombobox } from "./media-buyer-combobox"

interface AddAdAccountDialogProps {
  children?: React.ReactElement
  onOpenChange?: (open: boolean) => void
  onCreated?: () => void
}

export function AddAdAccountDialog({
  children,
  onOpenChange,
  onCreated,
}: AddAdAccountDialogProps) {
  const [open, setOpen] = useState(false)
  const createMutation = useCreateAdAccount()

  const form = useForm({
    resolver: zodResolver(createAdAccountSchema),
    defaultValues: {
      name: "",
      sourcePlatform: "",
      accountId: "",
      mediaBuyerId: null,
      status: "active",
    },
  })

  const {
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { isSubmitting },
  } = form

  const currentStatus = watch("status")

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    onOpenChange?.(newOpen)
    if (!newOpen) reset()
  }

  const onSubmit: SubmitHandler<CreateAdAccountInput> = async (data) => {
    await createMutation.mutateAsync(data, {
      onSuccess: () => {
        toast.success("Ad account created successfully!")
        handleOpenChange(false)
        onCreated?.()
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} size="lg">
      <DialogTrigger render={children} />
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Ad Account</DialogTitle>
          <DialogDescription>
            Add a new ad account to your network
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* ── Name ── */}
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field orientation="vertical" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name} className="">
                  Name <span className="text-destructive">*</span>
                </FieldLabel>
                <FieldContent className="w-full flex-1">
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="Ad account name"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </FieldContent>
              </Field>
            )}
          />

          {/* ── Source Platform ── */}
          <Controller
            name="sourcePlatform"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field orientation="vertical" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name} className="">
                  Source Platform <span className="text-destructive">*</span>
                </FieldLabel>
                <FieldContent className="w-full flex-1">
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="e.g. Facebook, Google"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </FieldContent>
              </Field>
            )}
          />

          {/* ── Account ID ── */}
          <Controller
            name="accountId"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field orientation="vertical" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name} className="">
                  Account ID <span className="text-destructive">*</span>
                </FieldLabel>
                <FieldContent className="w-full flex-1">
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="Platform account ID"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </FieldContent>
              </Field>
            )}
          />

          {/* ── Media Buyer ── */}
          <Controller
            name="mediaBuyerId"
            control={form.control}
            render={({ field }) => (
              <Field orientation="vertical">
                <FieldLabel>Media Buyer</FieldLabel>
                <FieldContent>
                  <MediaBuyerCombobox
                    value={field.value ?? null}
                    onValueChange={(val) => field.onChange(val)}
                    placeholder="Select media buyer..."
                  />
                </FieldContent>
              </Field>
            )}
          />

          {/* ── Status ── */}
          <Controller
            name="status"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field orientation="vertical" data-invalid={fieldState.invalid}>
                <FieldLabel>Status</FieldLabel>
                <FieldContent>
                  <Select
                    value={currentStatus}
                    onValueChange={(value) =>
                      setValue(
                        "status",
                        value as CreateAdAccountInput["status"]
                      )
                    }
                  >
                    <SelectTrigger className="w-full" {...field}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AD_ACCOUNT_STATUS_VALUES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </FieldContent>
              </Field>
            )}
          />

          {/* ── Submit ── */}
          <DialogFooter>
            <Button
              type="submit"
              disabled={isSubmitting || createMutation.isPending}
            >
              {isSubmitting || createMutation.isPending ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Ad Account"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
