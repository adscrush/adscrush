import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { getInitials } from "@adscrush/shared/lib/initials"
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
import type { ColumnDef } from "@tanstack/react-table"
import type { Advertiser } from "../queries"
import { CalendarIcon, CircleDashed, Ellipsis, Text } from "lucide-react"
import {
  IconCircleCheckFilled,
  IconCircleXFilled,
  IconClock,
} from "@tabler/icons-react"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@adscrush/ui/components/avatar"

interface GetAdvertisersTableColumnsProps {
  setRowAction: React.Dispatch<
    React.SetStateAction<{
      row: { original: Advertiser }
      variant: "update" | "delete" | "impersonate"
    } | null>
  >
}

export function getAdvertisersTableColumns({
  setRowAction,
}: GetAdvertisersTableColumnsProps): ColumnDef<Advertiser>[] {
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
        <DataTableColumnHeader column={column} label="Advertiser" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("name")}</span>
      ),
      meta: {
        label: "Advertiser",
        placeholder: "Search advertiser...",
        variant: "text",
        icon: Text,
      },
      enableColumnFilter: true,
      minSize: 180,
    },
    {
      id: "companyName",
      accessorKey: "companyName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Company" />
      ),
      cell: ({ cell }) => (
        <span className="text-muted-foreground">
          {cell.getValue<string>() || "-"}
        </span>
      ),
      meta: {
        label: "Company",
        placeholder: "Search company...",
        variant: "text",
        icon: Text,
      },
      enableColumnFilter: true,
      minSize: 150,
    },
    {
      id: "email",
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Email" />
      ),
      cell: ({ cell }) => (
        <span className="text-muted-foreground">{cell.getValue<string>()}</span>
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
      id: "accountManager",
      accessorKey: "accountManager",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Account Manager" />
      ),
      cell: ({ row }) => {
        const advManager = row.original.accountManager
        if (!advManager) return <span className="text-muted-foreground">-</span>

        return (
          <div className="flex min-w-0 items-center gap-2">
            <Avatar className="size-5 shrink-0">
              {advManager.image ? (
                <AvatarImage
                  src={advManager.image}
                  alt={advManager.name ?? ""}
                />
              ) : null}
              <AvatarFallback className="text-[0.5rem]">
                {getInitials(advManager.name)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate">{advManager.name}</span>
          </div>
        )
      },
      enableSorting: false,
      minSize: 180,
      meta: {
        label: "Account Manager",
      },
    },
    {
      id: "status",
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Status" />
      ),
      cell: ({ row }) => <AdvertiserStatusBadge status={row.original.status} />,
      enableSorting: true,
      meta: {
        label: "Status",
        variant: "multiSelect",
        options: [
          { label: "Active", value: "active", icon: IconCircleCheckFilled },
          { label: "Inactive", value: "inactive", icon: IconCircleXFilled },
          { label: "Pending", value: "pending", icon: IconClock },
        ],
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
              <DropdownMenuItem onSelect={() => setRowAction({ row, variant: "impersonate" })}>
                Impersonate
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

function AdvertiserStatusBadge({ status }: { status: Advertiser["status"] }) {
  return (
    <Badge variant="outline" className="gap-1.5 px-2">
      {status === "active" ? (
        <>
          <IconCircleCheckFilled className="size-3.5 text-green-600 dark:text-green-400" />
          <span>Active</span>
        </>
      ) : status === "inactive" ? (
        <>
          <IconCircleXFilled className="size-3.5 text-gray-500 dark:text-gray-400" />
          <span>Inactive</span>
        </>
      ) : (
        <>
          <IconClock className="size-3.5 text-yellow-500 dark:text-yellow-400" />
          <span>Pending</span>
        </>
      )}
    </Badge>
  )
}
