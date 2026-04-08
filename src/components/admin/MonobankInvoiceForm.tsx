"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

type SupportedCurrency = "UAH" | "USD";
const DEFAULT_EXPIRATION_MINUTES = 24 * 60;
const EXPIRATION_PRESETS = [
  { label: "15 min", minutes: 15 },
  { label: "1 hour", minutes: 60 },
  { label: "24 hours", minutes: DEFAULT_EXPIRATION_MINUTES },
] as const;

function formatExpirationPreview(validitySeconds: number) {
  if (!Number.isInteger(validitySeconds) || validitySeconds < 60) {
    return null;
  }

  return new Date(Date.now() + validitySeconds * 1000).toLocaleString();
}

interface InvoiceResult {
  expiresAt?: string;
  invoiceId?: string;
  pageUrl: string;
}

export function MonobankInvoiceForm({
  onInvoiceCreated,
}: {
  onInvoiceCreated?: () => void;
}) {
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
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InvoiceResult | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [expiresAtPreview, setExpiresAtPreview] = useState<string | null>(null);

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsCopied(false);
    setIsSubmitting(true);

    try {
      if (!Number.isInteger(validitySeconds) || validitySeconds < 60) {
        throw new Error("Expiration time must be at least 1 minute.");
      }

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

      if (!response.ok) {
        throw new Error(
          data && "error" in data ? data.error : "Request failed",
        );
      }

      const invoice = data as InvoiceResult;
      setResult(invoice);
      renewIdempotencyKey();
      onInvoiceCreated?.();

      const copied = await copyToClipboard(invoice.pageUrl);
      setIsCopied(copied);
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "Unexpected error";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCopy() {
    if (!result?.pageUrl) {
      return;
    }

    const copied = await copyToClipboard(result.pageUrl);
    setIsCopied(copied);
  }

  return (
    <Card className="shadow-xs">
      <CardHeader className="border-b px-3 sm:px-6">
        <CardTitle>Generate payment link</CardTitle>
        <CardDescription>
          Create a Monobank invoice and copy the checkout link immediately.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 px-3 pb-3 pt-4 sm:px-6 sm:pb-6">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer name</Label>
                <Input
                  className="h-9"
                  id="customerName"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Payment for coaching package"
                  className="min-h-28"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="redirectUrl">
                  Redirect URL{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
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
                  <Label htmlFor="amount">Amount</Label>
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
                  <Label>Currency</Label>
                  <Select
                    value={currency}
                    onValueChange={(value) =>
                      setCurrency(value as SupportedCurrency)
                    }
                  >
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UAH">UAH</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Expires in</Label>
                    <ToggleGroup
                      value={[selectedExpirationPreset]}
                      onValueChange={(value) => {
                        const v = value[0];
                        if (v) {
                          setSelectedExpirationPreset(v);
                        }
                      }}
                      variant="outline"
                      className="grid w-full grid-cols-3 gap-2"
                    >
                      {EXPIRATION_PRESETS.map((preset) => (
                        <ToggleGroupItem
                          key={preset.minutes}
                          value={String(preset.minutes)}
                          className="h-9 px-2 text-xs sm:text-sm"
                        >
                          {preset.label}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-lg border bg-background/70 px-3 py-2">
                    <div className="space-y-0.5">
                      <Label htmlFor="customExpirationToggle">
                        Use custom duration
                      </Label>
                      <p className="text-muted-foreground text-xs">
                        Override the presets with a custom minute value.
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
                        Custom duration (minutes)
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
                      Expires at
                    </p>
                    <p className="mt-1 text-sm">
                      {expiresAtPreview ?? "Enter at least 1 minute."}
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Default Monobank lifetime is 24 hours (
                      {DEFAULT_EXPIRATION_MINUTES} minutes).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-9 min-w-32 px-3"
            >
              {isSubmitting ? "Generating..." : "Generate invoice"}
            </Button>
            {result && (
              <Button
                type="button"
                variant="outline"
                className="h-9 px-3"
                onClick={handleCopy}
              >
                Copy link
              </Button>
            )}
            {isCopied && (
              <span className="text-sm text-emerald-600">Copied</span>
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
                Generated invoice
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
                  Expires: {new Date(result.expiresAt).toLocaleString()}
                </p>
              ) : null}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
