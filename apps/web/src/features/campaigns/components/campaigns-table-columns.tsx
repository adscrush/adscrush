"use client"

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { useHasPermission } from "@/hooks/use-permission"
import { Button } from "@adscrush/ui/components/button"
import { Badge } from "@adscrush/ui/components/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@adscrush/ui/components/dropdown-menu"
import type { DataTableRowAction } from "@adscrush/shared/types/data-table"
import type { ColumnDef, Row } from "@tanstack/react-table"
import type { Campaign } from "../queries"
import { CalendarIcon, CircleDashed, Ellipsis, Text, Package, GitBranch } from "lucide-react"
import { IconCircleCheckFilled, IconCircleXFilled, IconPlayerPauseFilled, IconCircleFilled } from "@tabler/icons-react"
import { Avatar, AvatarImage, AvatarFallback, AvatarGroup, AvatarGroupCount } from "@adscrush/ui/components/avatar"
import { getInitials } from "@adscrush/shared/lib/initials"
import Link from "next/link"

interface GetCampaignsTableColumnsProps {
  setRowAction: React.Dispatch<React.SetStateAction<DataTableRowAction<Campaign> | null>>
  onStatusChange?: (campaignId: string, status: "active" | "inactive") => void
  productOptions: Array<{ label: string; value: string }>
  funnelOptions: Array<{ label: string; value: string }>
  /**
   * Link prefix for the campaign detail page — `/campaigns` for the internal
   * app, `/p/campaigns` for the media buyer portal.
   */
  campaignDetailPrefix?: string
}

export function getCampaignsTableColumns({
  setRowAction,
  onStatusChange,
  productOptions,
  funnelOptions,
  campaignDetailPrefix = "/campaigns",
}: GetCampaignsTableColumnsProps): ColumnDef<Campaign>[] {
  return [
    {
      id: "name",
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} label="Name" />,
      cell: ({ row }) => (
        <Link
          href={`${campaignDetailPrefix}/${row.original.id}`}
          className="font-medium underline-offset-2 hover:text-primary hover:underline"
        >
          {row.original.name}
        </Link>
      ),
      meta: {
        label: "Name",
        placeholder: "Search campaigns...",
        variant: "text",
        icon: Text,
      },
      enableColumnFilter: true,
      enableSorting: true,
      minSize: 180,
    },
    {
      id: "product",
      accessorFn: (row) => row.product?.id,
      meta: {
        label: "Product",
        variant: "multiSelect",
        options: productOptions,
        icon: Package,
        dynamicOptions: {
          resourceType: "products" as const,
        },
      },
      header: ({ column }) => <DataTableColumnHeader column={column} label="Product" />,
      cell: ({ row }) => {
        const product = row.original.product
        if (!product) return <span className="text-muted-foreground">-</span>
        return (
          <Link
            href={`/products/${product.id}`}
            className="flex items-center gap-2 font-medium underline-offset-2 hover:text-primary hover:underline"
          >
            {product.image ? (
              <img src={product.image} alt="" className="size-8 rounded-md object-cover" />
            ) : (
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-medium text-muted-foreground">
                {product.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="truncate">{product.name}</span>
          </Link>
        )
      },
      enableColumnFilter: true,
      enableSorting: false,
      minSize: 180,
    },
    {
      id: "funnelName",
      accessorKey: "funnel.name",
      meta: {
        label: "Funnel",
        variant: "select",
        options: funnelOptions,
        icon: GitBranch,
        dynamicOptions: {
          resourceType: "funnels" as const,
        },
      },
      header: ({ column }) => <DataTableColumnHeader column={column} label="Funnel" />,
      cell: ({ row }) => {
        const funnel = row.original.funnel
        if (!funnel) return <span className="text-muted-foreground">-</span>
        return (
          <Link
            href={`/funnels/${funnel.id}`}
            className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            {funnel.name}
          </Link>
        )
      },
      enableColumnFilter: true,
      enableSorting: false,
      minSize: 180,
    },
    {
      id: "creatives",
      accessorFn: (row) => row.creatives ?? [],
      meta: {
        label: "Creatives",
      },
      header: ({ column }) => <DataTableColumnHeader column={column} label="Creatives" />,
      cell: ({ row }) => {
        const creatives = row.original.creatives
        const count = row.original.creativeCount ?? 0
        if (!creatives || creatives.length === 0) {
          return <span className="text-muted-foreground">-</span>
        }
        return (
          <div className="flex items-center gap-2">
            <AvatarGroup className="size-6">
              {creatives.map((creative) => (
                <Avatar key={creative.id} size="sm">
                  {creative.thumbnailUrl ? <AvatarImage src={creative.thumbnailUrl} alt={creative.name} /> : null}
                  <AvatarFallback>{getInitials(creative.name)}</AvatarFallback>
                </Avatar>
              ))}
              {count > 2 && <AvatarGroupCount>+{count - 2}</AvatarGroupCount>}
            </AvatarGroup>
            <span className="text-sm text-muted-foreground">{count}</span>
          </div>
        )
      },
      enableSorting: false,
      minSize: 140,
    },
    {
      id: "landingPageCount",
      accessorFn: (row) => row.landingPageCount ?? 0,
      meta: {
        label: "Landing Pages",
      },
      header: ({ column }) => <DataTableColumnHeader column={column} label="Landing Pages" />,
      cell: ({ row }) => {
        const count = row.original.landingPageCount ?? 0
        if (count === 0) return <span className="text-muted-foreground">-</span>
        return (
          <span className="text-muted-foreground">
            {count} {count === 1 ? "page" : "pages"}
          </span>
        )
      },
      enableSorting: false,
      minSize: 130,
    },
    {
      id: "adAccountCount",
      accessorFn: (row) => row.adAccountCount ?? 0,
      meta: {
        label: "Ad Accounts",
      },
      header: ({ column }) => <DataTableColumnHeader column={column} label="Ad Accounts" />,
      cell: ({ row }) => {
        const count = row.original.adAccountCount ?? 0
        if (count === 0) return <span className="text-muted-foreground">-</span>
        return (
          <span className="text-muted-foreground">
            {count} {count === 1 ? "account" : "accounts"}
          </span>
        )
      },
      enableSorting: false,
      minSize: 120,
    },
    {
      id: "status",
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} label="Status" />,
      cell: ({ row }) => <CampaignStatusBadge status={row.original.status} />,
      enableSorting: true,
      meta: {
        label: "Status",
        variant: "multiSelect",
        options: [
          { label: "Active", value: "active", icon: IconCircleCheckFilled },
          { label: "Inactive", value: "inactive", icon: IconCircleXFilled },
          { label: "Paused", value: "paused", icon: IconPlayerPauseFilled },
          { label: "Expired", value: "expired", icon: IconCircleFilled },
        ],
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
      enableSorting: true,
      enableColumnFilter: true,
      minSize: 120,
    },
    {
      id: "actions",
      cell: function Cell({ row }) {
        return (
          <CampaignRowActions
            row={row}
            setRowAction={setRowAction}
            onStatusChange={onStatusChange}
            campaignDetailPrefix={campaignDetailPrefix}
          />
        )
      },
      size: 50,
      maxSize: 50,
      minSize: 50,
      enableResizing: false,
    },
  ]
}

/* ── Row Actions ───────────────────────────────────────────────────── */

interface CampaignRowActionsProps {
  row: Row<Campaign>
  setRowAction: React.Dispatch<React.SetStateAction<DataTableRowAction<Campaign> | null>>
  onStatusChange?: (campaignId: string, status: "active" | "inactive") => void
  campaignDetailPrefix?: string
}

function CampaignRowActions({
  row,
  setRowAction,
  onStatusChange,
  campaignDetailPrefix = "/campaigns",
}: CampaignRowActionsProps) {
  const canView = useHasPermission("campaigns.view")
  const canEdit = useHasPermission("campaigns.edit")
  const canDelete = useHasPermission("campaigns.delete")

  const campaign = row.original
  const isActive = campaign.status === "active"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button aria-label="Open action menu" variant="ghost" className="flex size-8 p-0 data-[state=open]:bg-muted">
          <Ellipsis className="size-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {canView && (
          <DropdownMenuItem asChild>
            <Link href={`${campaignDetailPrefix}/${campaign.id}`}>View</Link>
          </DropdownMenuItem>
        )}
        {canEdit && onStatusChange && (
          <>
            <DropdownMenuSeparator />
            {isActive ? (
              <DropdownMenuItem onSelect={() => onStatusChange(campaign.id, "inactive")}>Set Inactive</DropdownMenuItem>
            ) : (
              <DropdownMenuItem onSelect={() => onStatusChange(campaign.id, "active")}>Set Active</DropdownMenuItem>
            )}
          </>
        )}
        {canDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setRowAction({ row, variant: "delete" })} disabled={isActive}>
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/* ── Status Badge ──────────────────────────────────────────────────── */

function CampaignStatusBadge({ status }: { status: "active" | "inactive" | "paused" | "expired" }) {
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
          <IconPlayerPauseFilled className="size-3.5 text-yellow-500 dark:text-yellow-400" />
          <span>Paused</span>
        </>
      ) : (
        <>
          <IconCircleFilled className="size-3.5 text-red-500 dark:text-red-400" />
          <span>Expired</span>
        </>
      )}
    </Badge>
  )
}
