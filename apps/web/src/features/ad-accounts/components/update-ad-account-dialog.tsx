"use client"

import { AD_ACCOUNT_STATUS_VALUES } from "@adscrush/shared/constants/status"
import { updateAdAccountSchema } from "@adscrush/shared/validators/ad-account.schema"
import { Button } from "@adscrush/ui/components/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  createDialogCloseEvent,
} from "@adscrush/ui/components/dialog"
import { Field, FieldContent, FieldError, FieldLabel } from "@adscrush/ui/components/field"
import { Input } from "@adscrush/ui/components/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@adscrush/ui/components/select"
import { toast } from "@adscrush/ui/sonner"
import { zodResolver } from "@hookform/resolvers/zod"
import { IconLoader2 } from "@tabler/icons-react"
import React from "react"
import { Controller, useForm } from "react-hook-form"
import type { z } from "zod"
import type { AdAccount } from "../queries"
import { useUpdateAdAccount } from "../queries"
import { MediaBuyerCombobox } from "./media-buyer-combobox"

const editSchema = updateAdAccountSchema

type EditAdAccountInput = z.infer<typeof editSchema>

interface UpdateAdAccountDialogProps extends Omit<React.ComponentPropsWithoutRef<typeof Dialog>, "children"> {
  adAccount: AdAccount | null
}

export function UpdateAdAccountDialog({ adAccount, open, onOpenChange }: UpdateAdAccountDialogProps) {
  const updateMutation = useUpdateAdAccount()

  const {
    control,
    handleSubmit,
    reset,

    formState: { isSubmitting },
  } = useForm({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: adAccount?.name || "",
      sourcePlatform: adAccount?.sourcePlatform || "",
      accountId: adAccount?.accountId || "",
      mediaBuyerId: adAccount?.mediaBuyerId ?? null,
      status: adAccount?.status || "active",
    },
  })

  React.useEffect(() => {
    if (open && adAccount) {
      reset({
        name: adAccount.name,
        sourcePlatform: adAccount.sourcePlatform,
        accountId: adAccount.accountId,
        mediaBuyerId: adAccount.mediaBuyerId,
        status: adAccount.status,
      })
    }
    // Intentionally keyed on the entity id, not the object identity: refetches
    // create a new object every time, which would reset in-progress edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, adAccount?.id, reset])

  const onSubmit = async (data: EditAdAccountInput) => {
    if (!adAccount) return

    await updateMutation.mutateAsync(
      { id: adAccount.id, data },
      {
        onSuccess: () => {
          toast.success("Ad account updated")
          onOpenChange?.(false, createDialogCloseEvent())
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  }

  const isLoading = updateMutation.isPending || isSubmitting

  return (
    <Dialog open={open} onOpenChange={onOpenChange} size="lg" key={adAccount?.id}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Ad Account</DialogTitle>
          <DialogDescription>Update ad account details.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Controller
            name="name"
            control={control}
            render={({ field, fieldState }) => (
              <Field orientation="vertical" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>
                  Name <span className="text-destructive">*</span>
                </FieldLabel>
                <FieldContent className="w-full flex-1">
                  <Input {...field} id={field.name} aria-invalid={fieldState.invalid} placeholder="Ad account name" />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </FieldContent>
              </Field>
            )}
          />

          <Controller
            name="sourcePlatform"
            control={control}
            render={({ field, fieldState }) => (
              <Field orientation="vertical" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Source Platform</FieldLabel>
                <FieldContent className="w-full flex-1">
                  <Input {...field} id={field.name} placeholder="e.g. Facebook, Google" />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </FieldContent>
              </Field>
            )}
          />

          <Controller
            name="accountId"
            control={control}
            render={({ field, fieldState }) => (
              <Field orientation="vertical" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Account ID</FieldLabel>
                <FieldContent className="w-full flex-1">
                  <Input {...field} id={field.name} placeholder="Platform account ID" />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </FieldContent>
              </Field>
            )}
          />

          <Controller
            name="mediaBuyerId"
            control={control}
            render={({ field }) => (
              <Field orientation="vertical">
                <FieldLabel>Media Buyer</FieldLabel>
                <FieldContent>
                  <MediaBuyerCombobox
                    value={field.value ?? null}
                    onValueChange={(val) => field.onChange(val)}
                    selectedMediaBuyer={adAccount?.mediaBuyer ?? null}
                    placeholder="Select media buyer..."
                  />
                </FieldContent>
              </Field>
            )}
          />

          <Controller
            name="status"
            control={control}
            render={({ field, fieldState }) => (
              <Field orientation="vertical" data-invalid={fieldState.invalid}>
                <FieldLabel>Status</FieldLabel>
                <FieldContent>
                  <Select value={field.value} onValueChange={field.onChange}>
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
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </FieldContent>
              </Field>
            )}
          />

          <DialogFooter>
            <DialogClose
              render={
                <Button variant="outline" disabled={isLoading} type="button">
                  Cancel
                </Button>
              }
            />

            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <IconLoader2 className="mr-2 size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
