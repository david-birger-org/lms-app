"use client";

import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FormEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useIdempotencyKey } from "@/hooks/use-idempotency-key";
import { copyToClipboard } from "@/lib/clipboard";
import { formatMonobankDate, formatMonobankMoney } from "@/lib/monobank";

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

  return (
    <>
      <Card className="shadow-xs">
        <CardHeader className="border-b px-3 sm:px-6">
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 px-3 pb-3 pt-4 sm:px-6 sm:pb-6">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="customerName">{t("customerName")}</Label>
                  <Input
                    className="h-9"
                    id="customerName"
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    placeholder={t("customerNamePlaceholder")}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">{t("descriptionLabel")}</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder={t("descriptionPlaceholder")}
                    className="min-h-28"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="redirectUrl">
                    {t("redirectUrl")}{" "}
                    <span className="text-muted-foreground font-normal">
                      {t("optional")}
                    </span>
                  </Label>
                  <Input
                    className="h-9"
                    id="redirectUrl"
                    type="url"
                    value={redirectUrl}
                    onChange={(event) => setRedirectUrl(event.target.value)}
                    placeholder="https://example.com/thank-you"
                  />
                </div>
              </div>

              <div className="rounded-lg border bg-muted/20 p-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">{t("amount")}</Label>
                    <Input
                      className="h-9"
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

                  <div className="space-y-2">
                    <Label>{t("currency")}</Label>
                    <Select
                      value={currency}
                      onValueChange={(value) =>
                        setCurrency(value as SupportedCurrency)
                      }
                    >
                      <SelectTrigger className="h-9 w-full">
                        <SelectValue placeholder={t("selectCurrency")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UAH">UAH</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>{t("expiresIn")}</Label>
                      <ToggleGroup
                        type="single"
                        value={selectedExpirationPreset}
                        onValueChange={(value) => {
                          if (value) setSelectedExpirationPreset(value);
                        }}
                        variant="outline"
                        className="grid w-full grid-cols-3 gap-2"
                      >
                        {EXPIRATION_PRESET_KEYS.map((preset) => (
                          <ToggleGroupItem
                            key={preset.minutes}
                            value={String(preset.minutes)}
                            className="h-9 px-2 text-xs sm:text-sm"
                          >
                            {t(`presets.${preset.key}`)}
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-lg border bg-background/70 px-3 py-2">
                      <div className="space-y-0.5">
                        <Label htmlFor="customExpirationToggle">
                          {t("useCustomDuration")}
                        </Label>
                        <p className="text-muted-foreground text-xs">
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
                      <div className="space-y-2">
                        <Label htmlFor="customExpirationMinutes">
                          {t("customDurationLabel")}
                        </Label>
                        <Input
                          className="h-9"
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

                    <div className="rounded-lg border bg-background/70 px-3 py-2">
                      <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-[0.18em]">
                        {t("expiresAt")}
                      </p>
                      <p className="mt-1 text-sm">
                        {expiresAtPreview ?? t("enterAtLeast1Minute")}
                      </p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {t("defaultLifetime", {
                          minutes: DEFAULT_EXPIRATION_MINUTES,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="submit"
                disabled={isBusy}
                className="h-9 min-w-32 px-3"
              >
                {isChecking
                  ? t("checking")
                  : isSubmitting
                    ? t("generating")
                    : t("generateInvoice")}
              </Button>
              {result && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 px-3"
                  onClick={handleCopy}
                >
                  {t("copyLink")}
                </Button>
              )}
              {isCopied && (
                <span className="text-sm text-emerald-600">{t("copied")}</span>
              )}
            </div>

            {error && (
              <p className="border-destructive/40 bg-destructive/5 text-destructive rounded-lg border px-3 py-2 text-sm">
                {error}
              </p>
            )}
          </form>

          {result && (
            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">
                  {t("generatedInvoice")}
                </p>
                {result.invoiceId && (
                  <p className="text-muted-foreground break-all font-mono text-xs">
                    invoiceId: {result.invoiceId}
                  </p>
                )}
                <a
                  href={result.pageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary block break-all text-sm underline underline-offset-4"
                >
                  {result.pageUrl}
                </a>
                {result.expiresAt ? (
                  <p className="text-muted-foreground text-xs">
                    {t("expires")} {new Date(result.expiresAt).toLocaleString()}
                  </p>
                ) : null}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={showDuplicateDialog}
        onOpenChange={(open) => {
          if (!open) handleDuplicateCancel();
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-500" />
              {t("duplicateDialog.title")}
            </DialogTitle>
            <DialogDescription>
              {t("duplicateDialog.description", {
                name: customerName,
                count: duplicates.length,
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-60 overflow-y-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("duplicateDialog.date")}</TableHead>
                  <TableHead>{t("duplicateDialog.descriptionCol")}</TableHead>
                  <TableHead className="text-right">
                    {t("duplicateDialog.amount")}
                  </TableHead>
                  <TableHead>{t("duplicateDialog.status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {duplicates.map((item, index) => (
                  <TableRow key={item.invoiceId ?? index}>
                    <TableCell className="whitespace-nowrap text-muted-foreground text-xs">
                      {formatMonobankDate(item.date)}
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate text-xs">
                      {item.destination || "-"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-xs">
                      {formatMonobankMoney(item.amount, item.ccy)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {item.status ?? "-"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleDuplicateCancel}>
              {t("duplicateDialog.cancel")}
            </Button>
            <Button onClick={handleDuplicateConfirm}>
              {t("duplicateDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
