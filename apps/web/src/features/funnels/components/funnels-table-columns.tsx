import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { useHasPermission } from "@/hooks/use-permission"
import { Button } from "@adscrush/ui/components/button"
import { Checkbox } from "@adscrush/ui/components/checkbox"
import { Badge } from "@adscrush/ui/components/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@adscrush/ui/components/dropdown-menu"
import type { DataTableRowAction } from "@adscrush/shared/types/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import { LanguageCell } from "./language-cell"
import type { Funnel } from "../queries"
import {
  CalendarIcon,
  CircleDashed,
  Ellipsis,
  Eye,
  Languages as LanguagesIcon,
  Text,
} from "lucide-react"
import {
  IconCircleCheckFilled,
  IconCircleXFilled,
  IconHierarchy2,
} from "@tabler/icons-react"
import Link from "next/link"

interface FunnelCounts {
  statuses: { value: string; count: number }[]
  products: { value: string; label: string; count: number }[]
  languages: { value: string; count: number }[]
}

interface GetFunnelsTableColumnsProps {
  setRowAction: React.Dispatch<
    React.SetStateAction<DataTableRowAction<Funnel> | null>
  >
  counts?: FunnelCounts
}

export function getFunnelsTableColumns({
  setRowAction,
  counts,
}: GetFunnelsTableColumnsProps): ColumnDef<Funnel>[] {
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
        <DataTableColumnHeader column={column} label="Funnel" />
      ),
      cell: ({ row }) => {
        const name = row.original.name
        return (
          <Link
            href={`/funnels/${row.original.id}`}
            className="flex min-w-0 items-center gap-3"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <IconHierarchy2 className="size-4" />
            </span>
            <span className="truncate font-medium">{name}</span>
          </Link>
        )
      },
      meta: {
        label: "Funnel",
        placeholder: "Search funnels...",
        variant: "text",
        icon: Text,
      },
      enableColumnFilter: true,
      minSize: 200,
    },
    {
      id: "product",
      accessorKey: "product.name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Product" />
      ),
      cell: ({ row }) => {
        const product = row.original.product
        const productName = product?.name
        const productImage = product?.image
        return (
          <div className="flex items-center gap-2.5">
            {productImage ? (
              <img
                src={productImage}
                alt={productName || "Product"}
                className="size-8 shrink-0 rounded-md object-cover"
              />
            ) : (
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-medium text-muted-foreground">
                {productName ? productName.charAt(0).toUpperCase() : "—"}
              </span>
            )}
            <span className="truncate text-muted-foreground">
              {productName || "—"}
            </span>
            {product?.id && (
              <Link
                href={`/products/${product.id}/edit`}
                className="ml-auto shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Eye className="size-4" />
                <span className="sr-only">View product</span>
              </Link>
            )}
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
      minSize: 160,
    },
    {
      id: "language",
      accessorKey: "language",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Language" />
      ),
      cell: ({ row }) => (
        <LanguageCell id={row.original.language} />
      ),
      enableSorting: true,
      meta: {
        label: "Language",
        placeholder: "Search language...",
        variant: "text",
        icon: LanguagesIcon,
      },
      enableColumnFilter: true,
      minSize: 110,
    },
    {
      id: "landingPagesCount",
      accessorKey: "landingPagesCount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Landing Pages" />
      ),
      cell: ({ row }) => (
        <span className="tabular-nums text-muted-foreground">
          {row.original.landingPagesCount ?? 0}
        </span>
      ),
      minSize: 140,
    },
    {
      id: "status",
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Status" />
      ),
      cell: ({ row }) => <FunnelStatusBadge status={row.original.status} />,
      enableSorting: true,
      meta: {
        label: "Status",
        variant: "multiSelect",
        options: [
          {
            label: "Active",
            value: "active",
            icon: IconCircleCheckFilled,
            count: counts?.statuses.find((s) => s.value === "active")?.count ?? 0,
          },
          {
            label: "Inactive",
            value: "inactive",
            icon: IconCircleXFilled,
            count: counts?.statuses.find((s) => s.value === "inactive")?.count ?? 0,
          },
        ],
        icon: CircleDashed,
      },
      enableColumnFilter: true,
      minSize: 130,
    },
    {
      id: "createdAt",
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Created" />
      ),
      cell: ({ cell }) => (
        <span className="text-muted-foreground">
          {new Date(cell.getValue<string>()).toLocaleDateString("en-US", {
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
      minSize: 130,
    },
    {
      id: "actions",
      cell: function Cell({ row }) {
        const canEdit = useHasPermission("funnels.edit")

        if (!canEdit) return null

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
              <DropdownMenuItem asChild>
                <Link href={`/funnels/${row.original.id}/edit`}>
                  Edit
                  <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => setRowAction({ row, variant: "delete" })}
              >
                Delete
                <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
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

function FunnelStatusBadge({
  status,
}: {
  status: "active" | "inactive"
}) {
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
