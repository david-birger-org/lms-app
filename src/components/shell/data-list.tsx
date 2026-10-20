import { Fragment, type Key, type ReactNode } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface DataListColumn<T> {
  id: string;
  header: ReactNode;
  cell: (item: T) => ReactNode;
  align?: "start" | "end";
  className?: string;
  /**
   * Placement in the mobile card. "title" goes top left, "trailing" top right
   * (status, amount), "row" becomes a label and value line, "hidden" is
   * table only. Defaults to "row".
   */
  mobile?: "title" | "trailing" | "row" | "hidden";
}

/** A table from md up and a stacked card list below md. */
export function DataList<T>({
  className,
  columns,
  empty,
  getKey,
  getRowClassName,
  items,
}: {
  className?: string;
  columns: DataListColumn<T>[];
  empty?: ReactNode;
  getKey: (item: T) => Key;
  getRowClassName?: (item: T) => string | undefined;
  items: T[];
}) {
  if (items.length === 0) return empty ?? null;

  const titleColumns = columns.filter((column) => column.mobile === "title");
  const trailingColumns = columns.filter(
    (column) => column.mobile === "trailing",
  );
  const rowColumns = columns.filter(
    (column) => (column.mobile ?? "row") === "row",
  );

  return (
    <div
      data-slot="data-list"
      className={cn(
        "overflow-hidden rounded-xl border bg-card shadow-card",
        className,
      )}
    >
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.id}
                  className={cn(
                    column.align === "end" && "text-right",
                    column.className,
                  )}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={getKey(item)} className={getRowClassName?.(item)}>
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    className={cn(
                      column.align === "end" && "text-right",
                      column.className,
                    )}
                  >
                    {column.cell(item)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="divide-y md:hidden">
        {items.map((item) => (
          <li
            key={getKey(item)}
            className={cn("flex flex-col gap-3 p-4", getRowClassName?.(item))}
          >
            {titleColumns.length > 0 || trailingColumns.length > 0 ? (
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-0.5 text-sm font-medium">
                  {titleColumns.map((column) => (
                    <div key={column.id} className="min-w-0 truncate">
                      {column.cell(item)}
                    </div>
                  ))}
                </div>
                {trailingColumns.length > 0 ? (
                  <div className="flex shrink-0 items-center gap-2">
                    {trailingColumns.map((column) => (
                      <Fragment key={column.id}>{column.cell(item)}</Fragment>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
            {rowColumns.length > 0 ? (
              <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-sm">
                {rowColumns.map((column) => (
                  <Fragment key={column.id}>
                    <dt className="text-muted-foreground">{column.header}</dt>
                    <dd className="min-w-0 text-right break-words">
                      {column.cell(item)}
                    </dd>
                  </Fragment>
                ))}
              </dl>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
