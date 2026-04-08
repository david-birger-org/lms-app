import type { MonobankCurrency } from "@/lib/monobank";

export interface PaymentDetails {
  invoiceId?: string;
  status?: string;
  failureReason?: number | string;
  errCode?: number | string;
  amount?: number;
  ccy?: MonobankCurrency;
  currency?: MonobankCurrency;
  profitAmount?: number;
  createdDate?: string;
  modifiedDate?: string;
  reference?: string;
  destination?: string;
  customerName?: string;
  expiresAt?: string;
  pageUrl?: string;
  paymentInfo?: {
    maskedPan?: string;
    approvalCode?: string;
    rrn?: string;
    tranId?: string;
    terminal?: string;
    bank?: string;
    paymentSystem?: string;
    fee?: number;
    country?: string;
  };
  error?: string;
}
