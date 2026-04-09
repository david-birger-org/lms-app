"use client";

import { Eye, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { PaymentDetailsBody } from "@/components/admin/payment-details/PaymentDetailsBody";
import { usePaymentDetails } from "@/components/admin/payment-details/usePaymentDetails";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { StatementItem } from "@/lib/monobank";
import type { PaymentDetailsSource } from "@/lib/payments";

export function MonobankPaymentDetailsPopover({
  invoiceId,
  payment,
  detailsSource = "database",
  open: controlledOpen,
  onOpenChange,
  onInvoiceChanged,
  hideTrigger = false,
}: {
  invoiceId?: string;
  payment?: StatementItem;
  detailsSource?: PaymentDetailsSource;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onInvoiceChanged?: () => void;
  hideTrigger?: boolean;
}) {
  const {
    canCancelInvoice,
    cancellationError,
    details,
    effectiveInvoiceId,
    error,
    handleCancelInvoice,
    handleOpenChange,
    isCancelling,
    isLoading,
    open,
    warning,
  } = usePaymentDetails({
    invoiceId,
    payment,
    detailsSource,
    controlledOpen,
    onOpenChange,
    onInvoiceChanged,
    hideTrigger,
  });
  const t = useTranslations("admin.paymentDetails");
  const loadingLabel =
    detailsSource === "provider" ? t("loadingProvider") : t("loadingDatabase");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {hideTrigger ? null : (
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={t("openPaymentDetails")}
            disabled={!effectiveInvoiceId}
          >
            <Eye />
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-[calc(100vw-2rem)] gap-0 p-0 sm:max-w-5xl xl:max-w-6xl">
        <DialogHeader className="border-b bg-muted/20 px-4 py-4 sm:px-6 sm:py-5">
          <DialogTitle className="text-base sm:text-lg">
            {t("title")}
          </DialogTitle>
          <DialogDescription className="break-all font-mono text-[11px] sm:text-xs">
            {effectiveInvoiceId ?? "-"}
          </DialogDescription>
          {isLoading || canCancelInvoice ? (
            <div className="flex flex-wrap items-center gap-2 pt-3">
              {isLoading ? (
                <div
                  aria-live="polite"
                  className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs text-muted-foreground"
                >
                  <LoaderCircle className="size-3.5 animate-spin" />
                  {loadingLabel}
                </div>
              ) : null}
              {canCancelInvoice ? (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={isCancelling}
                  onClick={() => void handleCancelInvoice()}
                >
                  {isCancelling ? (
                    <>
                      <LoaderCircle className="animate-spin" />
                      {t("cancelling")}
                    </>
                  ) : (
                    t("cancelInvoice")
                  )}
                </Button>
              ) : null}
            </div>
          ) : null}
        </DialogHeader>
        <div className="max-h-[85vh] overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
          {cancellationError ? (
            <p className="text-destructive border-destructive/40 bg-destructive/5 mb-4 rounded-lg border px-3 py-2 text-sm">
              {cancellationError}
            </p>
          ) : null}
          <PaymentDetailsBody
            isLoading={isLoading}
            error={error}
            warning={warning}
            details={details}
            summary={payment}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
