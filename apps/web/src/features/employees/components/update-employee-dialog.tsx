"use client"

import { DepartmentSelect } from "@/features/departments/components/department-select"
import { authClient } from "@/lib/auth/client"
import { ROLES, type Role } from "@adscrush/shared/constants/roles"
import { EMPLOYEE_STATUS, type EmployeeStatus } from "@adscrush/shared/constants/status"
import { getManageableRoles, isAtLeastRole } from "@adscrush/shared/utils/roles"
import type { UpdateEmployeeInput } from "@adscrush/shared/validators/employee.schema"
import { updateEmployeeSchema } from "@adscrush/shared/validators/employee.schema"
import { Button } from "@adscrush/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@adscrush/ui/components/dialog"
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@adscrush/ui/components/field"
import { Input } from "@adscrush/ui/components/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@adscrush/ui/components/select"
import { toast } from "@adscrush/ui/sonner"
import { zodResolver } from "@hookform/resolvers/zod"
import { IconLoader2 } from "@tabler/icons-react"
import { useEffect } from "react"
import { Controller, useForm, type SubmitHandler } from "react-hook-form"
import { useUpdateEmployee } from "../queries"
import type { Employee } from "../queries"

interface UpdateEmployeeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: Employee | null
}

export function UpdateEmployeeDialog({ open, onOpenChange, employee }: UpdateEmployeeDialogProps) {
  const { data: session } = authClient.useSession()
  const currentUserRole = (session?.user?.role as Role) || ROLES.USER
  const canChangeRole = isAtLeastRole(currentUserRole, ROLES.ADMIN)
  const manageableRoles = getManageableRoles(currentUserRole)

  const updateMutation = useUpdateEmployee()

  const form = useForm({
    resolver: zodResolver(updateEmployeeSchema),
    defaultValues: {
      name: employee?.name || "",
      email: employee?.email || "",
      role: (employee?.role as Role) || ROLES.EMPLOYEE,
      departmentId: undefined,
      status: EMPLOYEE_STATUS.PENDING satisfies EmployeeStatus,
    },
  })

  const {
    handleSubmit,
    reset,
    control,
    formState: { isSubmitting },
  } = form


  useEffect(() => {
    if (employee) {
      reset({
        name: employee.name ?? "",
        email: employee.email ?? "",
        role: (employee.role as Role) || ROLES.EMPLOYEE,
        departmentId: employee.departmentId ?? undefined,
        status: employee.status satisfies EmployeeStatus,
      })
    }
  }, [employee, reset])

  const onSubmit: SubmitHandler<UpdateEmployeeInput> = async (data) => {
    if (!employee) return

    await updateMutation.mutateAsync(
      { id: employee.id, ...data },
      {
        onSuccess: () => {
          toast.success("Employee updated successfully!")
          onOpenChange(false)
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  }

  const isLoading = updateMutation.isPending || isSubmitting

  return (
    <Dialog open={open} onOpenChange={onOpenChange} size="lg">
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Employee</DialogTitle>
          <DialogDescription>Update employee details and permissions.</DialogDescription>
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
                    <Input {...field} id={field.name} placeholder="John Doe" aria-invalid={fieldState.invalid} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </FieldContent>
                </Field>
              )}
            />
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
                      id={field.name}
                      type="email"
                      placeholder="john@example.com"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </FieldContent>
                </Field>
              )}
            />
          </FieldGroup>

          {canChangeRole && (
            <FieldGroup className="flex flex-row items-start gap-4">
              <Controller
                name="role"
                control={control}
                render={({ field, fieldState }) => (
                  <Field orientation="vertical" data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Role</FieldLabel>
                    <FieldContent className="w-full flex-1">
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {manageableRoles.map((role) => (
                            <SelectItem key={role} value={role} className="capitalize">
                              {role.replace("_", " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </FieldContent>
                  </Field>
                )}
              />
              <div className="flex-1" />
            </FieldGroup>
          )}

          <FieldGroup className="flex flex-row items-start gap-4">
            <Controller
              name="departmentId"
              control={control}
              render={({ field, fieldState }) => (
                <Field orientation="vertical" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Department</FieldLabel>
                  <FieldContent className="w-full flex-1">
                    <DepartmentSelect
                      value={field.value ?? null}
                      onValueChange={field.onChange}
                      placeholder="Select department"
                    />
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
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(EMPLOYEE_STATUS).map(([key, value]) => (
                          <SelectItem key={key} value={value} className="capitalize">
                            {value}
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <IconLoader2 className="mr-2 size-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
