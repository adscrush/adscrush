"use client"

import * as React from "react"
import { trpc } from "@/lib/trpc/client"

import type { QueryKeys } from "@adscrush/shared/types/data-table"
import type { GetPortalProductsSchema } from "../validations/products"
import { portalProductKeys } from "../queries/products"
import { getProductsTableColumns } from "@/features/products/components/products-table-columns"
import { PortalDataTable } from "./portal-data-table"
import type { Product } from "@/features/products/queries"

interface EmpProductsDataTableProps {
  search: GetPortalProductsSchema
  queryKeys?: Partial<QueryKeys>
}

export function EmpProductsDataTable({ search, queryKeys }: EmpProductsDataTableProps) {
  const utils = trpc.useUtils()
  const columns = React.useMemo(() => getProductsTableColumns({ setRowAction: () => {} }), [])

  return (
    <PortalDataTable<Product>
      columns={columns}
      search={search}
      queryKeys={queryKeys}
      queryKeyList={portalProductKeys.list}
      queryFn={(params) =>
        utils.portal.myProductsList.fetch(params).then((result) => ({
          data: result.items,
          pageCount: result.pageCount,
          total: result.total,
        }))
      }
    />
  )
}
