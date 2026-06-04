import { createProxyRoute } from "@/lib/server/proxy-route";

// Mounted as POST but maps to the backend DELETE /api/monobank/invoice.
export const POST = createProxyRoute({
  auth: "admin",
  method: "DELETE",
  path: "/api/monobank/invoice",
  forwardBody: true,
  errorMessage: "Failed to remove invoice",
});
