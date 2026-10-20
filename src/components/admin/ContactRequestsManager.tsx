"use client";

import { Inbox, Mail, MessageSquare, Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { DataList, type DataListColumn } from "@/components/shell/data-list";
import { EmptyState } from "@/components/shell/empty-state";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { AdminContactRequestRecord } from "@/lib/server/admin-contact-requests";
import { cn } from "@/lib/utils";

type RequestsFilter = "all" | "new" | "processed";

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ContactRequestsManager({
  initialRequests,
}: {
  initialRequests: AdminContactRequestRecord[];
}) {
  const [requests, setRequests] =
    useState<AdminContactRequestRecord[]>(initialRequests);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<RequestsFilter>("all");
  const t = useTranslations("admin.requests");

  const visibleRequests = useMemo(() => {
    if (filter === "all") return requests;
    const wantProcessed = filter === "processed";
    return requests.filter((request) => request.processed === wantProcessed);
  }, [filter, requests]);

  async function handleToggle(id: string, processed: boolean) {
    setPendingIds((current) => {
      const next = new Set(current);
      next.add(id);
      return next;
    });

    try {
      const response = await fetch(
        `/api/admin/contact-requests?id=${encodeURIComponent(id)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ processed }),
        },
      );
      const payload = (await response.json()) as {
        error?: string;
        request?: AdminContactRequestRecord;
      };

      if (!response.ok || !payload.request) {
        throw new Error(payload.error ?? t("errors.update"));
      }

      setRequests((current) =>
        current.map((item) =>
          item.id === payload.request?.id ? payload.request : item,
        ),
      );
      toast.success(
        processed ? t("success.processed") : t("success.unprocessed"),
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("errors.update"));
    } finally {
      setPendingIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    }
  }

  const counts = {
    all: requests.length,
    new: requests.filter((request) => !request.processed).length,
    processed: requests.filter((request) => request.processed).length,
  };

  const columns: DataListColumn<AdminContactRequestRecord>[] = [
    {
      id: "processed",
      header: t("columns.processed"),
      mobile: "trailing",
      className: "w-24",
      cell: (request) => (
        // biome-ignore lint/a11y/noLabelWithoutControl: the Radix checkbox is a button inside the label, and DataList renders each cell twice, so an id would repeat.
        <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm font-normal md:min-h-0">
          <Checkbox
            checked={request.processed}
            disabled={pendingIds.has(request.id)}
            onCheckedChange={(value) => void handleToggle(request.id, !!value)}
            aria-label={t("toggleLabel")}
          />
          <span className="text-muted-foreground md:sr-only">
            {t("filter.processed")}
          </span>
        </label>
      ),
    },
    {
      id: "contact",
      header: t("columns.contact"),
      mobile: "title",
      cell: (request) => {
        const fullName =
          `${request.firstName ?? ""} ${request.lastName ?? ""}`.trim();
        return (
          <div className="flex min-w-0 flex-col gap-0.5">
            <span
              className={cn(
                "truncate font-medium",
                request.processed && "text-muted-foreground",
              )}
            >
              {fullName || t("unknownName")}
            </span>
            {request.country ? (
              <span className="truncate text-xs font-normal text-muted-foreground">
                {request.country}
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      id: "type",
      header: t("columns.type"),
      cell: (request) => (
        <div className="flex flex-col items-end gap-1 md:items-start">
          <Badge variant="outline">{t(`types.${request.requestType}`)}</Badge>
          {request.service ? (
            <span className="max-w-56 text-xs whitespace-normal text-muted-foreground">
              {request.service}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      id: "reach",
      header: t("columns.reach"),
      cell: (request) => (
        <div className="flex flex-col items-end gap-1 text-sm md:items-start">
          {request.email ? (
            <a
              href={`mailto:${request.email}`}
              className="inline-flex min-w-0 items-center gap-1.5 break-all hover:underline"
            >
              <Mail className="size-3.5 shrink-0 text-muted-foreground" />
              {request.email}
            </a>
          ) : null}
          {request.phone ? (
            <a
              href={`tel:${request.phone}`}
              className="font-numeric inline-flex items-center gap-1.5 hover:underline"
            >
              <Phone className="size-3.5 shrink-0 text-muted-foreground" />
              {request.phone}
            </a>
          ) : null}
          {request.social ? (
            <span className="inline-flex items-center gap-1.5 text-xs">
              <MessageSquare className="size-3.5 shrink-0 text-muted-foreground" />
              {request.social}
            </span>
          ) : null}
          {request.preferredContactMethod ? (
            <span className="text-xs text-muted-foreground">
              {t("preferred", { method: request.preferredContactMethod })}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      id: "message",
      header: t("columns.message"),
      className: "min-w-72 whitespace-normal",
      cell: (request) =>
        request.message ? (
          <p className="max-w-[420px] text-left text-sm break-words whitespace-pre-wrap">
            {request.message}
          </p>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      id: "received",
      header: t("columns.received"),
      align: "end",
      cell: (request) => (
        <span className="font-numeric text-xs text-muted-foreground">
          {formatDateTime(request.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <>
      <ToggleGroup
        type="single"
        variant="outline"
        spacing={0}
        aria-label={t("filter.label")}
        value={filter}
        onValueChange={(value) => {
          if (value) setFilter(value as RequestsFilter);
        }}
      >
        {(["all", "new", "processed"] as const).map((key) => (
          <ToggleGroupItem
            key={key}
            value={key}
            className="h-10 gap-2 px-3 text-sm data-[state=on]:bg-muted data-[state=on]:text-foreground md:h-8"
          >
            {t(`filter.${key}`)}
            <span className="font-numeric text-xs text-muted-foreground">
              {counts[key]}
            </span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <DataList
        items={visibleRequests}
        getKey={(request) => request.id}
        columns={columns}
        empty={
          <EmptyState
            icon={Inbox}
            title={requests.length === 0 ? t("empty") : t("emptyFiltered")}
            description={
              requests.length === 0 ? t("emptyDescription") : undefined
            }
          />
        }
      />
    </>
  );
}
