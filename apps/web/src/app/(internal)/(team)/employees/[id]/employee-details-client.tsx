"use client"

import { ContentShell } from "@/components/common/content-shell"
import { BanDialog } from "@/components/common/ban-dialog"
import { ChangePasswordDialog } from "@/features/employees/components/change-password-dialog"
import { EmployeeAccessForm } from "@/features/employees/components/employee-access-form"
import { EmployeeDetailsSkeleton } from "@/features/employees/components/employee-details-skeleton"
import { EmployeeInfoForm } from "@/features/employees/components/employee-info-form"
import { EmployeeProfileHeader } from "@/features/employees/components/employee-profile-header"
import { useQueryClient } from "@tanstack/react-query"
import { ImpersonateDialog } from "@/components/common/impersonate-dialog"
import { UpdateEmployeeDialog } from "@/features/employees/components/update-employee-dialog"
import { useEmployee } from "@/features/employees/queries"
import { employeeKeys } from "@/features/employees/query-options"
import { type DialogState } from "@/features/employees/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@adscrush/ui/components/tabs"
import Link from "next/link"
import { notFound } from "next/navigation"
import * as React from "react"

interface EmployeeDetailsClientProps {
  id: string
}

export function EmployeeDetailsClient({ id }: EmployeeDetailsClientProps) {
  const queryClient = useQueryClient()
  const { data: employee, isLoading, error } = useEmployee(id)

  const [dialogs, setDialogs] = React.useState<DialogState>({
    edit: false,
    changePassword: false,
    ban: false,
    impersonate: false,
  })

  const openDialog = (key: keyof DialogState) => setDialogs(prev => ({ ...prev, [key]: true }))

  if (isLoading) {
    return <EmployeeDetailsSkeleton />
  }

  if (error || !employee) {
    notFound()
  }

  return (
    <ContentShell>
      <EmployeeProfileHeader
        employee={employee}
        onEdit={() => openDialog("edit")}
        onChangePassword={() => openDialog("changePassword")}
        onBan={() => openDialog("ban")}
        onImpersonate={() => openDialog("impersonate")}
      />
      <Tabs defaultValue="info" className="mt-2">
        <TabsList>
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="access">Access</TabsTrigger>
          <TabsTrigger value="permissions" asChild>
            <Link href={`/employees/${id}/permissions`}>Permissions</Link>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="info" className="mt-6">
          <EmployeeInfoForm employee={employee} />
        </TabsContent>
        <TabsContent value="access" className="mt-6">
          <EmployeeAccessForm employee={employee} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <UpdateEmployeeDialog
        open={dialogs.edit}
        onOpenChange={(open) => setDialogs(prev => ({ ...prev, edit: open }))}
        employee={employee}
      />
      <ChangePasswordDialog
        open={dialogs.changePassword}
        onOpenChange={(open) => setDialogs(prev => ({ ...prev, changePassword: open }))}
        employee={employee}
      />
      <BanDialog
        open={dialogs.ban}
        onOpenChange={(open) => setDialogs(prev => ({ ...prev, ban: open }))}
        userId={employee?.userId}
        name={employee?.name}
        variant={employee.banned ? "unban" : "ban"}
        onSuccess={async () => {
          await queryClient.invalidateQueries({ queryKey: employeeKeys.all })
          await queryClient.invalidateQueries({ queryKey: employeeKeys.byId(employee!.id) })
        }}
      />
      <ImpersonateDialog
        open={dialogs.impersonate}
        onOpenChange={(open) => setDialogs(prev => ({ ...prev, impersonate: open }))}
        userId={employee?.userId}
        name={employee?.name}
        label="User"
      />
    </ContentShell>
  )
}
