"use client"

import {
  EMPLOYEE_STATUS_VALUES,
  type EmployeeStatus,
} from "@adscrush/shared/constants/status"
import { Button } from "@adscrush/ui/components/button"
import { Card, CardContent } from "@adscrush/ui/components/card"
import { Field, FieldError, FieldLabel } from "@adscrush/ui/components/field"
import { Input } from "@adscrush/ui/components/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@adscrush/ui/components/select"
import { toast } from "@adscrush/ui/sonner"
import { zodResolver } from "@hookform/resolvers/zod"
import { IconLoader2 } from "@tabler/icons-react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"
import { useUpdateEmployee, type Employee } from "../queries"

const infoFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phoneNumber: z.string().default(""),
  socialContact: z.string().default(""),
  status: z.enum(EMPLOYEE_STATUS_VALUES),
})

type InfoFormValues = z.infer<typeof infoFormSchema>

interface EmployeeInfoFormProps {
  employee: Employee
}

export function EmployeeInfoForm({ employee }: EmployeeInfoFormProps) {
  const updateEmployee = useUpdateEmployee()

  const [firstName, ...lastNameParts] = (employee.name || "").split(" ")
  const lastName = lastNameParts.join(" ")

  const form = useForm({
    resolver: zodResolver(infoFormSchema),
    defaultValues: {
      firstName: firstName || "",
      lastName: lastName || "",
      phoneNumber: employee.phoneNumber || "",
      socialContact: employee.socialContact || "",
      status: (employee.status as EmployeeStatus) || EMPLOYEE_STATUS_VALUES[0],
    },
  })

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = form

  async function onSubmit(values: InfoFormValues) {
    try {
      await updateEmployee.mutateAsync({
        id: employee.id,
        status: values.status,
        name: `${values.firstName} ${values.lastName}`.trim(),
        phoneNumber: values.phoneNumber || undefined,
        socialContact: values.socialContact || undefined,
      })
      toast.success("Employee updated successfully")
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to update employee")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="flex gap-4">
              <Field className="flex-1">
                <FieldLabel>Name</FieldLabel>
                <Controller
                  name="firstName"
                  control={control}
                  render={({ field }) => <Input {...field} placeholder="First Name" />}
                />
                <FieldError errors={[errors.firstName]} />
              </Field>
              <Field className="flex-1">
                <FieldLabel className="invisible">Last Name</FieldLabel>
                <Controller
                  name="lastName"
                  control={control}
                  render={({ field }) => <Input {...field} placeholder="Last Name" />}
                />
                <FieldError errors={[errors.lastName]} />
              </Field>
            </div>

            <Field>
              <FieldLabel>Email</FieldLabel>
              <Input value={employee.email || ""} disabled />
            </Field>

            <Field>
              <FieldLabel>Mobile</FieldLabel>
              <Controller
                name="phoneNumber"
                control={control}
                render={({ field }) => <Input {...field} value={field.value || ""} />}
              />
              <FieldError errors={[errors.phoneNumber]} />
            </Field>

            <Field>
              <FieldLabel>Social Contact</FieldLabel>
              <Controller
                name="socialContact"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="Skype / Telegram" value={field.value || ""} />
                )}
              />
              <FieldError errors={[errors.socialContact]} />
            </Field>

            <Field>
              <FieldLabel>Account Status</FieldLabel>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {EMPLOYEE_STATUS_VALUES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.status]} />
            </Field>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium">Signup Date</span>
              <div className="py-2 text-sm">
                {employee.createdAt
                  ? new Date(employee.createdAt).toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })
                  : "-"}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={updateEmployee.isPending}>
              {updateEmployee.isPending && <IconLoader2 className="mr-2 size-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
