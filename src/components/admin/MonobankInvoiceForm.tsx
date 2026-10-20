"use client";

import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  Loader2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { FormEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { AdminAlert } from "@/components/admin/AdminDataTableShell";
import { DataList, type DataListColumn } from "@/components/shell/data-list";
import {
  getPaymentBadgeStatus,
  StatusBadge,
} from "@/components/shell/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useIdempotencyKey } from "@/hooks/use-idempotency-key";
import { copyToClipboard } from "@/lib/clipboard";
import { formatMonobankDate, formatMonobankMoney } from "@/lib/monobank";
import { cn } from "@/lib/utils";

// Inputs are 40px tall on touch screens.
const fieldClass = "h-10 md:h-9";

type SupportedCurrency = "UAH" | "USD";
const DEFAULT_EXPIRATION_MINUTES = 24 * 60;
const EXPIRATION_PRESET_KEYS = [
  { key: "15min" as const, minutes: 15 },
  { key: "1hour" as const, minutes: 60 },
  { key: "24hours" as const, minutes: DEFAULT_EXPIRATION_MINUTES },
];

function formatExpirationPreview(validitySeconds: number) {
  if (!Number.isInteger(validitySeconds) || validitySeconds < 60) return null;
  return new Date(Date.now() + validitySeconds * 1000).toLocaleString();
}

interface InvoiceResult {
  expiresAt?: string;
  invoiceId?: string;
  pageUrl: string;
}

interface DuplicateInvoice {
  amount: number;
  ccy: string;
  customerName: string;
  date: string;
  destination: string;
  invoiceId?: string;
  status?: string;
}

async function fetchDuplicates(customerName: string) {
  const response = await fetch(
    `/api/payments/history?customerName=${encodeURIComponent(customerName)}`,
    { cache: "no-store" },
  );

  if (!response.ok) return [];

  const data = (await response.json()) as { list?: DuplicateInvoice[] };
  return Array.isArray(data.list) ? data.list : [];
}

export function MonobankInvoiceForm({
  onInvoiceCreated,
}: {
  onInvoiceCreated?: () => void;
}) {
  const t = useTranslations("admin.invoiceForm");
  const [customerName, setCustomerName] = useState("");
  const [description, setDescription] = useState("");
  const [redirectUrl, setRedirectUrl] = useState("");
  const [amount, setAmount] = useState("100");
  const [currency, setCurrency] = useState<SupportedCurrency>("UAH");
  const [selectedExpirationPreset, setSelectedExpirationPreset] = useState(
    String(DEFAULT_EXPIRATION_MINUTES),
  );
  const [customExpirationMinutes, setCustomExpirationMinutes] = useState(
    String(DEFAULT_EXPIRATION_MINUTES),
  );
  const [useCustomExpiration, setUseCustomExpiration] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InvoiceResult | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [expiresAtPreview, setExpiresAtPreview] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateInvoice[]>([]);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const pendingSubmitRef = useRef<(() => void) | null>(null);

  const parsedAmount = Number(amount);
  const expirationMinutes = useCustomExpiration
    ? customExpirationMinutes
    : selectedExpirationPreset;
  const parsedExpirationMinutes = Number(expirationMinutes);
  const validitySeconds = Math.round(parsedExpirationMinutes * 60);
  const paymentIntentScope = JSON.stringify({
    amount,
    customExpirationMinutes,
    currency,
    customerName,
    description,
    expirationMinutes,
    redirectUrl,
    useCustomExpiration,
  });
  const { idempotencyKey, renewIdempotencyKey } =
    useIdempotencyKey(paymentIntentScope);

  useEffect(() => {
    setExpiresAtPreview(formatExpirationPreview(validitySeconds));
  }, [validitySeconds]);

  const submitInvoice = useCallback(async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/monobank/invoice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "idempotency-key": idempotencyKey,
        },
        body: JSON.stringify({
          customerName,
          description,
          amount: parsedAmount,
          currency,
          validitySeconds,
          redirectUrl: redirectUrl.trim() || undefined,
        }),
      });

      const data = (await response.json()) as
        | InvoiceResult
        | { error?: string };

      if (!response.ok)
        throw new Error(
          data && "error" in data ? data.error : t("requestFailed"),
        );

      const invoice = data as InvoiceResult;
      setResult(invoice);
      renewIdempotencyKey();
      onInvoiceCreated?.();

      const copied = await copyToClipboard(invoice.pageUrl);
      setIsCopied(copied);
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : t("unexpectedError");
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    currency,
    customerName,
    description,
    idempotencyKey,
    onInvoiceCreated,
    parsedAmount,
    redirectUrl,
    renewIdempotencyKey,
    t,
    validitySeconds,
  ]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsCopied(false);

    if (!Number.isInteger(validitySeconds) || validitySeconds < 60) {
      setError(t("expirationError"));
      return;
    }

    setIsChecking(true);

    try {
      const found = await fetchDuplicates(customerName);

      if (found.length > 0) {
        setDuplicates(found);
        pendingSubmitRef.current = () => void submitInvoice();
        setShowDuplicateDialog(true);
        return;
      }

      await submitInvoice();
    } catch {
      await submitInvoice();
    } finally {
      setIsChecking(false);
    }
  }

  function handleDuplicateConfirm() {
    setShowDuplicateDialog(false);
    pendingSubmitRef.current?.();
    pendingSubmitRef.current = null;
  }

  function handleDuplicateCancel() {
    setShowDuplicateDialog(false);
    pendingSubmitRef.current = null;
  }

  async function handleCopy() {
    if (!result?.pageUrl) return;
    const copied = await copyToClipboard(result.pageUrl);
    setIsCopied(copied);
  }

  const isBusy = isSubmitting || isChecking;
  const submitLabel = isChecking
    ? t("checking")
    : isSubmitting
      ? t("generating")
      : t("generateInvoice");
  const duplicateColumns: DataListColumn<DuplicateInvoice>[] = [
    {
      id: "description",
      header: t("duplicateDialog.descriptionCol"),
      mobile: "title",
      className: "max-w-48",
      cell: (item) => (
        <span className="block truncate">{item.destination || "-"}</span>
      ),
    },
    {
      id: "date",
      header: t("duplicateDialog.date"),
      cell: (item) => (
        <span className="font-numeric text-xs text-muted-foreground">
          {formatMonobankDate(item.date)}
        </span>
      ),
    },
    {
      id: "status",
      header: t("duplicateDialog.status"),
      cell: (item) => (
        <StatusBadge status={getPaymentBadgeStatus(item.status)}>
          {item.status ?? "-"}
        </StatusBadge>
      ),
    },
    {
      id: "amount",
      header: t("duplicateDialog.amount"),
      align: "end",
      mobile: "trailing",
      cell: (item) => (
        <span className="font-numeric font-medium">
          {formatMonobankMoney(item.amount, item.ccy)}
        </span>
      ),
    },
  ];

  return (
    <>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="rounded-xl border bg-card text-card-foreground shadow-card">
          <div className="flex flex-col gap-1 border-b px-4 py-4 sm:px-6">
            <h2 className="text-base font-semibold tracking-tight">
              {t("title")}
            </h2>
            <p className="text-sm text-pretty text-muted-foreground">
              {t("description")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 md:divide-x">
            <div className="flex flex-col gap-5 p-4 sm:p-6">
              <div className="flex flex-col gap-2">
                <Label htmlFor="customerName">{t("customerName")}</Label>
                <Input
                  className={fieldClass}
                  id="customerName"
                  autoComplete="off"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder={t("customerNamePlaceholder")}
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="description">{t("descriptionLabel")}</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder={t("descriptionPlaceholder")}
                  className="min-h-24"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="redirectUrl">
                  {t("redirectUrl")}
                  <span className="font-normal text-muted-foreground">
                    {t("optional")}
                  </span>
                </Label>
                <Input
                  className={fieldClass}
                  id="redirectUrl"
                  type="url"
                  inputMode="url"
                  value={redirectUrl}
                  onChange={(event) => setRedirectUrl(event.target.value)}
                  placeholder="https://example.com/thank-you"
                />
              </div>
            </div>

            <div className="flex flex-col gap-5 border-t p-4 sm:p-6 md:border-t-0">
              <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="amount">{t("amount")}</Label>
                  <Input
                    className={cn(fieldClass, "font-numeric")}
                    id="amount"
                    type="number"
                    inputMode="decimal"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="currency">{t("currency")}</Label>
                  <Select
                    value={currency}
                    onValueChange={(value) =>
                      setCurrency(value as SupportedCurrency)
                    }
                  >
                    <SelectTrigger
                      id="currency"
                      className={cn(fieldClass, "w-full font-numeric")}
                    >
                      <SelectValue placeholder={t("selectCurrency")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UAH">UAH</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label>{t("expiresIn")}</Label>
                <ToggleGroup
                  type="single"
                  value={selectedExpirationPreset}
                  onValueChange={(value) => {
                    if (value) setSelectedExpirationPreset(value);
                  }}
                  variant="outline"
                  disabled={useCustomExpiration}
                  className="grid w-full grid-cols-3"
                >
                  {EXPIRATION_PRESET_KEYS.map((preset) => (
                    <ToggleGroupItem
                      key={preset.minutes}
                      value={String(preset.minutes)}
                      className="h-10 md:h-9"
                    >
                      {t(`presets.${preset.key}`)}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <Label htmlFor="customExpirationToggle">
                    {t("useCustomDuration")}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t("useCustomDurationHint")}
                  </p>
                </div>
                <Switch
                  id="customExpirationToggle"
                  checked={useCustomExpiration}
                  onCheckedChange={setUseCustomExpiration}
                />
              </div>

              {useCustomExpiration ? (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="customExpirationMinutes">
                    {t("customDurationLabel")}
                  </Label>
                  <Input
                    className={cn(fieldClass, "font-numeric")}
                    id="customExpirationMinutes"
                    type="number"
                    inputMode="numeric"
                    min="1"
                    step="1"
                    value={customExpirationMinutes}
                    onChange={(event) =>
                      setCustomExpirationMinutes(event.target.value)
                    }
                    required
                  />
                </div>
              ) : null}

              <div className="flex flex-col gap-1 rounded-lg bg-background-200 px-3 py-2.5">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">
                    {t("expiresAt")}
                  </span>
                  <span className="font-numeric text-right text-xs">
                    {expiresAtPreview ?? t("enterAtLeast1Minute")}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("defaultLifetime", {
                    minutes: DEFAULT_EXPIRATION_MINUTES,
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 rounded-b-xl border-t bg-background-200 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-6 md:static md:pb-3">
            <Button
              type="submit"
              disabled={isBusy}
              className="h-10 w-full md:h-9 md:w-auto"
            >
              {isBusy ? <Loader2 className="animate-spin" /> : null}
              {submitLabel}
            </Button>
          </div>
        </div>

        {error ? <AdminAlert>{error}</AdminAlert> : null}
      </form>

      {result ? (
        <div
          aria-live="polite"
          className="animate-enter flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-card sm:p-5"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="inline-flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 className="size-4 text-success" />
              {t("generatedInvoice")}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 shrink-0 md:h-8"
              onClick={handleCopy}
            >
              {isCopied ? <Check className="text-success" /> : <Copy />}
              {isCopied ? t("copied") : t("copyLink")}
            </Button>
          </div>
          <a
            href={result.pageUrl}
            target="_blank"
            rel="noreferrer"
            className="font-numeric text-xs break-all underline-offset-4 hover:underline"
          >
            {result.pageUrl}
          </a>
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 text-xs">
            {result.invoiceId ? (
              <>
                <dt className="text-muted-foreground">invoiceId</dt>
                <dd className="font-numeric break-all">{result.invoiceId}</dd>
              </>
            ) : null}
            {result.expiresAt ? (
              <>
                <dt className="text-muted-foreground">{t("expires")}</dt>
                <dd className="font-numeric">
                  {new Date(result.expiresAt).toLocaleString()}
                </dd>
              </>
            ) : null}
          </dl>
        </div>
      ) : null}

      <Dialog
        open={showDuplicateDialog}
        onOpenChange={(open) => {
          if (!open) handleDuplicateCancel();
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader className="pr-8">
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-warning" />
              {t("duplicateDialog.title")}
            </DialogTitle>
            <DialogDescription>
              {t("duplicateDialog.description", {
                name: customerName,
                count: duplicates.length,
              })}
            </DialogDescription>
          </DialogHeader>

          <DataList
            className="shadow-none"
            items={duplicates}
            getKey={(item) =>
              item.invoiceId ??
              `${item.date}-${item.amount}-${item.destination}`
            }
            columns={duplicateColumns}
          />

          <DialogFooter>
            <Button
              variant="outline"
              className="h-10 sm:h-9"
              onClick={handleDuplicateCancel}
            >
              {t("duplicateDialog.cancel")}
            </Button>
            <Button className="h-10 sm:h-9" onClick={handleDuplicateConfirm}>
              {t("duplicateDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
