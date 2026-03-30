"use client";

import { useCallback, useState } from "react";

import { MonobankInvoiceForm } from "@/components/admin/MonobankInvoiceForm";
import { MonobankPendingInvoices } from "@/components/admin/MonobankPendingInvoices";

export function MonobankInvoiceWorkspace() {
  const [refreshToken, setRefreshToken] = useState(0);

  const refreshPendingInvoices = useCallback(() => {
    setRefreshToken((current) => current + 1);
  }, []);

  return (
    <div className="space-y-4">
      <MonobankInvoiceForm onInvoiceCreated={refreshPendingInvoices} />
      <MonobankPendingInvoices key={refreshToken} />
    </div>
  );
}
