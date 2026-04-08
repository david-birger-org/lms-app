"use client";

import { CreditCard, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PurchaseRecord {
  amountMinor: number;
  createdAt: string;
  currency: string;
  description: string;
  profitAmountMinor: number | null;
  id: string;
  productNameEn: string | null;
  productNameUk: string | null;
  status: string;
}

const statusVariants: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  paid: "default",
  processing: "secondary",
  invoice_created: "outline",
  failed: "destructive",
  expired: "destructive",
  cancelled: "destructive",
  reversed: "destructive",
};

function formatPrice(priceMinor: number, currency: string, locale: string) {
  const amount = priceMinor / 100;
  return `${amount.toLocaleString(locale === "ua" ? "uk-UA" : "en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

function formatDate(value: string, locale: string) {
  return new Date(value).toLocaleDateString(
    locale === "ua" ? "uk-UA" : "en-US",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
}

export function UserPurchasesDialog({
  email,
  name,
  userId,
}: {
  email: string;
  name: string | null;
  userId: string;
}) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const locale = useLocale();
  const t = useTranslations("admin.users.purchases");
  const requestIdRef = useRef(0);

  const loadPurchases = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/users/purchases?userId=${encodeURIComponent(userId)}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );
      const payload = (await response.json()) as {
        error?: string;
        purchases?: PurchaseRecord[];
      };

      if (!response.ok) {
        throw new Error(payload.error ?? t("errors.load"));
      }

      if (requestIdRef.current !== requestId) return;
      setPurchases(Array.isArray(payload.purchases) ? payload.purchases : []);
    } catch (loadError) {
      if (requestIdRef.current !== requestId) return;
      setPurchases([]);
      setError(
        loadError instanceof Error ? loadError.message : t("errors.load"),
      );
    } finally {
      if (requestIdRef.current === requestId) {
        setIsLoading(false);
      }
    }
  }, [t, userId]);

  useEffect(() => {
    if (!open) return;
    void loadPurchases();
  }, [loadPurchases, open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t("open", { email })}
        >
          <CreditCard className="size-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {name?.trim() ? `${name} · ${email}` : email}
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {isLoading ? (
          <div className="flex min-h-40 items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 size-4 animate-spin" />
            {t("loading")}
          </div>
        ) : purchases.length === 0 ? (
          <div className="flex min-h-40 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
            {t("empty")}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("columns.product")}</TableHead>
                  <TableHead className="text-right">
                    {t("columns.amount")}
                  </TableHead>
                  <TableHead>{t("columns.status")}</TableHead>
                  <TableHead className="text-right">
                    {t("columns.date")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {locale === "ua"
                            ? (purchase.productNameUk ?? purchase.description)
                            : (purchase.productNameEn ?? purchase.description)}
                        </p>
                        {purchase.description && (
                          <p className="text-xs text-muted-foreground">
                            {purchase.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatPrice(
                        purchase.amountMinor,
                        purchase.currency,
                        locale,
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={statusVariants[purchase.status] ?? "secondary"}
                      >
                        {t(`statuses.${purchase.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {formatDate(purchase.createdAt, locale)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
