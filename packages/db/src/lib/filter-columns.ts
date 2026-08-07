import { addDays, endOfDay, startOfDay } from "date-fns"
import {
  type AnyColumn,
  and,
  eq,
  gt,
  gte,
  ilike,
  inArray,
  lt,
  lte,
  ne,
  not,
  notIlike,
  notInArray,
  or,
  sql,
  type SQL,
  type Table,
  like,
} from "../drizzle"
import { isEmpty } from "../utils"
import type { ExtendedColumnFilter, JoinOperator } from "@adscrush/shared/types/data-table"
import { UTCDate } from "@date-fns/utc"

type Database = "sqlite" | "mysql" | "postgres"

/** Check if a column needs text casting for pattern matching (UUID, binary, json, etc.) */
function needsTextCast(column: AnyColumn): boolean {
  // Check columnType for Drizzle column type indicators
  const colType = (column as { columnType?: string }).columnType
  const dataType = column.dataType as string | undefined
  return (
    colType === "PgUUID" ||
    colType === "PgBinary" ||
    colType === "PgJson" ||
    colType === "PgJsonB" ||
    dataType === "uuid" ||
    dataType === "binary" ||
    dataType === "json" ||
    dataType === "jsonb"
  )
}

function iLikeFallback(column: AnyColumn, value: string, database: Database) {
  if (database === "postgres") {
    // Cast UUID/binary columns to text for ilike operations
    if (needsTextCast(column)) {
      return ilike(sql`${column}::text`, value)
    }
    return ilike(column, value)
  }
  return like(column, `%${value}%`)
}

function notILikeFallback(column: AnyColumn, value: string, database: Database) {
  if (database === "postgres") {
    // Cast UUID/binary columns to text for notIlike operations
    if (needsTextCast(column)) {
      return notIlike(sql`${column}::text`, value)
    }
    return notIlike(column, value)
  }
  return not(like(column, `%${value}%`))
}

function utcStartOfDay(ts: string | number) {
  return new UTCDate(new Date(Number(ts)).setHours(0, 0, 0, 0))
}

function utcEndOfDay(ts: string | number) {
  return new UTCDate(new Date(Number(ts)).setHours(23, 59, 59, 999))
}

export function filterColumns<T extends Table>({
  table,
  filters,
  joinOperator,
  database,
}: {
  table: T
  filters: ExtendedColumnFilter<T>[]
  joinOperator: JoinOperator
  database: Database
}): SQL | undefined {
  const joinFn = joinOperator === "and" ? and : or

  const conditions = filters.map((filter) => {
    const column = getColumn(table, filter.id)

    switch (filter.operator) {
      case "iLike":
        return filter.variant === "text" && typeof filter.value === "string"
          ? iLikeFallback(column, `%${filter.value}%`, database)
          : undefined

      case "notILike":
        return filter.variant === "text" && typeof filter.value === "string"
          ? notILikeFallback(column, `%${filter.value}%`, database)
          : undefined

      case "eq":
        if (column.dataType === "boolean" && typeof filter.value === "string") {
          return eq(column, filter.value === "true")
        }
        if (filter.variant === "date" || filter.variant === "dateRange") {
          return and(gte(column, utcStartOfDay(Number(filter.value))), lte(column, utcEndOfDay(Number(filter.value))))
        }
        return eq(column, filter.value)

      case "ne":
        if (column.dataType === "boolean" && typeof filter.value === "string") {
          return ne(column, filter.value === "true")
        }
        if (filter.variant === "date" || filter.variant === "dateRange") {
          return or(lt(column, utcStartOfDay(Number(filter.value))), gt(column, utcEndOfDay(Number(filter.value))))
        }
        return ne(column, filter.value)

      case "inArray":
        if (Array.isArray(filter.value)) {
          return inArray(column, filter.value)
        }
        return undefined

      case "notInArray":
        if (Array.isArray(filter.value)) {
          return notInArray(column, filter.value)
        }
        return undefined

      case "lt":
        return filter.variant === "number" || filter.variant === "range"
          ? lt(column, filter.value)
          : (filter.variant === "date" || filter.variant === "dateRange") && typeof filter.value === "string"
            ? lt(column, utcStartOfDay(filter.value))
            : undefined

      case "lte":
        return filter.variant === "number" || filter.variant === "range"
          ? lte(column, filter.value)
          : filter.variant === "date" && typeof filter.value === "string"
            ? lte(column, utcEndOfDay(filter.value))
            : filter.variant === "dateRange" && typeof filter.value === "string"
              ? lte(column, utcEndOfDay(filter.value))
              : undefined

      case "gt":
        return filter.variant === "number" || filter.variant === "range"
          ? gt(column, filter.value)
          : filter.variant === "date" && typeof filter.value === "string"
            ? gt(column, utcEndOfDay(filter.value))
            : filter.variant === "dateRange" && typeof filter.value === "string"
              ? gt(column, utcEndOfDay(filter.value))
              : undefined

      case "gte":
        return filter.variant === "number" || filter.variant === "range"
          ? gte(column, filter.value)
          : filter.variant === "date" && typeof filter.value === "string"
            ? gte(column, utcStartOfDay(filter.value))
            : filter.variant === "dateRange" && typeof filter.value === "string"
              ? gte(column, utcStartOfDay(filter.value))
              : undefined

      case "isBetween":
        if (
          (filter.variant === "date" || filter.variant === "dateRange") &&
          Array.isArray(filter.value) &&
          filter.value.length === 2
        ) {
          return and(
            filter.value[0] ? gte(column, utcStartOfDay(filter.value[0])) : undefined,
            filter.value[1] ? lte(column, utcEndOfDay(filter.value[1])) : undefined
          )
        }

        if (
          (filter.variant === "number" || filter.variant === "range") &&
          Array.isArray(filter.value) &&
          filter.value.length === 2
        ) {
          const firstValue = filter.value[0] && filter.value[0].trim() !== "" ? Number(filter.value[0]) : null
          const secondValue = filter.value[1] && filter.value[1].trim() !== "" ? Number(filter.value[1]) : null

          if (firstValue === null && secondValue === null) {
            return undefined
          }

          if (firstValue !== null && secondValue === null) {
            return eq(column, firstValue)
          }

          if (firstValue === null && secondValue !== null) {
            return eq(column, secondValue)
          }

          return and(
            firstValue !== null ? gte(column, firstValue) : undefined,
            secondValue !== null ? lte(column, secondValue) : undefined
          )
        }
        return undefined

      case "isRelativeToToday":
        if ((filter.variant === "date" || filter.variant === "dateRange") && typeof filter.value === "string") {
          const today = new Date()
          const [amount, unit] = filter.value.split(" ") ?? []
          let startDate: Date
          let endDate: Date

          if (!amount || !unit) return undefined

          switch (unit) {
            case "days":
              startDate = startOfDay(addDays(today, Number.parseInt(amount, 10)))
              endDate = endOfDay(startDate)
              break
            case "weeks":
              startDate = startOfDay(addDays(today, Number.parseInt(amount, 10) * 7))
              endDate = endOfDay(addDays(startDate, 6))
              break
            case "months":
              startDate = startOfDay(addDays(today, Number.parseInt(amount, 10) * 30))
              endDate = endOfDay(addDays(startDate, 29))
              break
            default:
              return undefined
          }

          return and(gte(column, startDate), lte(column, endDate))
        }
        return undefined

      case "isEmpty":
        return isEmpty(column)

      case "isNotEmpty":
        return not(isEmpty(column))

      default:
        throw new Error(`Unsupported operator: ${filter.operator}`)
    }
  })

  const validConditions = conditions.filter((condition) => condition !== undefined)

  return validConditions.length > 0 ? joinFn(...validConditions) : undefined
}

export function getColumn<T extends Table>(table: T, columnKey: keyof T): AnyColumn {
  return table[columnKey] as AnyColumn
}
