"use client"

import { EmployeeSelect } from "@/features/employees/components/employee-select"
import { MEDIA_BUYER_STATUS } from "@adscrush/shared/constants/status"
import { updateMediaBuyerSchema } from "@adscrush/shared/validators/media-buyer.schema"
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
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@adscrush/ui/components/field"
import { Input } from "@adscrush/ui/components/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@adscrush/ui/components/select"
import { toast } from "@adscrush/ui/sonner"
import { zodResolver } from "@hookform/resolvers/zod"
import { IconLoader2 } from "@tabler/icons-react"
import React from "react"
import { Controller, useForm } from "react-hook-form"
import type { z } from "zod"
import type { MediaBuyer } from "../queries"
import { useUpdateMediaBuyer } from "../queries"

const editSchema = updateMediaBuyerSchema

type EditMediaBuyerInput = z.infer<typeof editSchema>

interface UpdateMediaBuyerDialogProps extends Omit<React.ComponentPropsWithoutRef<typeof Dialog>, "children"> {
  mediaBuyer: MediaBuyer | null
}

export function UpdateMediaBuyerDialog({ mediaBuyer, open, onOpenChange }: UpdateMediaBuyerDialogProps) {
  const updateMutation = useUpdateMediaBuyer()

  const {
    control,
    handleSubmit,
    reset,

    formState: { isSubmitting },
  } = useForm({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: mediaBuyer?.name || "",
      email: mediaBuyer?.email || "",
      phoneNumber: mediaBuyer?.phoneNumber || "",
      status: mediaBuyer?.status || "active",
      accountManagerId: mediaBuyer?.accountManagerId || "",
      internalNotes: mediaBuyer?.internalNotes || "",
    },
  })

  React.useEffect(() => {
    if (open && mediaBuyer) {
      reset({
        name: mediaBuyer.name,
        email: mediaBuyer.email,
        phoneNumber: mediaBuyer.phoneNumber || "",
        status: mediaBuyer.status,
        accountManagerId: mediaBuyer.accountManagerId || "",
        internalNotes: mediaBuyer.internalNotes || "",
      })
    }
    // Intentionally keyed on the entity id, not the object identity: refetches
    // create a new object every time, which would reset in-progress edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mediaBuyer?.id, reset])

  const onSubmit = async (data: EditMediaBuyerInput) => {
    if (!mediaBuyer) return

    await updateMutation.mutateAsync(
      { id: mediaBuyer.id, ...data },
      {
        onSuccess: () => {
          toast.success("Media buyer updated")
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
    <Dialog open={open} onOpenChange={onOpenChange} size="lg" key={mediaBuyer?.id}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Media Buyer</DialogTitle>
          <DialogDescription>Update media buyer details.</DialogDescription>
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
                  <Input {...field} id={field.name} aria-invalid={fieldState.invalid} placeholder="Media buyer name" />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </FieldContent>
              </Field>
            )}
          />

          <FieldGroup className="flex flex-row items-start gap-4">
            <Controller
              name="email"
              control={control}
              render={({ field, fieldState }) => (
                <Field orientation="vertical" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Email <span className="text-destructive">*</span>
                  </FieldLabel>
                  <FieldContent className="w-full flex-1">
                    <Input
                      {...field}
                      type="email"
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      placeholder="test@example.com"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </FieldContent>
                </Field>
              )}
            />
            <Controller
              name="phoneNumber"
              control={control}
              render={({ field, fieldState }) => (
                <Field orientation="vertical" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Phone Number</FieldLabel>
                  <FieldContent className="w-full flex-1">
                    <Input {...field} id={field.name} placeholder="+1 (555) 000-0000" />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </FieldContent>
                </Field>
              )}
            />
          </FieldGroup>

          <FieldGroup className="flex flex-row items-start gap-4">
            <Controller
              name="accountManagerId"
              control={control}
              render={({ field, fieldState }) => (
                <Field orientation="vertical" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Account Manager</FieldLabel>
                  <FieldContent>
                    <EmployeeSelect value={field.value} onValueChange={field.onChange} disabled={isLoading} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
                        {Object.values(MEDIA_BUYER_STATUS).map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </FieldContent>
                </Field>
              )}
            />
          </FieldGroup>

          <Controller
            name="internalNotes"
            control={control}
            render={({ field, fieldState }) => (
              <Field orientation="vertical" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Internal Notes</FieldLabel>
                <FieldContent className="w-full flex-1">
                  <Input {...field} id={field.name} placeholder="Optional notes..." />
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
