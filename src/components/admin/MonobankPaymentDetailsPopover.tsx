"use client";

import { Eye, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { AdminAlert } from "@/components/admin/AdminDataTableShell";
import { PaymentDetailsBody } from "@/components/admin/payment-details/PaymentDetailsBody";
import type { PaymentDetails } from "@/components/admin/payment-details/types";
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
  onCancelInvoiceCompleted,
  cancelInvoiceRequest,
  canCancelInvoice: canCancelInvoiceOverride,
  cancelButtonLabel,
  cancellingButtonLabel,
  cancelConfirmMessage,
  hideTrigger = false,
}: {
  invoiceId?: string;
  payment?: StatementItem;
  detailsSource?: PaymentDetailsSource;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onInvoiceChanged?: () => void;
  onCancelInvoiceCompleted?: () => void;
  cancelInvoiceRequest?: (invoiceId?: string) => Promise<PaymentDetails | null>;
  canCancelInvoice?: (params: {
    invoiceId?: string;
    status?: string;
  }) => boolean;
  cancelButtonLabel?: string;
  cancellingButtonLabel?: string;
  cancelConfirmMessage?: string;
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
    onCancelInvoiceCompleted,
    cancelInvoiceRequest,
    canCancelInvoice: canCancelInvoiceOverride,
    cancelConfirmMessage,
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
      <DialogContent className="gap-0 p-0 pb-[env(safe-area-inset-bottom)] sm:max-w-3xl sm:pb-0">
        <DialogHeader className="sticky top-0 z-10 gap-1 border-b bg-popover px-4 py-4 pr-12 text-left sm:px-6">
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription className="font-numeric text-xs break-all">
            {effectiveInvoiceId ?? "-"}
          </DialogDescription>
          {isLoading ? (
            <p
              aria-live="polite"
              className="inline-flex items-center gap-2 pt-1 text-xs text-muted-foreground"
            >
              <LoaderCircle className="size-3.5 animate-spin" />
              {loadingLabel}
            </p>
          ) : null}
        </DialogHeader>
        <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 sm:py-6">
          {cancellationError ? (
            <AdminAlert>{cancellationError}</AdminAlert>
          ) : null}
          <PaymentDetailsBody
            isLoading={isLoading}
            error={error}
            warning={warning}
            details={details}
            summary={payment}
          />
        </div>
        {canCancelInvoice ? (
          <div className="sticky bottom-0 flex justify-end border-t bg-background-200 px-4 py-3 sm:rounded-b-xl sm:px-6">
            <Button
              type="button"
              variant="destructive"
              className="h-10 max-sm:w-full sm:h-9"
              disabled={isCancelling}
              onClick={() => void handleCancelInvoice()}
            >
              {isCancelling ? (
                <>
                  <LoaderCircle className="animate-spin" />
                  {cancellingButtonLabel ?? t("cancelling")}
                </>
              ) : (
                (cancelButtonLabel ?? t("cancelInvoice"))
              )}
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
