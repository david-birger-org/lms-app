import { createProxyRoute } from "@/lib/server/proxy-route";

const PATH = "/api/contact-requests/admin";

export const GET = createProxyRoute({
  auth: "admin",
  method: "GET",
  path: PATH,
  errorMessage: "Failed to fetch contact requests",
});

export const PUT = createProxyRoute({
  auth: "admin",
  method: "PUT",
  path: PATH,
  forwardBody: true,
  search: "incoming",
  errorMessage: "Failed to update contact request",
});
