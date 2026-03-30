"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

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
import { Textarea } from "@/components/ui/textarea";
import { useIdempotencyKey } from "@/hooks/use-idempotency-key";
import { copyToClipboard } from "@/lib/clipboard";

type SupportedCurrency = "UAH" | "USD";
type OutputMode = "link" | "qr";
const DEFAULT_EXPIRATION_MINUTES = 24 * 60;

interface InvoiceResult {
  expiresAt?: string;
  invoiceId?: string;
  pageUrl: string;
  qrCodeDataUrl?: string;
}

export function MonobankInvoiceForm({
  onInvoiceCreated,
}: {
  onInvoiceCreated?: () => void;
}) {
  const [customerName, setCustomerName] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("100");
  const [currency, setCurrency] = useState<SupportedCurrency>("UAH");
  const [expirationMinutes, setExpirationMinutes] = useState(
    String(DEFAULT_EXPIRATION_MINUTES),
  );
  const [output, setOutput] = useState<OutputMode>("link");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InvoiceResult | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const parsedAmount = useMemo(() => Number(amount), [amount]);
  const parsedExpirationMinutes = useMemo(
    () => Number(expirationMinutes),
    [expirationMinutes],
  );
  const validitySeconds = useMemo(
    () => Math.round(parsedExpirationMinutes * 60),
    [parsedExpirationMinutes],
  );
  const paymentIntentScope = useMemo(
    () =>
      JSON.stringify({
        amount,
        currency,
        customerName,
        description,
        expirationMinutes,
        output,
      }),
    [amount, currency, customerName, description, expirationMinutes, output],
  );
  const { idempotencyKey, renewIdempotencyKey } =
    useIdempotencyKey(paymentIntentScope);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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
          output,
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
        <CardTitle>Generate payment link or QR</CardTitle>
        <CardDescription>
          Create a Monobank invoice, copy the checkout link immediately, or
          share the generated QR code.
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

                <div className="space-y-2">
                  <Label>Generate</Label>
                  <Select
                    value={output}
                    onValueChange={(value) => setOutput(value as OutputMode)}
                  >
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue placeholder="Select output mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="link">Payment link</SelectItem>
                      <SelectItem value="qr">QR code</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expirationMinutes">
                    Expires in (minutes)
                  </Label>
                  <Input
                    className="h-9"
                    id="expirationMinutes"
                    type="number"
                    inputMode="numeric"
                    min="1"
                    step="1"
                    value={expirationMinutes}
                    onChange={(event) =>
                      setExpirationMinutes(event.target.value)
                    }
                    required
                  />
                  <p className="text-muted-foreground text-xs">
                    Default Monobank lifetime is 24 hours (
                    {DEFAULT_EXPIRATION_MINUTES} minutes).
                  </p>
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
          <div className="grid gap-4 rounded-lg border bg-muted/20 p-4 lg:grid-cols-[1fr_auto] lg:items-start">
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
            {result.qrCodeDataUrl && (
              <div className="pt-1">
                <Image
                  src={result.qrCodeDataUrl}
                  alt="Monobank payment QR code"
                  width={192}
                  height={192}
                  unoptimized
                  className="h-40 w-40 rounded-lg border bg-background p-2 sm:h-48 sm:w-48"
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
