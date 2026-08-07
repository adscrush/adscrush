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
import { Badge } from "@adscrush/ui/components/badge"
import { CalendarIcon, CircleDashed, Text } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"
import type { Department } from "../queries"
import { Ellipsis } from "lucide-react"
import { IconCircleCheckFilled, IconCircleXFilled } from "@tabler/icons-react"

interface GetDepartmentsTableColumnsProps {
  setRowAction: React.Dispatch<
    React.SetStateAction<{
      row: { original: Department }
      variant: "update" | "delete"
    } | null>
  >
}

export function getDepartmentsTableColumns({
  setRowAction,
}: GetDepartmentsTableColumnsProps): ColumnDef<Department>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          aria-label="Select all"
          className="translate-y-0.5"
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
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
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Name" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("name")}</span>
      ),
      meta: {
        label: "Name",
        placeholder: "Search department...",
        variant: "text",
        icon: Text,
      },
      enableColumnFilter: true,
      minSize: 180,
    },
    {
      id: "description",
      accessorKey: "description",
      header: "Description",
      cell: ({ cell }) => (
        <span className="text-muted-foreground">
          {cell.getValue<string>() || "-"}
        </span>
      ),
      minSize: 200,
    },
    {
      id: "status",
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Status" />
      ),
      cell: ({ row }) => <DepartmentStatusBadge status={row.original.status} />,
      enableSorting: true,
      meta: {
        label: "Status",
        variant: "multiSelect",
        options: [
          { label: "Active", value: "active", icon: IconCircleCheckFilled },
          { label: "Inactive", value: "inactive", icon: IconCircleXFilled },
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
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Created" />
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
              <DropdownMenuItem
                onSelect={() => setRowAction({ row, variant: "update" })}
              >
                Edit
                <DropdownMenuShortcut>E</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => setRowAction({ row, variant: "delete" })}
              >
                Delete
              </DropdownMenuItem>
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

function DepartmentStatusBadge({ status }: { status: Department["status"] }) {
  return (
    <Badge variant="outline" className="gap-1.5 px-2">
      {status === "active" ? (
        <>
          <IconCircleCheckFilled className="size-3.5 text-green-600 dark:text-green-400" />
          <span>Active</span>
        </>
      ) : (
        <>
          <IconCircleXFilled className="size-3.5 text-gray-500 dark:text-gray-400" />
          <span>Inactive</span>
        </>
      )}
    </Badge>
  )
}
