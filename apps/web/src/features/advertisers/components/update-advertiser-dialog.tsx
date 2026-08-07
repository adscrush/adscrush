"use client"

import { EmployeeSelect } from "@/features/employees/components/employee-select"
import { ADVERTISER_STATUS } from "@adscrush/shared/constants/status"
import { updateAdvertiserSchema } from "@adscrush/shared/validators/advertiser.schema"
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
import type { Advertiser } from "../queries"
import { useUpdateAdvertiser } from "../queries"

const editSchema = updateAdvertiserSchema.partial()

type EditAdvertiserInput = z.infer<typeof editSchema>

interface UpdateAdvertiserDialogProps extends Omit<React.ComponentPropsWithoutRef<typeof Dialog>, "children"> {
  advertiser: Advertiser | null
}

export function UpdateAdvertiserDialog({ advertiser, open, onOpenChange }: UpdateAdvertiserDialogProps) {
  const updateMutation = useUpdateAdvertiser()

  const {
    control,
    handleSubmit,
    reset,

    formState: { isSubmitting },
  } = useForm({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: advertiser?.name || "",
      companyName: advertiser?.companyName || "",
      email: advertiser?.email || "",
      status: advertiser?.status || "active",
      accountManagerId: advertiser?.accountManagerId || "",
      website: advertiser?.website || "",
      country: advertiser?.country || "",
    },
  })

  React.useEffect(() => {
    if (open && advertiser) {
      reset({
        name: advertiser.name,
        companyName: advertiser.companyName || "",
        email: advertiser.email,
        status: advertiser.status,
        accountManagerId: advertiser.accountManagerId || "",
        website: advertiser.website || "",
        country: advertiser.country || "",
      })
    }
    // Intentionally keyed on the entity id, not the object identity: refetches
    // create a new object every time, which would reset in-progress edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, advertiser?.id, reset])

  const onSubmit = async (data: EditAdvertiserInput) => {
    if (!advertiser) return

    await updateMutation.mutateAsync(
      { id: advertiser.id, ...data },
      {
        onSuccess: () => {
          toast.success("Advertiser updated")
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
    <Dialog open={open} onOpenChange={onOpenChange} size="lg" key={advertiser?.id}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Advertiser</DialogTitle>
          <DialogDescription>Update advertiser details.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <FieldGroup className="flex flex-row items-start gap-4">
            <Controller
              name="name"
              control={control}
              render={({ field, fieldState }) => (
                <Field orientation="vertical" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Name <span className="text-destructive">*</span>
                  </FieldLabel>
                  <FieldContent className="w-full flex-1">
                    <Input {...field} id={field.name} aria-invalid={fieldState.invalid} placeholder="Advertiser name" />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </FieldContent>
                </Field>
              )}
            />
            <Controller
              name="companyName"
              control={control}
              render={({ field, fieldState }) => (
                <Field orientation="vertical" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Company (Brand)</FieldLabel>
                  <FieldContent className="w-full flex-1">
                    <Input {...field} id={field.name} placeholder="Company" />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </FieldContent>
                </Field>
              )}
            />
          </FieldGroup>

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
              name="website"
              control={control}
              render={({ field, fieldState }) => (
                <Field orientation="vertical" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Website</FieldLabel>
                  <FieldContent className="w-full flex-1">
                    <Input {...field} id={field.name} placeholder="https://example.com" />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </FieldContent>
                </Field>
              )}
            />
          </FieldGroup>

          <FieldGroup className="flex flex-row items-start gap-4">
            <Controller
              name="country"
              control={control}
              render={({ field, fieldState }) => (
                <Field orientation="vertical" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Country</FieldLabel>
                  <FieldContent className="w-full flex-1">
                    <Input {...field} id={field.name} placeholder="Country" />
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
                        {Object.values(ADVERTISER_STATUS).map((status) => (
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
