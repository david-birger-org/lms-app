"use client";

import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { ProductForm, type ProductFormData } from "./ProductForm";

interface Product {
  id: string;
  slug: string;
  nameUk: string;
  nameEn: string;
  descriptionUk: string;
  descriptionEn: string;
  priceMinor: number;
  currency: string;
  imageUrl: string | null;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

function formatPrice(priceMinor: number, currency: string) {
  const amount = priceMinor / 100;
  return `${amount.toLocaleString("uk-UA", { minimumFractionDigits: 0 })} ${currency}`;
}

function InlinePriceCell({
  product,
  onSave,
}: {
  product: Product;
  onSave: (id: string, priceMinor: number) => Promise<void>;
}) {
  const t = useTranslations("admin.products");
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(String(product.priceMinor / 100));
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) inputRef.current?.select();
  }, [isEditing]);

  function handleCancel() {
    setValue(String(product.priceMinor / 100));
    setIsEditing(false);
  }

  async function handleSave() {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast.error(t("invalidPrice"));
      return;
    }

    const newMinor = Math.round(parsed * 100);
    if (newMinor === product.priceMinor) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(product.id, newMinor);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") handleCancel();
  }

  if (isEditing)
    return (
      <div className="flex items-center justify-end gap-1">
        <input
          ref={inputRef}
          type="number"
          step="0.01"
          min="0.01"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          className="h-7 w-24 rounded border bg-background px-2 text-right font-mono text-sm outline-none focus:ring-1 focus:ring-ring"
        />
        <span className="text-xs text-muted-foreground">
          {product.currency}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          className="size-6"
          onClick={handleSave}
          disabled={isSaving}
        >
          <Check className="size-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="size-6"
          onClick={handleCancel}
          disabled={isSaving}
        >
          <X className="size-3" />
        </Button>
      </div>
    );

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      className="inline-flex items-center gap-1 rounded px-1 py-0.5 font-mono text-sm transition-colors hover:bg-muted"
      title={t("editPrice")}
    >
      {formatPrice(product.priceMinor, product.currency)}
      <Pencil className="size-3 text-muted-foreground opacity-0 transition-opacity group-hover/row:opacity-100" />
    </button>
  );
}

export function ProductsManager() {
  const t = useTranslations("admin.products");
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch("/api/products");
      const data = (await response.json()) as {
        products?: Product[];
        error?: string;
      };

      if (!response.ok) throw new Error(data.error ?? t("errors.fetch"));

      setProducts(data.products ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("errors.load"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

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

      toast.success(t("success.created"));
      setIsCreateOpen(false);
      await fetchProducts();
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

      toast.success(t("success.updated"));
      setEditingProduct(null);
      await fetchProducts();
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

      toast.success(t("success.deleted"));
      setDeleteTarget(null);
      await fetchProducts();
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

      toast.success(
        product.active ? t("success.hidden") : t("success.visible"),
      );
      await fetchProducts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("errors.toggle"));
    }
  }

  async function handleUpdatePrice(id: string, priceMinor: number) {
    try {
      const response = await fetch(`/api/products?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceMinor }),
      });

      const result = (await response.json()) as {
        product?: Product;
        error?: string;
      };

      if (!response.ok)
        throw new Error(result.error ?? t("errors.updatePrice"));

      toast.success(t("success.priceUpdated"));
      await fetchProducts();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("errors.updatePrice"),
      );
    }
  }

  return (
    <>
      <Card className="shadow-xs">
        <CardHeader className="border-b px-3 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t("title")}</CardTitle>
              <CardDescription>{t("description")}</CardDescription>
            </div>
            <Button className="h-9 gap-2" onClick={() => setIsCreateOpen(true)}>
              <Plus className="size-4" />
              {t("addProduct")}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : products.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {t("empty")}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-3 sm:pl-6">
                    {t("columns.name")}
                  </TableHead>
                  <TableHead>{t("columns.slug")}</TableHead>
                  <TableHead className="text-right">
                    {t("columns.price")}
                  </TableHead>
                  <TableHead className="text-center">
                    {t("columns.status")}
                  </TableHead>
                  <TableHead className="text-center">
                    {t("columns.order")}
                  </TableHead>
                  <TableHead className="pr-3 text-right sm:pr-6">
                    {t("columns.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id} className="group/row">
                    <TableCell className="pl-3 sm:pl-6">
                      <div>
                        <p className="font-medium">{product.nameEn}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.nameUk}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs">{product.slug}</code>
                    </TableCell>
                    <TableCell className="text-right">
                      <InlinePriceCell
                        product={product}
                        onSave={handleUpdatePrice}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={product.active ? "default" : "secondary"}
                        className="cursor-pointer"
                        onClick={() => handleToggleActive(product)}
                      >
                        {product.active
                          ? t("status.active")
                          : t("status.hidden")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">
                      {product.sortOrder}
                    </TableCell>
                    <TableCell className="pr-3 text-right sm:pr-6">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setEditingProduct(product)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setDeleteTarget(product)}
                        >
                          <Trash2 className="size-3.5 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
        <DialogContent className="sm:max-w-sm">
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
