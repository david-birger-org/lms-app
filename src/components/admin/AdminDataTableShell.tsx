"use client";
"use no memo";

import {
  flexRender,
  type Row,
  type RowData,
  type Table as TanStackTable,
} from "@tanstack/react-table";
import { SlidersHorizontal } from "lucide-react";
import { Fragment, type HTMLAttributes, type ReactNode } from "react";

import { StatCard } from "@/components/shell/stat-card";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    /** Plain label for menus and the mobile card. */
    label?: string;
    align?: "start" | "end";
    /** Placement in the mobile card. Defaults to "row". */
    mobile?: "title" | "trailing" | "row" | "hidden";
    cellClassName?: string;
    headerClassName?: string;
  }
}

// Controls are 40px tall on touch screens and 32px from md up.
export const adminDataTableStyles = {
  control: "h-10 md:h-8",
  iconControl: "size-10 md:size-8",
  search: "h-10 md:h-8 md:w-64",
  select: "h-10 w-20 md:h-8",
} as const;

export interface AdminDataTableStat {
  id: string;
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
}

/** Stat tiles, an optional note, the toolbar and a bordered table card. */
export function AdminDataTableCard({
  children,
  description,
  stats = [],
  toolbar,
}: {
  children: ReactNode;
  description?: ReactNode;
  stats?: AdminDataTableStat[];
  toolbar?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      {stats.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {stats.map((stat) => (
            <StatCard
              key={stat.id}
              label={stat.label}
              value={stat.value}
              hint={stat.hint}
            />
          ))}
        </div>
      ) : null}
      <div className="flex min-w-0 flex-col gap-3">
        {toolbar}
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
        <div className="min-w-0 overflow-hidden rounded-xl border bg-card shadow-card">
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Search plus filters. From md everything sits in one row. Below md the
 * filters move into a bottom sheet behind a "Filters" button.
 */
export function AdminDataTableToolbar({
  actions,
  activeFilterCount = 0,
  filters,
  filtersLabel,
  leading,
  search,
}: {
  actions?: ReactNode;
  activeFilterCount?: number;
  filters?: ReactNode;
  filtersLabel: string;
  leading?: ReactNode;
  search?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
      {leading ? (
        <div className="flex md:contents [&>*]:flex-1 md:[&>*]:flex-none">
          {leading}
        </div>
      ) : null}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div className="min-w-0 flex-1 md:flex-none">{search}</div>
        {filters ? (
          <div className="hidden items-center gap-2 md:flex">{filters}</div>
        ) : null}
        {filters ? (
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className={cn(adminDataTableStyles.control, "md:hidden")}
              >
                <SlidersHorizontal />
                {filtersLabel}
                {activeFilterCount > 0 ? (
                  <span className="font-numeric rounded-full bg-foreground px-1.5 text-[11px] leading-5 text-background">
                    {activeFilterCount}
                  </span>
                ) : null}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom">
              <SheetHeader className="pb-0">
                <SheetTitle>{filtersLabel}</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-2 px-4 pb-4 [&>*]:w-full [&>*]:justify-between">
                {filters}
              </div>
            </SheetContent>
          </Sheet>
        ) : null}
        {actions ? (
          <div className="flex items-center gap-2 md:ml-auto">{actions}</div>
        ) : null}
      </div>
    </div>
  );
}

function alignClass(align?: "start" | "end") {
  return align === "end" ? "text-right" : undefined;
}

/**
 * Renders a TanStack table: a table from md up and stacked cards below md.
 * Placement in the card comes from each column's `meta.mobile`.
 */
export function AdminDataTable<T>({
  empty,
  getRowProps,
  isLoading = false,
  table,
}: {
  empty?: ReactNode;
  getRowProps?: (row: Row<T>) => HTMLAttributes<HTMLElement>;
  isLoading?: boolean;
  table: TanStackTable<T>;
}) {
  const rows = table.getRowModel().rows;

  if (rows.length === 0) {
    if (isLoading) return <AdminDataTableRowsSkeleton />;
    return empty ?? null;
  }

  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta;
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        alignClass(meta?.align),
                        meta?.headerClassName,
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() ? "selected" : undefined}
                {...getRowProps?.(row)}
              >
                {row.getVisibleCells().map((cell) => {
                  const meta = cell.column.columnDef.meta;
                  return (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        alignClass(meta?.align),
                        meta?.cellClassName,
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="divide-y md:hidden">
        {rows.map((row) => {
          const cells = row.getVisibleCells();
          const placed = (placement: "title" | "trailing" | "row") =>
            cells.filter(
              (cell) =>
                (cell.column.columnDef.meta?.mobile ?? "row") === placement,
            );
          const titleCells = placed("title");
          const trailingCells = placed("trailing");
          const rowCells = placed("row");
          const rowProps = getRowProps?.(row);

          return (
            <li
              key={row.id}
              data-state={row.getIsSelected() ? "selected" : undefined}
              {...rowProps}
              className={cn(
                "flex flex-col gap-3 p-4 transition-[background-color] duration-150 data-[state=selected]:bg-muted",
                rowProps?.className,
              )}
            >
              {titleCells.length > 0 || trailingCells.length > 0 ? (
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3 text-sm font-medium">
                    {titleCells.map((cell) => (
                      <div key={cell.id} className="min-w-0">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </div>
                    ))}
                  </div>
                  {trailingCells.length > 0 ? (
                    <div className="flex shrink-0 items-center gap-2">
                      {trailingCells.map((cell) => (
                        <Fragment key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </Fragment>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
              {rowCells.length > 0 ? (
                <dl className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-1.5 text-sm">
                  {rowCells.map((cell) => {
                    const meta = cell.column.columnDef.meta;
                    return (
                      <Fragment key={cell.id}>
                        <dt className="text-muted-foreground">
                          {meta?.label ?? cell.column.id}
                        </dt>
                        <dd className="flex min-w-0 justify-end text-right break-words">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </dd>
                      </Fragment>
                    );
                  })}
                </dl>
              ) : null}
            </li>
          );
        })}
      </ul>
    </>
  );
}

/** Placeholder rows that match AdminDataTable on both layouts. */
export function AdminDataTableRowsSkeleton({ rows = 6 }: { rows?: number }) {
  const keys = Array.from({ length: rows }, (_, index) => `row-${index}`);

  return (
    <div aria-hidden>
      <div className="hidden md:block">
        <div className="h-10 border-b bg-background-200" />
        {keys.map((key) => (
          <div
            key={key}
            className="flex h-12 items-center gap-6 border-b px-3 last:border-0"
          >
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3.5 flex-1" />
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-3.5 w-16" />
          </div>
        ))}
      </div>
      <div className="divide-y md:hidden">
        {keys.slice(0, 4).map((key) => (
          <div key={key} className="flex flex-col gap-3 p-4">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Page-level fallback: stat tiles, a toolbar row and the table card. */
export function AdminDataTableSkeleton({ stats = 0 }: { stats?: number }) {
  const statKeys = Array.from({ length: stats }, (_, index) => `stat-${index}`);

  return (
    <div className="flex flex-col gap-4">
      {stats > 0 ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {statKeys.map((key) => (
            <Skeleton key={key} className="h-[92px] rounded-xl sm:h-[108px]" />
          ))}
        </div>
      ) : null}
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1 rounded-lg md:h-8 md:w-64 md:flex-none" />
          <Skeleton className="h-10 w-24 rounded-lg md:h-8" />
        </div>
        <div className="rounded-xl border bg-card shadow-card">
          <AdminDataTableRowsSkeleton />
        </div>
      </div>
    </div>
  );
}

/** An inline error or warning message. */
export function AdminAlert({
  children,
  className,
  tone = "error",
}: {
  children: ReactNode;
  className?: string;
  tone?: "error" | "warning";
}) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-lg border px-3 py-2 text-sm text-pretty",
        tone === "error"
          ? "border-destructive/30 bg-destructive/5 text-destructive"
          : "border-warning/40 bg-warning/10 text-foreground",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function AdminDataTablePagination({
  canNextPage,
  canPreviousPage,
  hidden = false,
  label,
  nextLabel,
  onNextPage,
  onPreviousPage,
  previousLabel,
}: {
  canNextPage: boolean;
  canPreviousPage: boolean;
  hidden?: boolean;
  label: ReactNode;
  nextLabel: ReactNode;
  onNextPage: () => void;
  onPreviousPage: () => void;
  previousLabel: ReactNode;
}) {
  if (hidden) return null;

  return (
    <div className="flex items-center justify-between gap-3 border-t px-4 py-2 text-xs text-muted-foreground tabular-nums">
      <div className="min-w-0">{label}</div>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className={adminDataTableStyles.control}
          onClick={onPreviousPage}
          disabled={!canPreviousPage}
        >
          {previousLabel}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={adminDataTableStyles.control}
          onClick={onNextPage}
          disabled={!canNextPage}
        >
          {nextLabel}
        </Button>
      </div>
    </div>
  );
}
