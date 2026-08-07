"use client"

import { AD_ACCOUNT_STATUS, parseAdAccountStatusLabel } from "@adscrush/shared/constants/status"
import type { CreateAdAccountInput } from "@adscrush/shared/validators/ad-account.schema"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@adscrush/ui/components/dialog"
import {
  Field,
  FieldContent,
  FieldLabel,
} from "@adscrush/ui/components/field"
import { toast } from "@adscrush/ui/sonner"
import {
  IconFileSpreadsheet,
  IconLoader2,
  IconSelector,
  IconUpload,
} from "@tabler/icons-react"
import React, { useCallback, useRef, useState } from "react"
import { trpc } from "@/lib/trpc/client"
import { useImportAdAccounts } from "../queries"

type Step = "upload" | "mapping" | "result"

interface ColumnMap {
  name: string | null
  sourcePlatform: string | null
  accountId: string | null
  status: string | null
  mediaBuyer: string | null
}

interface ComboboxItemType {
  label: string
  value: string
}

const FIELD_LABELS: Record<keyof ColumnMap, string> = {
  name: "Name",
  sourcePlatform: "Source Platform",
  accountId: "Account ID",
  status: "Status",
  mediaBuyer: "Media Buyer",
}

const REQUIRED_FIELDS: (keyof ColumnMap)[] = ["name", "sourcePlatform", "accountId"]

const SKIP_VALUE = "_skip"
const CUSTOM_VALUE = "_custom"
const SKIP_ITEM: ComboboxItemType = { label: "Skip this field", value: SKIP_VALUE }
const CUSTOM_ITEM: ComboboxItemType = {
  label: "Custom value (apply same to all rows)",
  value: CUSTOM_VALUE,
}

const CUSTOM_VALUE_FIELDS: (keyof ColumnMap)[] = ["sourcePlatform", "status", "mediaBuyer"]

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/[\s_-]+/g, "")
}

function autoDetectMapping(headers: string[]): ColumnMap {
  const map: ColumnMap = {
    name: null,
    sourcePlatform: null,
    accountId: null,
    status: null,
    mediaBuyer: null,
  }

  const patterns: Record<keyof ColumnMap, string[]> = {
    name: ["name", "accountname", "adname", "account_name", "ad_name"],
    sourcePlatform: ["sourceplatform", "source_platform", "platform", "adplatform"],
    accountId: ["accountid", "account_id", "id"],
    status: ["status"],
    mediaBuyer: ["mediabuyer", "buyer", "affiliate", "mediabuyername", "buyername"],
  }

  for (const header of headers) {
    const n = normalizeHeader(header)
    for (const [field, aliases] of Object.entries(patterns)) {
      if (aliases.some((a) => n === a || n.includes(a))) {
        const key = field as keyof ColumnMap
        if (!map[key]) {
          map[key] = header
        }
      }
    }
  }

  return map
}

function isValidValue(val: unknown): boolean {
  return val != null && String(val).trim().length > 0
}

interface ImportAdAccountsDialogProps {
  children?: React.ReactElement
}

export function ImportAdAccountsDialog({
  children,
}: ImportAdAccountsDialogProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>("upload")
  const [file, setFile] = useState<File | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [headerKeyMap, setHeaderKeyMap] = useState<Record<string, string>>({})
  const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([])
  const [columnMap, setColumnMap] = useState<ColumnMap>({
    name: null,
    sourcePlatform: null,
    accountId: null,
    status: null,
    mediaBuyer: null,
  })
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([])
  const [customValues, setCustomValues] = useState<Partial<Record<keyof ColumnMap, string>>>({})
  const [isParsing, setIsParsing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const importMutation = useImportAdAccounts()

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setTimeout(() => {
        setStep("upload")
        setFile(null)
        setHeaders([])
        setHeaderKeyMap({})
        setPreviewRows([])
        setParsedRows([])
        setCustomValues({})
        setColumnMap({
          name: null,
          sourcePlatform: null,
          accountId: null,
          status: null,
          mediaBuyer: null,
        })
      }, 300)
    }
  }

  const parseFile = useCallback(async (f: File) => {
    setIsParsing(true)
    try {
      const XLSX = await import("xlsx")
      const buffer = await f.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: "array" })
      const sheetName = workbook.SheetNames[0]
      if (!sheetName) {
        toast.error("No sheets found in file")
        return
      }
      const sheet = workbook.Sheets[sheetName]
      if (!sheet) {
        toast.error("Could not read sheet data")
        return
      }
      const data = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
        defval: "",
        header: "A",
      })

      if (data.length === 0) {
        toast.error("No data found in file")
        return
      }

      const firstRow = data[0]
      if (!firstRow) {
        toast.error("File appears to be empty")
        return
      }

      const actualHeaders = Object.keys(firstRow)
      const hasLetterHeaders = actualHeaders.every((h) => /^[A-Z]+$/.test(h))

      let detectedHeaders: string[]
      let rows: Record<string, string>[]
      const keyMap: Record<string, string> = {}

      if (hasLetterHeaders) {
        detectedHeaders = Object.values(firstRow).map((v) => String(v))
        const keys = Object.keys(firstRow)
        detectedHeaders.forEach((h, i) => {
          keyMap[h] = keys[i] ?? ""
        })
        rows = data.slice(2).filter((r) =>
          Object.values(r).some((v) => String(v).trim() !== "")
        )
      } else {
        detectedHeaders = actualHeaders
        detectedHeaders.forEach((h) => {
          keyMap[h] = h
        })
        rows = data.filter((r) =>
          Object.values(r).some((v) => String(v).trim() !== "")
        )
      }

      setHeaders(detectedHeaders)
      setHeaderKeyMap(keyMap)
      setParsedRows(rows)
      setPreviewRows(rows.slice(0, 5))
      setColumnMap(autoDetectMapping(detectedHeaders))
      setStep("mapping")
    } catch {
      toast.error("Failed to parse file. Make sure it's a valid CSV or Excel file.")
    } finally {
      setIsParsing(false)
    }
  }, [])

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0]
      if (f) {
        setFile(f)
        parseFile(f)
      }
    },
    [parseFile]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const f = e.dataTransfer.files?.[0]
      if (f) {
        setFile(f)
        parseFile(f)
      }
    },
    [parseFile]
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const comboboxItems = React.useCallback(
    (field: keyof ColumnMap): ComboboxItemType[] => {
      const items: ComboboxItemType[] = [SKIP_ITEM]
      if (CUSTOM_VALUE_FIELDS.includes(field)) {
        items.push(CUSTOM_ITEM)
      }
      items.push(...headers.map((h) => ({ label: h, value: h })))
      return items
    },
    [headers]
  )

  const missingRequired = REQUIRED_FIELDS.filter(
    (f) => !columnMap[f] && !customValues[f]
  )

  const resolveValue = React.useCallback(
    (field: keyof ColumnMap, row: Record<string, string>): string => {
      if (customValues[field]) return customValues[field]!
      const col = columnMap[field]
      if (!col) return ""
      const actualKey = headerKeyMap[col]
      return actualKey ? String(row[actualKey] ?? "") : ""
    },
    [columnMap, headerKeyMap, customValues]
  )

  const mappedRows = React.useMemo(() => {
    return parsedRows.map((row) => {
      const mapped: Record<string, string> = {} as Record<string, string>
      for (const field of Object.keys(FIELD_LABELS) as (keyof ColumnMap)[]) {
        mapped[field] = resolveValue(field, row)
      }
      return mapped
    })
  }, [parsedRows, resolveValue])

  const validRows = React.useMemo(
    () =>
      mappedRows.filter(
        (row) =>
          isValidValue(row.name) &&
          isValidValue(row.sourcePlatform) &&
          isValidValue(row.accountId)
      ),
    [mappedRows]
  )

  const hasMediaBuyerColumn = Boolean(
    columnMap.mediaBuyer || customValues.mediaBuyer
  )

  // Distinct, non-empty media buyer names referenced by the mapped rows.
  const mediaBuyerNames = React.useMemo(() => {
    if (!hasMediaBuyerColumn) return []
    const set = new Set<string>()
    for (const row of validRows) {
      const name = row.mediaBuyer?.trim()
      if (name) set.add(name)
    }
    return Array.from(set)
  }, [validRows, hasMediaBuyerColumn])

  const resolveMediaBuyersQuery = trpc.mediaBuyers.resolveByNames.useQuery(
    { names: mediaBuyerNames },
    { enabled: mediaBuyerNames.length > 0, staleTime: 30_000 }
  )

  // Case-insensitive name -> id map for resolved media buyers. Names are not
  // unique, so a name matching more than one buyer is treated as unresolved
  // (left blank) rather than guessing which buyer was intended.
  const mediaBuyerIdByName = React.useMemo(() => {
    const idsByName = new Map<string, Set<string>>()
    for (const mb of resolveMediaBuyersQuery.data ?? []) {
      const key = mb.name.trim().toLowerCase()
      const ids = idsByName.get(key) ?? new Set<string>()
      ids.add(mb.id)
      idsByName.set(key, ids)
    }

    const map = new Map<string, string>()
    for (const [key, ids] of idsByName) {
      if (ids.size === 1) {
        map.set(key, ids.values().next().value as string)
      }
    }
    return map
  }, [resolveMediaBuyersQuery.data])

  const unmatchedMediaBuyerNames = React.useMemo(() => {
    if (mediaBuyerNames.length === 0) return []
    return mediaBuyerNames.filter(
      (name) => !mediaBuyerIdByName.has(name.toLowerCase())
    )
  }, [mediaBuyerNames, mediaBuyerIdByName])

  const matchedMediaBuyerCount =
    mediaBuyerNames.length - unmatchedMediaBuyerNames.length
  const isResolvingMediaBuyers =
    hasMediaBuyerColumn &&
    mediaBuyerNames.length > 0 &&
    resolveMediaBuyersQuery.isFetching

  const invalidCount = mappedRows.length - validRows.length
  const canImport =
    missingRequired.length === 0 &&
    validRows.length > 0 &&
    !isResolvingMediaBuyers

  const handleImport = async () => {
    if (!canImport) return

    const accounts: CreateAdAccountInput[] = validRows.map((row) => {
      const mediaBuyerName = row.mediaBuyer?.trim()
      const mediaBuyerId = mediaBuyerName
        ? (mediaBuyerIdByName.get(mediaBuyerName.toLowerCase()) ?? null)
        : null

      return {
        name: row.name!,
        sourcePlatform: row.sourcePlatform!,
        accountId: row.accountId!,
        mediaBuyerId,
        status: parseAdAccountStatusLabel(row.status ?? "") ?? AD_ACCOUNT_STATUS.ACTIVE,
      }
    })

    importMutation.mutate(
      { accounts },
      {
        onSuccess: (result) => {
          setStep("result")
          toast.success(
            `Imported ${result.imported} account(s), skipped ${result.skipped} duplicate(s)`
          )
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  }

  const previewMappedRows = React.useMemo(() => {
    return previewRows.map((row) => {
      const mapped: Record<string, string> = {} as Record<string, string>
      for (const field of Object.keys(FIELD_LABELS) as (keyof ColumnMap)[]) {
        mapped[field] = resolveValue(field, row)
      }
      return mapped
    })
  }, [previewRows, resolveValue])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} size="lg">
      <DialogTrigger render={children} />
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === "upload" && "Import Ad Accounts"}
            {step === "mapping" && "Map Columns"}
            {step === "result" && "Import Results"}
          </DialogTitle>
          <DialogDescription>
            {step === "upload" &&
              "Upload a CSV or Excel file to bulk import ad accounts"}
            {step === "mapping" &&
              "Map your file columns to ad account fields"}
            {step === "result" && "Import completed"}
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed p-12 transition-colors hover:border-muted-foreground/50"
            >
              <IconFileSpreadsheet className="size-10 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium">
                  Drag & drop your file here
                </p>
                <p className="text-xs text-muted-foreground">
                  or click to browse (CSV, XLSX, XLS)
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            {file && isParsing && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <IconLoader2 className="size-4 animate-spin" />
                Parsing {file.name}...
              </div>
            )}
          </div>
        )}

        {step === "mapping" && (
          <div className="space-y-6">
            <div className="space-y-3">
              {(Object.keys(FIELD_LABELS) as (keyof ColumnMap)[]).map(
                (field) => {
                  const currentValue = columnMap[field]
                  const isCustom = currentValue === CUSTOM_VALUE
                  const selectedItem = isCustom
                    ? CUSTOM_ITEM
                    : currentValue
                      ? { label: currentValue, value: currentValue }
                      : SKIP_ITEM

                  return (
                    <Field key={field} orientation="vertical">
                      <FieldLabel>
                        {FIELD_LABELS[field]}
                        {REQUIRED_FIELDS.includes(field) && (
                          <span className="text-destructive"> *</span>
                        )}
                      </FieldLabel>
                      <FieldContent className="space-y-2">
                        <Combobox
                          autoHighlight
                          items={comboboxItems(field)}
                          value={selectedItem}
                          itemToStringValue={(item) => item.label}
                          onValueChange={(item) => {
                            const val = item?.value ?? null
                            setColumnMap((prev) => ({
                              ...prev,
                              [field]: val,
                            }))
                            if (val !== CUSTOM_VALUE) {
                              setCustomValues((prev) => {
                                const next = { ...prev }
                                delete next[field]
                                return next
                              })
                            }
                          }}
                        >
                          <ComboboxTrigger
                            render={
                              <Button
                                variant="outline"
                                className="w-full justify-between font-normal"
                              >
                                {isCustom ? (
                                  <span className="truncate text-muted-foreground">
                                    Custom value...
                                  </span>
                                ) : currentValue ? (
                                  <span className="truncate">{currentValue}</span>
                                ) : (
                                  <span className="truncate text-muted-foreground">
                                    Select column...
                                  </span>
                                )}
                                <IconSelector className="ml-2 size-3.5 shrink-0 text-muted-foreground" />
                              </Button>
                            }
                          />
                          <ComboboxContent className="min-w-0">
                            <div className="w-full p-1.5">
                              <ComboboxInput
                                className="min-w-0 rounded-md"
                                placeholder="Search column..."
                                showTrigger={false}
                                showClear={false}
                              />
                            </div>
                            <ComboboxEmpty>
                              <span className="text-xs text-muted-foreground">
                                No columns found.
                              </span>
                            </ComboboxEmpty>
                            <ComboboxList>
                              {(item: ComboboxItemType) => (
                                <ComboboxItem key={item.value} value={item}>
                                  <span className="truncate text-xs font-medium">
                                    {item.label}
                                  </span>
                                </ComboboxItem>
                              )}
                            </ComboboxList>
                          </ComboboxContent>
                        </Combobox>
                        {isCustom && (
                          <input
                            type="text"
                            value={customValues[field] ?? ""}
                            onChange={(e) =>
                              setCustomValues((prev) => ({
                                ...prev,
                                [field]: e.target.value,
                              }))
                            }
                            placeholder={`Enter value for all ${FIELD_LABELS[field]} rows...`}
                            className="w-full rounded-md border border-input bg-input/20 px-3 py-1.5 text-xs outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                          />
                        )}
                      </FieldContent>
                    </Field>
                  )
                }
              )}
            </div>

            {missingRequired.length > 0 && (
              <p className="text-xs text-destructive">
                Required fields missing:{" "}
                {missingRequired.map((f) => FIELD_LABELS[f]).join(", ")}
              </p>
            )}

            <div className="rounded-md bg-muted p-3">
              <p className="text-xs text-muted-foreground">
                {parsedRows.length} row(s) found in file.
                {mappedRows.length > 0 &&
                  ` ${validRows.length} valid row(s) after mapping.`}
                {invalidCount > 0 &&
                  ` ${invalidCount} row(s) skipped (missing required fields).`}
              </p>
            </div>

            {hasMediaBuyerColumn && mediaBuyerNames.length > 0 && (
              <div className="rounded-md bg-muted p-3">
                {isResolvingMediaBuyers ? (
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <IconLoader2 className="size-3.5 animate-spin" />
                    Matching media buyers by name...
                  </p>
                ) : (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      {matchedMediaBuyerCount} of {mediaBuyerNames.length} media
                      buyer name(s) matched and will be assigned.
                    </p>
                    {unmatchedMediaBuyerNames.length > 0 && (
                      <p className="text-xs text-amber-600 dark:text-amber-500">
                        Unmatched (imported without a media buyer):{" "}
                        {unmatchedMediaBuyerNames.slice(0, 8).join(", ")}
                        {unmatchedMediaBuyerNames.length > 8 &&
                          `, +${unmatchedMediaBuyerNames.length - 8} more`}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {previewMappedRows.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Preview ({previewMappedRows.length} rows):
                </p>
                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        {(
                          Object.keys(FIELD_LABELS) as (keyof ColumnMap)[]
                        ).map(
                          (field) =>
                            columnMap[field] && (
                              <th
                                key={field}
                                className="p-2 text-left font-medium"
                              >
                                {FIELD_LABELS[field]}
                              </th>
                            )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {previewMappedRows.map((row, i) => (
                        <tr key={i} className="border-b last:border-0">
                          {(
                            Object.keys(FIELD_LABELS) as (keyof ColumnMap)[]
                          ).map(
                            (field) =>
                              columnMap[field] && (
                                <td
                                  key={field}
                                  className="truncate p-2 text-muted-foreground"
                                >
                                  {row[field] || "-"}
                                </td>
                              )
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {step === "result" && (
          <div className="space-y-4 py-6 text-center">
            {importMutation.data && (
              <>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {importMutation.data.imported}
                </div>
                <p className="text-sm text-muted-foreground">
                  Ad accounts imported successfully
                </p>
                {importMutation.data.skipped > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {importMutation.data.skipped} duplicate(s) skipped
                  </p>
                )}
                {importMutation.data.errors > 0 && (
                  <p className="text-xs text-destructive">
                    {importMutation.data.errors} error(s) occurred
                  </p>
                )}
              </>
            )}
          </div>
        )}

        <DialogFooter>
          {step === "upload" && (
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
          )}

          {step === "mapping" && (
            <>
              <Button
                variant="outline"
                onClick={() => setStep("upload")}
              >
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={!canImport || importMutation.isPending}
              >
                {importMutation.isPending ? (
                  <>
                    <IconLoader2 className="mr-2 size-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <IconUpload className="mr-2 size-4" />
                    Import {validRows.length} Row(s)
                  </>
                )}
              </Button>
            </>
          )}

          {step === "result" && (
            <Button onClick={() => handleOpenChange(false)}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}