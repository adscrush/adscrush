"use client"

import { Button } from "@adscrush/ui/components/button"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "@adscrush/ui/components/combobox"
import { IconLoader2, IconPlus, IconSelector } from "@tabler/icons-react"
import { useDebouncedValue } from "@tanstack/react-pacer"
import Link from "next/link"
import * as React from "react"
import { useProductsOptions } from "@/features/creatives/queries"

interface Product {
  id: string
  name: string
  image: string | null
}

interface ProductSelectProps {
  value: string | null
  onChange: (productId: string | null) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function ProductSelect({
  value,
  onChange,
  placeholder = "Select product...",
  className,
  disabled,
}: ProductSelectProps) {
  const [q, setQ] = React.useState("")

  const [debouncedQuery, debouncer] = useDebouncedValue(
    q,
    { wait: 300 },
    (state) => ({ isPending: state.isPending })
  )

  const { data: products, isLoading: isProductsLoading } =
    useProductsOptions(debouncedQuery)

  const isLoading = isProductsLoading || debouncer.state.isPending

  const selectedProduct = React.useMemo(() => {
    if (!products || !value) return null
    return products.find((p) => p.id === value) ?? null
  }, [products, value])

  const items = React.useMemo(() => {
    if (!products) return []
    if (selectedProduct && !products.some((p) => p.id === selectedProduct.id)) {
      return [selectedProduct, ...products]
    }
    return products
  }, [products, selectedProduct])

  const handleChange = React.useCallback(
    (product: Product | null) => {
      onChange(product?.id ?? null)
    },
    [onChange]
  )

  const renderProductImage = (product: Product, size: "sm" | "md") => {
    const sizeClass = size === "sm" ? "size-5" : "size-6"
    if (product.image) {
      return (
        <img
          src={product.image}
          alt={product.name}
          className={`${sizeClass} shrink-0 rounded object-cover`}
        />
      )
    }
    return (
      <span
        className={`flex ${sizeClass} shrink-0 items-center justify-center rounded bg-muted text-[10px] font-medium text-muted-foreground`}
      >
        {product.name.charAt(0)}
      </span>
    )
  }

  return (
    <Combobox
      autoHighlight
      items={items}
      value={selectedProduct}
      itemToStringValue={(p) => p.name}
      onValueChange={handleChange}
      disabled={disabled}
    >
      <ComboboxTrigger
        render={
          <Button
            variant="outline"
            className={`w-full justify-between font-normal ${className ?? ""}`}
            disabled={disabled}
          >
            {isLoading ? (
              <span className="truncate text-muted-foreground">
                Loading products...
              </span>
            ) : selectedProduct ? (
              <div className="flex items-center gap-2 truncate">
                {renderProductImage(selectedProduct, "sm")}
                <span className="truncate">{selectedProduct.name}</span>
              </div>
            ) : (
              <span className="truncate text-muted-foreground">{placeholder}</span>
            )}
            {isLoading ? (
              <IconLoader2 className="ml-2 size-3.5 shrink-0 animate-spin text-muted-foreground" />
            ) : (
              <IconSelector className="ml-2 size-3.5 shrink-0 text-muted-foreground" />
            )}
          </Button>
        }
      />
      <ComboboxContent className="min-w-0">
        <div className="w-full p-1.5">
          <ComboboxInput
            className="min-w-0 rounded-md"
            placeholder="Search products..."
            showTrigger={false}
            showClear={false}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <ComboboxEmpty>
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground">
              <IconLoader2 className="size-3 animate-spin" />
              <span>Searching...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-4">
              <span className="text-xs text-muted-foreground">
                No products found.
              </span>
            </div>
          )}
        </ComboboxEmpty>
        <ComboboxList>
          {(p: Product) => (
            <ComboboxItem key={p.id} value={p}>
              <div className="flex items-center gap-2">
                {renderProductImage(p, "md")}
                <span className="truncate text-xs font-medium">{p.name}</span>
              </div>
            </ComboboxItem>
          )}
        </ComboboxList>
        <div className="border-t p-1.5">
          <Link
            href="/products/new"
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            <IconPlus className="size-3.5" />
            Create new product
          </Link>
        </div>
      </ComboboxContent>
    </Combobox>
  )
}
