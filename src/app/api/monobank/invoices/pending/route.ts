import { createProxyRoute } from "@/lib/server/proxy-route";

export const GET = createProxyRoute({
  auth: "admin",
  method: "GET",
  path: "/api/monobank/invoices/pending",
  search: "incoming",
  errorMessage: "Failed to load pending invoices",
});
