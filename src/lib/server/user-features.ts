import "server-only";

import { headers as getRequestHeaders } from "next/headers";
import { cache } from "react";

import { requireAuthPageAccess } from "@/lib/auth/auth-server";
import {
  forwardLmsSlsRequest,
  getForwardedSessionHeaders,
  mergeHeaders,
} from "@/lib/server/lms-sls";
import { createTrustedUserHeaders } from "@/lib/server/lms-sls-user";
import { getDefaultUserPurchasesSearch } from "@/lib/server/user-purchases";

interface ActiveFeature {
  feature: string;
  grantedAt: string;
}

interface PurchasesWithFeaturesResponse {
  features?: ActiveFeature[];
}

export const getActiveFeatures = cache(async (): Promise<Set<string>> => {
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

  if (!response.ok) return new Set();

  const payload = (await response
    .json()
    .catch(() => null)) as PurchasesWithFeaturesResponse | null;

  const features = payload?.features ?? [];
  return new Set(features.map((f) => f.feature));
});
