"use client"

import { updateDepartmentSchema } from "@adscrush/shared/validators/department.schema"
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
import type { Department } from "../queries"
import { useUpdateDepartment } from "../queries"

type EditDepartmentInput = z.infer<typeof updateDepartmentSchema>

interface UpdateDepartmentDialogProps extends Omit<React.ComponentPropsWithoutRef<typeof Dialog>, "children"> {
  department: Department | null
}

export function UpdateDepartmentDialog({ department, open, onOpenChange }: UpdateDepartmentDialogProps) {
  const updateMutation = useUpdateDepartment()

  const { control, handleSubmit, reset } = useForm({
    resolver: zodResolver(updateDepartmentSchema),
    defaultValues: {
      name: department?.name || "",
      description: department?.description || "",
      status: department?.status || "active",
    },
  })

  React.useEffect(() => {
    if (open && department) {
      reset({
        name: department.name,
        description: department.description || "",
        status: department.status as "active" | "inactive",
      })
    }
    // Intentionally keyed on the entity id, not the object identity: refetches
    // create a new object every time, which would reset in-progress edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, department?.id])

  const onSubmit = async (data: EditDepartmentInput) => {
    if (!department) return

    await updateMutation.mutateAsync(
      { id: department.id, ...data },
      {
        onSuccess: () => {
          toast.success("Department updated")
          onOpenChange?.(false, createDialogCloseEvent())
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  }

  const isLoading = updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange} key={department?.id}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Department</DialogTitle>
          <DialogDescription>Update department details.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pt-4">
          <Controller
            name="name"
            control={control}
            render={({ field, fieldState }) => (
              <Field orientation="vertical" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                <FieldContent>
                  <Input {...field} id={field.name} aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </FieldContent>
              </Field>
            )}
          />

          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <Field orientation="vertical">
                <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                <FieldContent>
                  <Input {...field} id={field.name} />
                </FieldContent>
              </Field>
            )}
          />

          <Controller
            name="status"
            control={control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Status</FieldLabel>
                <Select value={field.value || "active"} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
