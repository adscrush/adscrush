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
import type { ColumnDef } from "@tanstack/react-table"
import type { Creative } from "../queries"
import {
  CalendarIcon,
  CircleDashed,
  Ellipsis,
  Eye,
  Text,
  File,
  Image,
  Video,
} from "lucide-react"
import {
  IconCircleCheckFilled,
  IconCircleXFilled,
} from "@tabler/icons-react"
import { formatFileSize } from "@/components/media/media-utils"

function getFileTypeIcon(fileType: string | null) {
  if (fileType === "image") return <Image className="size-4" />
  if (fileType === "video") return <Video className="size-4" />
  return <File className="size-4" />
}

interface GetCreativesTableColumnsProps {
  setPreviewCreative: React.Dispatch<
    React.SetStateAction<Creative | null>
  >
  setDeleteCreative: React.Dispatch<
    React.SetStateAction<Creative | null>
  >
}

export function getCreativesTableColumns({
  setPreviewCreative,
  setDeleteCreative,
}: GetCreativesTableColumnsProps): ColumnDef<Creative>[] {
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
        <div className="flex items-center gap-3">
          <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
            {row.original.fileType === "image" && row.original.thumbnailUrl ? (
              <img
                src={row.original.thumbnailUrl}
                alt={row.original.name}
                className="size-full object-cover"
              />
            ) : row.original.fileType === "image" && row.original.cdnUrl ? (
              <img
                src={row.original.cdnUrl}
                alt={row.original.name}
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-muted-foreground">
                {getFileTypeIcon(row.original.fileType)}
              </div>
            )}
          </div>
          <span className="truncate font-medium">{row.getValue("name")}</span>
        </div>
      ),
      meta: {
        label: "Name",
        placeholder: "Search creative...",
        variant: "text",
        icon: Text,
      },
      enableColumnFilter: true,
      minSize: 220,
    },
    {
      id: "fileType",
      accessorKey: "fileType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Type" />
      ),
      cell: ({ cell }) => (
        <div className="flex items-center gap-2 text-muted-foreground">
          {getFileTypeIcon(cell.getValue<string | null>())}
          <span className="capitalize">
            {cell.getValue<string | null>() ?? "-"}
          </span>
        </div>
      ),
      meta: {
        label: "Type",
        variant: "text",
        icon: File,
      },
      enableColumnFilter: true,
      minSize: 100,
    },
    {
      id: "mimeType",
      accessorKey: "mimeType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="MIME Type" />
      ),
      cell: ({ cell }) => (
        <span className="text-muted-foreground">
          {cell.getValue<string | null>() ?? "-"}
        </span>
      ),
      meta: {
        label: "MIME Type",
        variant: "text",
        icon: Text,
      },
      enableColumnFilter: true,
      minSize: 140,
    },
    {
      id: "fileSize",
      accessorKey: "fileSize",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Size" />
      ),
      cell: ({ cell }) => (
        <span className="text-muted-foreground">
          {formatFileSize(cell.getValue<number | null>())}
        </span>
      ),
      meta: {
        label: "Size",
        variant: "text",
      },
      enableSorting: true,
      minSize: 100,
    },
    {
      id: "status",
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Status" />
      ),
      cell: ({ row }) => (
        <CreativeStatusBadge status={row.original.status} />
      ),
      enableSorting: true,
      meta: {
        label: "Status",
        variant: "multiSelect",
        options: [
          { label: "Active", value: "active", icon: IconCircleCheckFilled },
          { label: "Inactive", value: "inactive", icon: IconCircleXFilled },
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
                onSelect={() => setPreviewCreative(row.original)}
              >
                <Eye className="mr-2 size-4" />
                Preview
                <DropdownMenuShortcut>P</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => setDeleteCreative(row.original)}
              >
                Delete
                <DropdownMenuShortcut>D</DropdownMenuShortcut>
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

function CreativeStatusBadge({ status }: { status: Creative["status"] }) {
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
