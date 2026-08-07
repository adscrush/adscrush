"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@adscrush/ui/components/avatar"
import { Badge } from "@adscrush/ui/components/badge"
import { Button } from "@adscrush/ui/components/button"
import {
  IconBan,
  IconChevronLeft,
  IconEdit,
  IconKey,
  IconUserSearch,
} from "@tabler/icons-react"
import Link from "next/link"
import type { Employee } from "../queries"
import { getInitials, getStatusVariant } from "../utils"

interface EmployeeProfileHeaderProps {
  employee: Employee
  onEdit: () => void
  onChangePassword: () => void
  onBan: () => void
  onImpersonate: () => void
}

/**
 * Returns className overrides for badge variants not supported by the Badge component.
 * "success" and "warning" are not available as Badge variants, so we use className overrides.
 */
function getStatusBadgeProps(variant: string): {
  variant?: "default" | "secondary" | "destructive" | "outline" | "ghost" | "link"
  className?: string
} {
  if (variant === "success") {
    return {
      variant: "secondary",
      className:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    }
  }
  if (variant === "warning") {
    return {
      variant: "secondary",
      className:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    }
  }
  if (variant === "destructive") {
    return { variant: "destructive" }
  }
  return { variant: "secondary" }
}

export function EmployeeProfileHeader({
  employee,
  onEdit,
  onChangePassword,
  onBan,
  onImpersonate,
}: EmployeeProfileHeaderProps) {
  const isBanned = Boolean(employee.banned)
  const isUserLinked = Boolean(employee.userId)
  const statusVariant = getStatusVariant(employee.status ?? "")
  const badgeProps = getStatusBadgeProps(statusVariant)

  return (
    <div className="space-y-5">
      {/* Breadcrumb row */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/employees"
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <IconChevronLeft className="size-4" />
          Employees
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{employee.name}</span>
      </div>

      {/* Profile card row */}
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <Avatar className="size-16">
          <AvatarImage src={undefined} alt={employee.name ?? ""} />
          <AvatarFallback className="text-lg font-semibold">
            {getInitials(employee.name ?? "")}
          </AvatarFallback>
        </Avatar>

        {/* Employee info */}
        <div className="flex flex-1 flex-col gap-1">
          <h1 className="text-xl font-semibold leading-tight">{employee.name}</h1>
          <p className="text-sm text-muted-foreground">{employee.email}</p>
          <p className="text-sm text-muted-foreground capitalize">{employee.role}</p>
          <Badge {...badgeProps}>
            <span className="capitalize">{employee.status}</span>
          </Badge>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <IconEdit className="size-4 mr-1.5" />
            Edit
          </Button>

          <Button variant="outline" size="sm" onClick={onChangePassword}>
            <IconKey className="size-4 mr-1.5" />
            Change Password
          </Button>

          <Button
            variant={isBanned ? "outline" : "destructive"}
            size="sm"
            onClick={onBan}
            disabled={!isUserLinked}
          >
            <IconBan className="size-4 mr-1.5" />
            {isBanned ? "Unban" : "Ban"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onImpersonate}
            disabled={!isUserLinked}
          >
            <IconUserSearch className="size-4 mr-1.5" />
            Impersonate
          </Button>
        </div>
      </div>
    </div>
  )
}
