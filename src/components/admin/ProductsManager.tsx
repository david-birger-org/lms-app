"use client";

import {
  Eye,
  EyeOff,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { DataList, type DataListColumn } from "@/components/shell/data-list";
import { EmptyState } from "@/components/shell/empty-state";
import { StatusBadge } from "@/components/shell/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AdminProductRecord } from "@/lib/server/products";

import { ProductForm, type ProductFormData } from "./ProductForm";

type Product = AdminProductRecord;

function replaceProduct(products: Product[], nextProduct: Product) {
  return products.map((item) =>
    item.id === nextProduct.id ? nextProduct : item,
  );
}

function formatPrice(priceMinor: number, currency: string) {
  const amount = priceMinor / 100;
  return `${amount.toLocaleString("uk-UA", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${currency}`;
}

function ProductPricingCell({ product }: { product: Product }) {
  const t = useTranslations("admin.products");

  if (product.pricingType === "on_request")
    return (
      <span className="text-muted-foreground">
        {t("pricingType.onRequest")}
      </span>
    );

  return (
    <div className="flex flex-col items-end gap-0.5">
      <span className="font-numeric">
        {product.priceUahMinor === null
          ? "-"
          : formatPrice(product.priceUahMinor, "UAH")}
      </span>
      <span className="font-numeric text-xs text-muted-foreground">
        {product.priceUsdMinor === null
          ? "-"
          : formatPrice(product.priceUsdMinor, "USD")}
      </span>
    </div>
  );
}

export function ProductsManager({
  initialProducts,
}: {
  initialProducts: Product[];
}) {
  const t = useTranslations("admin.products");
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleCreate(data: ProductFormData) {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = (await response.json()) as {
        product?: Product;
        error?: string;
      };

      if (!response.ok) throw new Error(result.error ?? t("errors.create"));

      if (!result.product) throw new Error(t("errors.create"));
      const nextProduct = result.product;

      setProducts((current) => [nextProduct, ...current]);
      toast.success(t("success.created"));
      setIsCreateOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("errors.createProduct"),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdate(data: ProductFormData) {
    if (!editingProduct) return;
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/products?id=${editingProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = (await response.json()) as {
        product?: Product;
        error?: string;
      };

      if (!response.ok) throw new Error(result.error ?? t("errors.update"));

      if (!result.product) throw new Error(t("errors.update"));
      const nextProduct = result.product;

      setProducts((current) => replaceProduct(current, nextProduct));
      toast.success(t("success.updated"));
      setEditingProduct(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("errors.updateProduct"),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/products?id=${deleteTarget.id}`, {
        method: "DELETE",
      });

      const result = (await response.json()) as {
        ok?: boolean;
        error?: string;
      };

      if (!response.ok) throw new Error(result.error ?? t("errors.delete"));

      setProducts((current) =>
        current.filter((item) => item.id !== deleteTarget.id),
      );
      toast.success(t("success.deleted"));
      setDeleteTarget(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("errors.deleteProduct"),
      );
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleToggleActive(product: Product) {
    try {
      const response = await fetch(`/api/products?id=${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !product.active }),
      });

      const result = (await response.json()) as {
        product?: Product;
        error?: string;
      };

      if (!response.ok) throw new Error(result.error ?? t("errors.update"));

      if (!result.product) throw new Error(result.error ?? t("errors.update"));
      const nextProduct = result.product;

      setProducts((current) => replaceProduct(current, nextProduct));
      toast.success(
        product.active ? t("success.hidden") : t("success.visible"),
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("errors.toggle"));
    }
  }

  const columns: DataListColumn<Product>[] = [
    {
      id: "name",
      header: t("columns.name"),
      mobile: "title",
      cell: (product) => (
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate font-medium">{product.nameEn}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">
            {product.nameUk}
          </span>
        </div>
      ),
    },
    {
      id: "status",
      header: t("columns.status"),
      mobile: "trailing",
      cell: (product) => (
        <StatusBadge status={product.active ? "success" : "neutral"}>
          {product.active ? t("status.active") : t("status.hidden")}
        </StatusBadge>
      ),
    },
    {
      id: "slug",
      header: t("columns.slug"),
      cell: (product) => (
        <span className="font-numeric text-xs text-muted-foreground">
          {product.slug}
        </span>
      ),
    },
    {
      id: "price",
      header: t("columns.price"),
      align: "end",
      cell: (product) => <ProductPricingCell product={product} />,
    },
    {
      id: "order",
      header: t("columns.order"),
      align: "end",
      cell: (product) => (
        <span className="font-numeric text-muted-foreground">
          {product.sortOrder}
        </span>
      ),
    },
    {
      id: "actions",
      header: <span className="sr-only">{t("columns.actions")}</span>,
      align: "end",
      mobile: "trailing",
      className: "w-12",
      cell: (product) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-10 md:size-8"
              aria-label={t("actions.menu", { name: product.nameEn })}
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onSelect={() => setEditingProduct(product)}>
              <Pencil />
              {t("actions.edit")}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => void handleToggleActive(product)}>
              {product.active ? <EyeOff /> : <Eye />}
              {product.active ? t("actions.hide") : t("actions.show")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setDeleteTarget(product)}
            >
              <Trash2 />
              {t("actions.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const addButton = (
    <Button onClick={() => setIsCreateOpen(true)}>
      <Plus data-icon="inline-start" />
      {t("addProduct")}
    </Button>
  );

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {t("count", { count: products.length })}
        </p>
        {addButton}
      </div>

      <DataList
        items={products}
        getKey={(product) => product.id}
        columns={columns}
        empty={
          <EmptyState
            icon={Package}
            title={t("emptyTitle")}
            description={t("emptyDescription")}
            action={addButton}
          />
        }
      />

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("dialogs.create.title")}</DialogTitle>
            <DialogDescription>
              {t("dialogs.create.description")}
            </DialogDescription>
          </DialogHeader>
          <ProductForm
            onSubmit={handleCreate}
            isSubmitting={isSubmitting}
            submitLabel={t("dialogs.create.submit")}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={editingProduct !== null}
        onOpenChange={(open) => {
          if (!open) setEditingProduct(null);
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("dialogs.edit.title")}</DialogTitle>
            <DialogDescription>
              {t("dialogs.edit.description")}
            </DialogDescription>
          </DialogHeader>
          {editingProduct && (
            <ProductForm
              initialData={editingProduct}
              onSubmit={handleUpdate}
              isSubmitting={isSubmitting}
              submitLabel={t("dialogs.edit.submit")}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("dialogs.delete.title")}</DialogTitle>
            <DialogDescription>
              {t("dialogs.delete.description", {
                name: deleteTarget?.nameEn ?? "",
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              {t("dialogs.delete.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting
                ? t("dialogs.delete.deleting")
                : t("dialogs.delete.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
