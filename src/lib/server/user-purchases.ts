import "server-only";

import { headers as getRequestHeaders } from "next/headers";

import { requireAuthPageAccess } from "@/lib/auth/auth-server";
import {
  forwardLmsSlsRequest,
  getForwardedSessionHeaders,
  mergeHeaders,
} from "@/lib/server/lms-sls";
import { createTrustedUserHeaders } from "@/lib/server/lms-sls-user";

export interface UserPurchaseRecord {
  amountMinor: number;
  createdAt: string;
  currency: string;
  description: string;
  id: string;
  productId: string | null;
  productImageUrl: string | null;
  productNameEn: string | null;
  productNameUk: string | null;
  productSlug: string | null;
  profitAmountMinor: number | null;
  status: string;
  updatedAt: string;
}

interface UserPurchasesResponse {
  error?: string;
  purchases?: UserPurchaseRecord[];
}

const USER_PURCHASES_ERROR_MESSAGE = "Failed to fetch purchases.";
const DEFAULT_PURCHASES_LIMIT = 100;
const DEFAULT_PURCHASES_RANGE_DAYS = 180;

export function getDefaultUserPurchasesSearch() {
  const to = new Date();
  const from = new Date(
    to.getTime() - DEFAULT_PURCHASES_RANGE_DAYS * 24 * 60 * 60 * 1000,
  );

  return `?${new URLSearchParams({
    from: from.toISOString(),
    limit: String(DEFAULT_PURCHASES_LIMIT),
    to: to.toISOString(),
  }).toString()}`;
}

export async function listUserPurchases(): Promise<UserPurchaseRecord[]> {
  const access = await requireAuthPageAccess();
  const requestHeaders = await getRequestHeaders();
  const response = await forwardLmsSlsRequest({
    headers: mergeHeaders(
      createTrustedUserHeaders(access.authenticatedUser),
      getForwardedSessionHeaders(requestHeaders),
    ),
    method: "GET",
    path: "/api/user/purchases",
    search: getDefaultUserPurchasesSearch(),
  });

  const payload = (await response
    .json()
    .catch(() => null)) as UserPurchasesResponse | null;

  if (!response.ok) {
    throw new Error(payload?.error ?? USER_PURCHASES_ERROR_MESSAGE);
  }

  return Array.isArray(payload?.purchases) ? payload.purchases : [];
}
