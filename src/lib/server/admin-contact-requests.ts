import "server-only";

import { headers as getRequestHeaders } from "next/headers";

import { requireAdminPageAccess } from "@/lib/auth/admin-server";
import {
  createTrustedAdminHeaders,
  forwardLmsSlsRequest,
  getForwardedSessionHeaders,
  mergeHeaders,
} from "@/lib/server/lms-sls";

export type ContactRequestType = "contact" | "service";

export interface AdminContactRequestRecord {
  id: string;
  requestType: ContactRequestType;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  country: string | null;
  phone: string | null;
  preferredContactMethod: string | null;
  social: string | null;
  message: string | null;
  service: string | null;
  processed: boolean;
  processedAt: string | null;
  processedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ContactRequestsResponse {
  error?: string;
  requests?: AdminContactRequestRecord[];
}

const REQUESTS_ERROR_MESSAGE = "Failed to fetch contact requests.";

export async function listAdminContactRequests(): Promise<
  AdminContactRequestRecord[]
> {
  const access = await requireAdminPageAccess();
  const requestHeaders = await getRequestHeaders();
  const response = await forwardLmsSlsRequest({
    headers: mergeHeaders(
      createTrustedAdminHeaders(access.admin),
      getForwardedSessionHeaders(requestHeaders),
    ),
    method: "GET",
    path: "/api/contact-requests/admin",
  });

  const payload = (await response
    .json()
    .catch(() => null)) as ContactRequestsResponse | null;

  if (!response.ok) {
    throw new Error(payload?.error ?? REQUESTS_ERROR_MESSAGE);
  }

  return Array.isArray(payload?.requests) ? payload.requests : [];
}
