import { createProxyRoute } from "@/lib/server/proxy-route";

export const GET = createProxyRoute({
  auth: "admin",
  method: "GET",
  path: "/api/payments/history",
  search: "incoming",
  errorMessage: "Failed to load payment history",
});
