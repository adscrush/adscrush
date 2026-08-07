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
import type { MediaBuyer } from "../queries"
import { CalendarIcon, CircleDashed, Ellipsis, Text } from "lucide-react"
import {
  IconBan,
  IconCircleCheckFilled,
  IconClock,
} from "@tabler/icons-react"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@adscrush/ui/components/avatar"
import Link from "next/link"

interface GetMediaBuyersTableColumnsProps {
  setRowAction: React.Dispatch<
    React.SetStateAction<{
      row: { original: MediaBuyer }
      variant: "update" | "delete" | "changePassword" | "impersonate"
    } | null>
  >
}

export function getMediaBuyersTableColumns({
  setRowAction,
}: GetMediaBuyersTableColumnsProps): ColumnDef<MediaBuyer>[] {
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
        <DataTableColumnHeader column={column} label="Media Buyer" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("name")}</span>
      ),
      meta: {
        label: "Media Buyer",
        placeholder: "Search media buyer...",
        variant: "text",
        icon: Text,
      },
      enableColumnFilter: true,
      minSize: 180,
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
        const acctManager = row.original.accountManager
        if (!acctManager) return <span className="text-muted-foreground">-</span>

        return (
          <div className="flex min-w-0 items-center gap-2">
            <Avatar className="size-5 shrink-0">
              {acctManager.image ? (
                <AvatarImage
                  src={acctManager.image}
                  alt={acctManager.name ?? ""}
                />
              ) : null}
              <AvatarFallback className="text-[0.5rem]">
                {getInitials(acctManager.name)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate">{acctManager.name}</span>
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
      cell: ({ row }) => <MediaBuyerStatusBadge status={row.original.status} />,
      enableSorting: true,
      meta: {
        label: "Status",
        variant: "multiSelect",
        options: [
          { label: "Active", value: "active", icon: IconCircleCheckFilled },
          { label: "Pending", value: "pending", icon: IconClock },
          { label: "Suspended", value: "suspended", icon: IconBan },
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
              </DropdownMenuItem>              <DropdownMenuItem onSelect={() => setRowAction({ row, variant: "changePassword" })}>
                Change Password
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setRowAction({ row, variant: "impersonate" })}>
                Impersonate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/media-buyers/${row.original.id}`}>
                  Permissions
                </Link>
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

function MediaBuyerStatusBadge({ status }: { status: MediaBuyer["status"] }) {
  return (
    <Badge variant="outline" className="gap-1.5 px-2">
      {status === "active" ? (
        <>
          <IconCircleCheckFilled className="size-3.5 text-green-600 dark:text-green-400" />
          <span>Active</span>
        </>
      ) : status === "pending" ? (
        <>
          <IconClock className="size-3.5 text-yellow-500 dark:text-yellow-400" />
          <span>Pending</span>
        </>
      ) : (
        <>
          <IconBan className="size-3.5 text-gray-500 dark:text-gray-400" />
          <span>Suspended</span>
        </>
      )}
    </Badge>
  )
}
