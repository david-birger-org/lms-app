import { ExternalLink, ReceiptText } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminRegistrationPaymentRecord } from "@/lib/server/admin-registration-payments";

const paidStatuses = new Set(["paid"]);
const pendingStatuses = new Set([
  "creating_invoice",
  "invoice_created",
  "processing",
]);
const failedStatuses = new Set([
  "cancelled",
  "creation_failed",
  "expired",
  "failed",
  "reversed",
]);

function formatMoney(amountMinor: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    currency,
    style: "currency",
  }).format(amountMinor / 100);
}

function formatDateTime(value?: string) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusVariant(status: string) {
  if (paidStatuses.has(status)) return "default";
  if (failedStatuses.has(status)) return "destructive";
  return "secondary";
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card className="shadow-xs">
      <CardHeader className="p-4">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

export async function RegistrationPaymentsTable({
  payments,
}: {
  payments: AdminRegistrationPaymentRecord[];
}) {
  const t = await getTranslations("admin.registrationPayments");
  const paidCount = payments.filter((payment) =>
    paidStatuses.has(payment.status),
  ).length;
  const pendingCount = payments.filter((payment) =>
    pendingStatuses.has(payment.status),
  ).length;
  const totalAmount = payments
    .filter((payment) => paidStatuses.has(payment.status))
    .reduce((sum, payment) => sum + payment.amountMinor, 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <StatCard label={t("stats.total")} value={payments.length} />
        <StatCard label={t("stats.paid")} value={paidCount} />
        <StatCard
          label={t("stats.paidAmount")}
          value={formatMoney(totalAmount, "UAH")}
        />
      </div>
      <Card className="shadow-xs">
        <CardHeader className="border-b px-3 sm:px-6">
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>
            {t("description", { pending: pendingCount })}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {payments.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {t("empty")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-3 sm:pl-6">
                      {t("columns.participant")}
                    </TableHead>
                    <TableHead>{t("columns.amount")}</TableHead>
                    <TableHead>{t("columns.status")}</TableHead>
                    <TableHead>{t("columns.invoice")}</TableHead>
                    <TableHead>{t("columns.receipt")}</TableHead>
                    <TableHead>{t("columns.externalRef")}</TableHead>
                    <TableHead className="pr-3 whitespace-nowrap sm:pr-6">
                      {t("columns.created")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => {
                    const checkHref = payment.checkTaxUrl ?? payment.checkFile;

                    return (
                      <TableRow key={payment.paymentId}>
                        <TableCell className="pl-3 align-top sm:pl-6">
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">
                              {payment.customerName || t("unknownName")}
                            </span>
                            <a
                              href={`mailto:${payment.customerEmail}`}
                              className="text-xs text-muted-foreground hover:underline"
                            >
                              {payment.customerEmail}
                            </a>
                            <Badge variant="outline" className="w-fit">
                              {t(`sources.${payment.source}`, {
                                fallback: payment.source,
                              })}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="align-top whitespace-nowrap font-medium">
                          {formatMoney(payment.amountMinor, payment.currency)}
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="flex max-w-[180px] flex-col gap-1">
                            <Badge
                              variant={statusVariant(payment.status)}
                              className="w-fit"
                            >
                              {t(`statuses.${payment.status}`, {
                                fallback: payment.status,
                              })}
                            </Badge>
                            {payment.failureReason ? (
                              <span className="text-xs text-destructive">
                                {payment.failureReason}
                              </span>
                            ) : payment.providerStatus ? (
                              <span className="text-xs text-muted-foreground">
                                {payment.providerStatus}
                              </span>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="align-top text-sm">
                          {payment.pageUrl ? (
                            <a
                              href={payment.pageUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex max-w-[180px] items-center gap-1.5 truncate text-primary hover:underline"
                            >
                              <ExternalLink className="size-3.5 shrink-0" />
                              <span className="truncate">
                                {payment.invoiceId ?? payment.pageUrl}
                              </span>
                            </a>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="align-top text-sm">
                          {checkHref ? (
                            <a
                              href={checkHref}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex max-w-[180px] items-center gap-1.5 truncate text-primary hover:underline"
                            >
                              <ReceiptText className="size-3.5 shrink-0" />
                              <span className="truncate">
                                {payment.checkStatus ?? payment.checkId}
                              </span>
                            </a>
                          ) : payment.checkStatus ? (
                            <Badge variant="outline">
                              {payment.checkStatus}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="flex max-w-[220px] flex-col gap-1">
                            <span className="truncate text-sm">
                              {payment.externalRef}
                            </span>
                            <span className="truncate text-xs text-muted-foreground">
                              {payment.paymentId}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="pr-3 align-top text-xs whitespace-nowrap text-muted-foreground sm:pr-6">
                          {formatDateTime(payment.paymentCreatedAt)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
