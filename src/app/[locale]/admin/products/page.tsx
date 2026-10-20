import { Suspense } from "react";

import { AdminListSkeleton } from "@/components/admin/admin-list-skeleton";
import { ProductsManager } from "@/components/admin/ProductsManager";
import { DashboardPage } from "@/components/dashboard/page-shell";
import { Section } from "@/components/shell/page";
import { listAdminProducts } from "@/lib/server/products";

async function ProductsContent() {
  const products = await listAdminProducts();

  return (
    <Section>
      <ProductsManager initialProducts={products} />
    </Section>
  );
}

export default function AdminProductsPage() {
  return (
    <DashboardPage route="/admin/products">
      <Suspense fallback={<AdminListSkeleton />}>
        <ProductsContent />
      </Suspense>
    </DashboardPage>
  );
}
