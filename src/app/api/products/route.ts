import { createProxyRoute } from "@/lib/server/proxy-route";

const PATH = "/api/products/admin";

export const GET = createProxyRoute({
  auth: "admin",
  method: "GET",
  path: PATH,
  errorMessage: "Failed to fetch products",
});

export const POST = createProxyRoute({
  auth: "admin",
  method: "POST",
  path: PATH,
  forwardBody: true,
  errorMessage: "Failed to create product",
});

export const PUT = createProxyRoute({
  auth: "admin",
  method: "PUT",
  path: PATH,
  forwardBody: true,
  search: "incoming",
  errorMessage: "Failed to update product",
});

export const DELETE = createProxyRoute({
  auth: "admin",
  method: "DELETE",
  path: PATH,
  search: "incoming",
  errorMessage: "Failed to delete product",
});
