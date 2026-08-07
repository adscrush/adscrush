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
import type { DataTableRowAction } from "@adscrush/shared/types/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import type { Product } from "../queries"
import {
  CalendarIcon,
  CircleDashed,
  Ellipsis,
  Text,
  Globe,
  Lock,
  EyeOff,
} from "lucide-react"
import {
  IconCircleCheckFilled,
  IconCircleXFilled,
  IconClock,
  IconHourglassFilled,
} from "@tabler/icons-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface GetProductsTableColumnsProps {
  setRowAction: React.Dispatch<
    React.SetStateAction<DataTableRowAction<Product> | null>
  >
}

export function getProductsTableColumns({
  setRowAction,
}: GetProductsTableColumnsProps): ColumnDef<Product>[] {
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
        <DataTableColumnHeader column={column} label="Product" />
      ),
      cell: ({ row }) => {
        const image = row.original.image
        return (
          <div className="flex items-center gap-3">
            {image ? (
              <img
                src={image}
                alt=""
                className="size-8 rounded-md object-cover"
              />
            ) : (
              <div className="flex size-8 items-center justify-center rounded-md bg-muted text-xs font-medium text-muted-foreground">
                {row.original.name.charAt(0).toUpperCase()}
              </div>
            )}
            <Link
              href={`/products/${row.original.id}/edit`}
              className="font-medium hover:underline"
            >
              {row.getValue("name")}
            </Link>
          </div>
        )
      },
      meta: {
        label: "Product",
        placeholder: "Search product...",
        variant: "text",
        icon: Text,
      },
      enableColumnFilter: true,
      minSize: 200,
    },
    {
      id: "advertiser",
      accessorKey: "advertiser",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Advertiser" />
      ),
      cell: ({ row }) => {
        const advertiser = row.original.advertiser
        return (
          <span className="text-muted-foreground">
            {advertiser?.name ?? "-"}
          </span>
        )
      },
      enableSorting: false,
      minSize: 160,
      meta: { label: "Advertiser" },
    },
    {
      id: "category",
      accessorKey: "category",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Category" />
      ),
      cell: ({ row }) => {
        const category = row.original.category
        return (
          <span className="text-muted-foreground">
            {category?.name ?? "-"}
          </span>
        )
      },
      enableSorting: false,
      minSize: 120,
      meta: { label: "Category" },
    },
    {
      id: "visibility",
      accessorKey: "visibility",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Visibility" />
      ),
      cell: ({ cell }) => {
        const value = cell.getValue<string>()
        const Icon = value === "public" ? Globe : value === "private" ? Lock : EyeOff
        return (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Icon className="size-3.5" />
            <span className="text-sm capitalize">{value}</span>
          </div>
        )
      },
      minSize: 110,
      meta: { label: "Visibility", variant: "text", icon: Globe },
    },
    {
      id: "status",
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Status" />
      ),
      cell: ({ row }) => <ProductStatusBadge status={row.original.status} />,
      enableSorting: true,
      meta: {
        label: "Status",
        variant: "multiSelect",
        options: [
          { label: "Active", value: "active", icon: IconCircleCheckFilled },
          { label: "Inactive", value: "inactive", icon: IconCircleXFilled },
          { label: "Paused", value: "paused", icon: IconClock },
          { label: "Expired", value: "expired", icon: IconHourglassFilled },
        ],
        icon: CircleDashed,
      },
      enableColumnFilter: true,
      minSize: 110,
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
      minSize: 110,
    },
    {
      id: "actions",
      cell: function Cell({ row }) {
        const router = useRouter()
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
                onSelect={() => router.push(`/products/${row.original.id}/edit`)}
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

function ProductStatusBadge({ status }: { status: Product["status"] }) {
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
      ) : status === "paused" ? (
        <>
          <IconClock className="size-3.5 text-yellow-500 dark:text-yellow-400" />
          <span>Paused</span>
        </>
      ) : (
        <>
          <IconHourglassFilled className="size-3.5 text-orange-500 dark:text-orange-400" />
          <span>Expired</span>
        </>
      )}
    </Badge>
  )
}
