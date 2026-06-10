import "server-only";

import { headers as getRequestHeaders } from "next/headers";

import { requireAdminPageAccess } from "@/lib/auth/admin-server";
import {
  createTrustedAdminHeaders,
  forwardLmsSlsRequest,
  getForwardedSessionHeaders,
  mergeHeaders,
} from "@/lib/server/lms-sls";

export interface AdminRegistrationPaymentRecord {
  id: string;
  paymentId: string;
  source: string;
  externalRef: string;
  customerName: string;
  customerEmail: string;
  amountMinor: number;
  currency: string;
  description: string;
  status: string;
  providerStatus?: string;
  invoiceId?: string;
  pageUrl?: string;
  failureReason?: string;
  productSlug?: string;
  paymentCreatedAt: string;
  paymentUpdatedAt: string;
  providerModifiedAt?: string;
  registrationCreatedAt: string;
  checkId?: string;
  checkStatus?: string;
  checkTaxUrl?: string;
  checkFile?: string;
  checkUpdatedAt?: string;
}

interface RegistrationPaymentsResponse {
  error?: string;
  payments?: AdminRegistrationPaymentRecord[];
}

const REGISTRATION_PAYMENTS_ERROR_MESSAGE =
  "Failed to fetch registration payments.";

export async function listAdminRegistrationPayments(): Promise<
  AdminRegistrationPaymentRecord[]
> {
  const access = await requireAdminPageAccess();
  const requestHeaders = await getRequestHeaders();
  const response = await forwardLmsSlsRequest({
    headers: mergeHeaders(
      createTrustedAdminHeaders(access.admin),
      getForwardedSessionHeaders(requestHeaders),
    ),
    method: "GET",
    path: "/api/registration-payments",
  });

  const payload = (await response
    .json()
    .catch(() => null)) as RegistrationPaymentsResponse | null;

  if (!response.ok) {
    throw new Error(payload?.error ?? REGISTRATION_PAYMENTS_ERROR_MESSAGE);
  }

  return Array.isArray(payload?.payments) ? payload.payments : [];
}
