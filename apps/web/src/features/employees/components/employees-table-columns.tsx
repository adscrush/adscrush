"use client"

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { Button } from "@adscrush/ui/components/button"
import { Checkbox } from "@adscrush/ui/components/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@adscrush/ui/components/dropdown-menu"
import { CalendarIcon, CircleDashed, Text } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"
import type { Employee } from "../queries"
import { Ellipsis } from "lucide-react"
import { IconCircleCheckFilled, IconCircleXFilled } from "@tabler/icons-react"
import { Avatar, AvatarFallback, AvatarImage } from "@adscrush/ui/components/avatar"
import { Badge } from "@adscrush/ui/components/badge"
import { getInitials } from "@adscrush/shared/lib/initials"
import { Tooltip, TooltipContent, TooltipTrigger } from "@adscrush/ui/components/tooltip"
import Link from "next/link"

interface GetEmployeesTableColumnsProps {
  setRowAction: React.Dispatch<
    React.SetStateAction<{
      row: { original: Employee }
      variant: "update" | "delete" | "change-password" | "ban" | "unban" | "impersonate"
    } | null>
  >
}

export function getEmployeesTableColumns({ setRowAction }: GetEmployeesTableColumnsProps): ColumnDef<Employee>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          aria-label="Select all"
          className="translate-y-0.5"
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label="Select row"
          className="translate-y-0.5"
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
      minSize: 40,
      maxSize: 40,
      enableResizing: false,
    },
    {
      id: "name",
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} label="Name" />,
      cell: ({ row }) => {
        const name = (row.getValue("name") as string) || ""
        const image = row.original.image as string | null
        const initials = getInitials(name)
        return (
          <Link href={`/employees/${row.original.id}`} className="flex items-center gap-2">
            <Avatar>
              {image && <AvatarImage src={image} alt={name} />}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-2">
              <span className="font-medium hover:underline">{name}</span>
              {row.original.banned && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="destructive" className="h-4 px-1 text-[10px] uppercase leading-none">
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
      header: "Email",
      cell: ({ cell }) => <span className="text-muted-foreground">{cell.getValue<string>()}</span>,
      minSize: 200,
    },
    {
      id: "role",
      accessorKey: "role",
      header: "Role",
      cell: ({ cell }) => {
        const role = cell.getValue<string>()
        return (
          <Badge variant="secondary" className="capitalize">
            {role}
          </Badge>
        )
      },
      minSize: 100,
    },
    {
      id: "departmentName",
      accessorKey: "departmentName",
      header: "Department",
      cell: ({ cell }) => <span className="text-muted-foreground">{cell.getValue<string>() || "-"}</span>,
      minSize: 140,
    },
    {
      id: "status",
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} label="Status" />,
      cell: ({ row }) => <EmployeeStatusBadge status={row.original.status} />,
      enableSorting: true,
      meta: {
        label: "Status",
        variant: "multiSelect",
        options: [
          { label: "Approved", value: "approved", icon: IconCircleCheckFilled },
          { label: "Pending", value: "pending", icon: CircleDashed },
          { label: "Rejected", value: "rejected", icon: IconCircleXFilled },
        ],
        placeholder: "Search status...",
        icon: CircleDashed,
      },
      enableColumnFilter: true,
      minSize: 120,
    },
    {
      id: "createdAt",
      accessorKey: "createdAt",
      header: ({ column }) => <DataTableColumnHeader column={column} label="Created" />,
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
        label: "Created",
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
              <DropdownMenuItem onSelect={() => setRowAction({ row, variant: "update" })}>
                Edit
                <DropdownMenuShortcut>E</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setRowAction({ row, variant: "change-password" })}>
                Change Password
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setRowAction({ row, variant: "impersonate" })}>
                Impersonate
              </DropdownMenuItem>
              {row.original.banned ? (
                <DropdownMenuItem onSelect={() => setRowAction({ row, variant: "unban" })}>Unban</DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onSelect={() => setRowAction({ row, variant: "ban" })}
                  className="text-destructive focus:text-destructive"
                >
                  Ban User
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setRowAction({ row, variant: "delete" })}>Delete</DropdownMenuItem>
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

function EmployeeStatusBadge({ status }: { status: Employee["status"] }) {
  return (
    <Badge variant="outline" className="gap-1.5 px-2">
      {status === "approved" ? (
        <>
          <IconCircleCheckFilled className="size-3.5 text-green-600 dark:text-green-400" />
          <span>Approved</span>
        </>
      ) : status === "pending" ? (
        <>
          <CircleDashed className="size-3.5 text-gray-500 dark:text-gray-400" />
          <span>Pending</span>
        </>
      ) : (
        <>
          <IconCircleXFilled className="size-3.5 text-red-500 dark:text-red-400" />
          <span>Rejected</span>
        </>
      )}
    </Badge>
  )
}
