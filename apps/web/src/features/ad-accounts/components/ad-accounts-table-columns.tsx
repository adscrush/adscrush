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
import { Avatar, AvatarFallback, AvatarImage } from "@adscrush/ui/components/avatar"
import { Badge } from "@adscrush/ui/components/badge"
import { getInitials } from "@adscrush/shared/lib/initials"
import type { DataTableRowAction } from "@adscrush/shared/types/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import type { AdAccount } from "../queries"
import { CalendarIcon, CircleDashed, Ellipsis, Text } from "lucide-react"
import {
  IconBan,
  IconCircleCheckFilled,
  IconClock,
  IconEyeOff,
  IconForbid,
  IconShieldExclamation,
} from "@tabler/icons-react"

interface GetAdAccountsTableColumnsProps {
  setRowAction: React.Dispatch<
    React.SetStateAction<DataTableRowAction<AdAccount> | null>
  >
}

export function getAdAccountsTableColumns({
  setRowAction,
}: GetAdAccountsTableColumnsProps): ColumnDef<AdAccount>[] {
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
        placeholder: "Search name...",
        variant: "text",
        icon: Text,
      },
      enableColumnFilter: true,
      minSize: 180,
    },
    {
      id: "sourcePlatform",
      accessorKey: "sourcePlatform",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Source Platform" />
      ),
      cell: ({ cell }) => (
        <span className="text-muted-foreground">
          {cell.getValue<string>()}
        </span>
      ),
      meta: {
        label: "Source Platform",
        placeholder: "Search platform...",
        variant: "text",
        icon: Text,
      },
      enableColumnFilter: true,
      minSize: 150,
    },
    {
      id: "accountId",
      accessorKey: "accountId",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Account ID" />
      ),
      cell: ({ cell }) => (
        <span className="text-muted-foreground font-mono text-xs">
          {cell.getValue<string>()}
        </span>
      ),
      meta: {
        label: "Account ID",
        placeholder: "Search account ID...",
        variant: "text",
        icon: Text,
      },
      enableColumnFilter: true,
      minSize: 180,
    },
    {
      id: "status",
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Status" />
      ),
      cell: ({ row }) => <AdAccountStatusBadge status={row.original.status} />,
      enableSorting: true,
      meta: {
        label: "Status",
        variant: "multiSelect",
        options: [
          { label: "Active", value: "active", icon: IconCircleCheckFilled },
          { label: "Paused", value: "paused", icon: IconClock },
          { label: "Risk Control", value: "risk_control", icon: IconShieldExclamation },
          { label: "Disconnected", value: "disconnected", icon: IconBan },
          { label: "Disabled", value: "disabled", icon: IconForbid },
          { label: "Not In Use", value: "not_in_use", icon: IconEyeOff },
        ],
        icon: CircleDashed,
      },
      enableColumnFilter: true,
      minSize: 120,
    },
    {
      id: "mediaBuyer",
      accessorKey: "mediaBuyer",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Media Buyer" />
      ),
      cell: ({ row }) => {
        const mediaBuyer = row.original.mediaBuyer
        if (!mediaBuyer) return <span className="text-muted-foreground">-</span>

        return (
          <div className="flex min-w-0 items-center gap-2">
            <Avatar className="size-5 shrink-0">
              {mediaBuyer.image ? (
                <AvatarImage src={mediaBuyer.image} alt={mediaBuyer.name ?? ""} />
              ) : null}
              <AvatarFallback className="text-[0.5rem]">
                {getInitials(mediaBuyer.name)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate">{mediaBuyer.name}</span>
          </div>
        )
      },
      enableSorting: false,
      minSize: 180,
      meta: {
        label: "Media Buyer",
      },
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

function AdAccountStatusBadge({ status }: { status: AdAccount["status"] }) {
  return (
    <Badge variant="outline" className="gap-1.5 px-2">
      {status === "active" ? (
        <>
          <IconCircleCheckFilled className="size-3.5 text-green-600 dark:text-green-400" />
          <span>Active</span>
        </>
      ) : status === "paused" ? (
        <>
          <IconClock className="size-3.5 text-yellow-500 dark:text-yellow-400" />
          <span>Paused</span>
        </>
      ) : status === "risk_control" ? (
        <>
          <IconShieldExclamation className="size-3.5 text-orange-500 dark:text-orange-400" />
          <span>Risk Control</span>
        </>
      ) : status === "disabled" ? (
        <>
          <IconForbid className="size-3.5 text-red-600 dark:text-red-400" />
          <span>Disabled</span>
        </>
      ) : status === "not_in_use" ? (
        <>
          <IconEyeOff className="size-3.5 text-gray-500 dark:text-gray-400" />
          <span>Not In Use</span>
        </>
      ) : (
        <>
          <IconBan className="size-3.5 text-muted-foreground" />
          <span>Disconnected</span>
        </>
      )}
    </Badge>
  )
}
