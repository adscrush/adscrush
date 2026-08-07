"use client"

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { getInitials } from "@adscrush/shared/lib/initials"
import { Badge } from "@adscrush/ui/components/badge"
import type { ColumnDef } from "@tanstack/react-table"
import type { User } from "../queries"
import { Button } from "@adscrush/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@adscrush/ui/components/dropdown-menu"
import { CalendarIcon, Ellipsis, Text } from "lucide-react"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@adscrush/ui/components/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@adscrush/ui/components/tooltip"
import { IconCircleCheckFilled, IconCircleXFilled } from "@tabler/icons-react"
import { ROLES } from "@adscrush/shared/constants/roles"
import Link from "next/link"

type RowAction = {
  row: { original: User }
  variant: "ban" | "unban" | "impersonate" | "change-role"
}

interface GetUsersTableColumnsProps {
  setRowAction: React.Dispatch<React.SetStateAction<RowAction | null>>
}

const ROLE_BADGE_VARIANTS: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  [ROLES.SUPER_ADMIN]: "destructive",
  [ROLES.ADMIN]: "destructive",
  [ROLES.EMPLOYEE]: "secondary",
  [ROLES.ADVERTISER]: "default",
  [ROLES.MEDIA_BUYER]: "secondary",
  [ROLES.USER]: "outline",
}

export function getUsersTableColumns({
  setRowAction,
}: GetUsersTableColumnsProps): ColumnDef<User>[] {
  return [
    {
      id: "name",
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Name" />
      ),
      cell: ({ row }) => {
        const name = (row.getValue("name") as string) || "Unknown"
        const image = row.original.image as string | null
        const initials = getInitials(name)

        return (
          <Link href={`/users/${row.original.id}`} className="flex items-center gap-2">
            <Avatar className="size-7">
              {image && <AvatarImage src={image} alt={name} />}
              <AvatarFallback className="text-[0.6rem]">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-2">
              <span className="font-medium hover:underline">{name}</span>
              {row.original.banned && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="destructive"
                      className="h-4 px-1 text-[10px] uppercase leading-none"
                    >
                      Banned
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{row.original.banReason || "No reason provided"}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </Link>
        )
      },
      meta: {
        label: "Name",
        placeholder: "Search name...",
        variant: "text",
        icon: Text,
      },
      enableColumnFilter: true,
      minSize: 200,
    },
    {
      id: "email",
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Email" />
      ),
      cell: ({ cell }) => (
        <span className="text-muted-foreground">
          {cell.getValue<string>()}
        </span>
      ),
      meta: {
        label: "Email",
        variant: "text",
        icon: Text,
      },
      enableColumnFilter: true,
      minSize: 220,
    },
    {
      id: "emailVerified",
      accessorKey: "emailVerified",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Verified" />
      ),
      cell: ({ cell }) => {
        const verified = cell.getValue<boolean>()
        return verified ? (
          <IconCircleCheckFilled className="size-4 text-green-600 dark:text-green-400" />
        ) : (
          <IconCircleXFilled className="size-4 text-muted-foreground" />
        )
      },
      minSize: 80,
    },
    {
      id: "role",
      accessorKey: "role",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Role" />
      ),
      cell: ({ cell }) => {
        const role = cell.getValue<string>()
        return (
          <Badge
            variant={ROLE_BADGE_VARIANTS[role] ?? "outline"}
            className="capitalize"
          >
            {role.replace(/_/g, " ")}
          </Badge>
        )
      },
      meta: {
        label: "Role",
        variant: "text",
        icon: Text,
      },
      enableColumnFilter: true,
      minSize: 120,
    },
    {
      id: "createdAt",
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Joined" />
      ),
      cell: ({ cell }) => (
        <span className="text-muted-foreground">
          {new Date(cell.getValue<Date>()).toLocaleDateString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          })}
        </span>
      ),
      meta: {
        label: "Joined",
        variant: "dateRange",
        icon: CalendarIcon,
      },
      enableColumnFilter: true,
      minSize: 120,
    },
    {
      id: "actions",
      cell: function Cell({ row }) {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label="Open action menu"
                variant="ghost"
                className="flex size-8 p-0 data-[state=open]:bg-muted"
              >
                <Ellipsis className="size-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onSelect={() => setRowAction({ row, variant: "impersonate" })}>
                Impersonate
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setRowAction({ row, variant: "change-role" })}>
                Change Role
              </DropdownMenuItem>
              {row.original.banned ? (
                <DropdownMenuItem onSelect={() => setRowAction({ row, variant: "unban" })}>
                  Unban
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onSelect={() => setRowAction({ row, variant: "ban" })}
                  className="text-destructive focus:text-destructive"
                >
                  Ban User
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
      size: 50,
      maxSize: 50,
      minSize: 50,
      enableResizing: false,
    },
  ]
}
