"use client";

import { Mail, MessageSquare, Phone, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { AdminContactRequestRecord } from "@/lib/server/admin-contact-requests";

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

  return (
    <Card className="shadow-xs">
      <CardHeader className="flex flex-col gap-3 border-b px-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="space-y-1.5">
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </div>
        <ToggleGroup
          aria-label={t("filter.label")}
          value={[filter]}
          onValueChange={(value) => {
            const next = value[0] as RequestsFilter | undefined;
            if (next) setFilter(next);
          }}
          variant="outline"
          className="self-start sm:self-auto"
        >
          <ToggleGroupItem value="all" className="h-8 px-3 text-xs">
            {t("filter.all")}
          </ToggleGroupItem>
          <ToggleGroupItem value="new" className="h-8 px-3 text-xs">
            {t("filter.new")}
          </ToggleGroupItem>
          <ToggleGroupItem value="processed" className="h-8 px-3 text-xs">
            {t("filter.processed")}
          </ToggleGroupItem>
        </ToggleGroup>
      </CardHeader>
      <CardContent className="p-0">
        {visibleRequests.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            {t("empty")}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-3 sm:pl-6">
                  {t("columns.processed")}
                </TableHead>
                <TableHead>{t("columns.type")}</TableHead>
                <TableHead>{t("columns.contact")}</TableHead>
                <TableHead>{t("columns.reach")}</TableHead>
                <TableHead>{t("columns.message")}</TableHead>
                <TableHead className="pr-3 whitespace-nowrap sm:pr-6">
                  {t("columns.received")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleRequests.map((request) => {
                const fullName =
                  `${request.firstName ?? ""} ${request.lastName ?? ""}`.trim();
                const isPending = pendingIds.has(request.id);

                return (
                  <TableRow
                    key={request.id}
                    className={request.processed ? "opacity-60" : undefined}
                  >
                    <TableCell className="pl-3 align-top sm:pl-6">
                      <Checkbox
                        checked={request.processed}
                        disabled={isPending}
                        onCheckedChange={(value) =>
                          void handleToggle(request.id, !!value)
                        }
                        aria-label={t("toggleLabel")}
                      />
                    </TableCell>
                    <TableCell className="align-top">
                      <Badge
                        variant={
                          request.requestType === "service"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {t(`types.${request.requestType}`)}
                      </Badge>
                      {request.service ? (
                        <p className="mt-1 max-w-[220px] text-xs text-muted-foreground">
                          {request.service}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="flex items-start gap-2">
                        <User className="mt-0.5 size-3.5 text-muted-foreground" />
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium">
                            {fullName || t("unknownName")}
                          </span>
                          {request.country ? (
                            <span className="text-xs text-muted-foreground">
                              {request.country}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="align-top text-sm">
                      <div className="flex flex-col gap-1">
                        {request.email ? (
                          <span className="flex items-center gap-1.5">
                            <Mail className="size-3.5 text-muted-foreground" />
                            <a
                              href={`mailto:${request.email}`}
                              className="hover:underline"
                            >
                              {request.email}
                            </a>
                          </span>
                        ) : null}
                        {request.phone ? (
                          <span className="flex items-center gap-1.5">
                            <Phone className="size-3.5 text-muted-foreground" />
                            <a
                              href={`tel:${request.phone}`}
                              className="hover:underline"
                            >
                              {request.phone}
                            </a>
                          </span>
                        ) : null}
                        {request.preferredContactMethod ? (
                          <span className="text-xs text-muted-foreground">
                            {t("preferred", {
                              method: request.preferredContactMethod,
                            })}
                          </span>
                        ) : null}
                        {request.social ? (
                          <span className="flex items-center gap-1.5 text-xs">
                            <MessageSquare className="size-3.5 text-muted-foreground" />
                            {request.social}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      {request.message ? (
                        <p className="max-w-[420px] text-sm whitespace-pre-wrap break-words">
                          {request.message}
                        </p>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="pr-3 align-top text-xs whitespace-nowrap text-muted-foreground sm:pr-6">
                      {formatDateTime(request.createdAt)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
