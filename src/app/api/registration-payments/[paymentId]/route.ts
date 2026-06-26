import { NextResponse } from "next/server";

import { requireAdminApiAccess } from "@/lib/auth/admin-server";
import {
  createTrustedAdminHeaders,
  forwardLmsSlsRequest,
  getForwardedSessionHeaders,
  mergeHeaders,
} from "@/lib/server/lms-sls";

interface RouteContext {
  params: Promise<{ paymentId?: string }>;
}

export async function DELETE(
  request: Request,
  { params }: RouteContext,
): Promise<Response> {
  try {
    const access = await requireAdminApiAccess(request);
    if (!access.ok) return access.response;

    const { paymentId } = await params;
    const cleanPaymentId = paymentId?.trim();
    if (!cleanPaymentId) {
      return NextResponse.json(
        { error: "paymentId is required." },
        { status: 400 },
      );
    }

    return await forwardLmsSlsRequest({
      headers: mergeHeaders(
        createTrustedAdminHeaders(access.admin),
        getForwardedSessionHeaders(request.headers),
      ),
      method: "DELETE",
      path: `/api/registration-payments/${encodeURIComponent(cleanPaymentId)}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json(
      { error: `Failed to delete registration payment: ${message}` },
      { status: 500 },
    );
  }
}
