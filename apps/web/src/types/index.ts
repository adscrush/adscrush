import type { SQL } from "@adscrush/db/drizzle";
import type { ColumnDef } from "@tanstack/react-table";

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type EmptyProps<T extends React.ElementType> = Omit<React.ComponentProps<T>, keyof React.ComponentProps<T>>;

export interface SearchParams {
  [key: string]: string | string[] | undefined;
  callbackUrl?: string;
}

export interface QueryBuilderOpts {
  where?: SQL;
  orderBy?: SQL;
  distinct?: boolean;
  nullish?: boolean;
}

/**
 * TanStack Table's `ColumnDef` TValue type is invariant, so heterogeneous
 * column arrays (different accessor value types in one table) can only be
 * typed with an explicit value-type escape hatch. This mirrors the pattern
 * used in TanStack's own documentation (`ColumnDef<TData, any>[]`).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyColumnDef<TData> = ColumnDef<TData, any>;
