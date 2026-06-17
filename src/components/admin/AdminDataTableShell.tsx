"use client";

import { Fragment, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const adminDataTableStyles = {
  actionRow: "flex flex-wrap items-center gap-1",
  card: "gap-0 rounded-xl py-0 shadow-xs",
  cell: "px-1.5 py-1 align-top sm:px-2",
  control: "h-7 rounded-lg px-2 text-xs",
  emptyCell: "h-24 text-center text-sm text-muted-foreground",
  footer:
    "flex items-center justify-between gap-3 border-t px-3 py-1.5 text-xs text-muted-foreground",
  footerActions: "flex items-center gap-1.5",
  headerCell: "h-6 px-1.5 py-1 sm:px-2",
  icon: "size-3",
  search: "h-7 rounded-lg text-xs md:w-64",
  select: "h-7 w-16 rounded-lg text-xs",
  sortButton: "h-7 gap-1 px-1.5 text-[11px] sm:text-xs",
  table: "text-[11px] sm:text-xs",
  toolbar: "flex flex-col gap-1.5 md:flex-row xl:justify-end",
} as const;

export function AdminDataTableCard({
  children,
  description,
  summaryItems = [],
  title,
  toolbar,
}: {
  children: ReactNode;
  description?: ReactNode;
  summaryItems?: Array<{ content: ReactNode; id: string }>;
  title: ReactNode;
  toolbar?: ReactNode;
}) {
  return (
    <Card className={adminDataTableStyles.card}>
      <CardHeader className="rounded-t-xl border-b px-3 py-2 !pb-2 sm:px-4">
        <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <CardTitle className="text-sm font-semibold sm:text-base">
                {title}
              </CardTitle>
              {summaryItems.length > 0 ? (
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground sm:text-xs">
                  {summaryItems.map((item, index) => (
                    <Fragment key={item.id}>
                      {index > 0 ? (
                        <span className="text-border">/</span>
                      ) : null}
                      <span>{item.content}</span>
                    </Fragment>
                  ))}
                </div>
              ) : null}
            </div>
            {description ? (
              <CardDescription className="text-xs">
                {description}
              </CardDescription>
            ) : null}
          </div>
          {toolbar}
        </div>
      </CardHeader>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  );
}

export function AdminDataTableScroll({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto">{children}</div>;
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
    <div className={adminDataTableStyles.footer}>
      <div>{label}</div>
      <div className={adminDataTableStyles.footerActions}>
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
