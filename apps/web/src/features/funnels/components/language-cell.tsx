"use client"

import { useLanguages } from "@/features/languages/queries"

interface LanguageCellProps {
  id: string
}

export function LanguageCell({ id }: LanguageCellProps) {
  const { data: result } = useLanguages({
    search: "",
    filterFlag: "commandFilters",
    page: 1,
    perPage: 200,
    sort: [{ id: "name", desc: false }],
    filters: [],
    joinOperator: "and",
  })

  const languages = result?.data ?? []
  const language = languages.find((l: { id: string }) => l.id === id)

  return (
    <span className="text-xs text-muted-foreground">
      {language?.name ?? id}
    </span>
  )
}
