"use client";

import { useTranslations } from "next-intl";
import type { FormEvent, ReactNode } from "react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export interface ProductFormData {
  slug: string;
  nameUk: string;
  nameEn: string;
  descriptionUk: string;
  descriptionEn: string;
  priceUahMinor: number | null;
  priceUsdMinor: number | null;
  pricingType: "fixed" | "on_request";
  imageUrl: string | null;
  active: boolean;
  sortOrder: number;
}

interface ProductFormInitialData {
  active?: boolean;
  descriptionEn?: string | null;
  descriptionUk?: string | null;
  imageUrl?: string | null;
  nameEn?: string;
  nameUk?: string;
  priceUahMinor?: number | null;
  priceUsdMinor?: number | null;
  pricingType?: "fixed" | "on_request";
  slug?: string;
  sortOrder?: number;
}

interface ProductFormProps {
  initialData?: ProductFormInitialData;
  onSubmit: (data: ProductFormData) => void;
  isSubmitting: boolean;
  submitLabel: string;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function ProductForm({
  initialData,
  onSubmit,
  isSubmitting,
  submitLabel,
}: ProductFormProps) {
  const t = useTranslations("admin.products.form");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [nameEn, setNameEn] = useState(initialData?.nameEn ?? "");
  const [nameUk, setNameUk] = useState(initialData?.nameUk ?? "");
  const [descriptionEn, setDescriptionEn] = useState(
    initialData?.descriptionEn ?? "",
  );
  const [descriptionUk, setDescriptionUk] = useState(
    initialData?.descriptionUk ?? "",
  );
  const [pricingType, setPricingType] = useState<"fixed" | "on_request">(
    initialData?.pricingType ?? "fixed",
  );
  const [priceUahDisplay, setPriceUahDisplay] = useState(
    initialData?.priceUahMinor ? String(initialData.priceUahMinor / 100) : "",
  );
  const [priceUsdDisplay, setPriceUsdDisplay] = useState(
    initialData?.priceUsdMinor ? String(initialData.priceUsdMinor / 100) : "",
  );
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl ?? "");
  const [active, setActive] = useState(initialData?.active ?? true);
  const [sortOrder, setSortOrder] = useState(
    String(initialData?.sortOrder ?? 0),
  );
  const [autoSlug, setAutoSlug] = useState(!initialData?.slug);

  function handleNameEnChange(value: string) {
    setNameEn(value);
    if (autoSlug) setSlug(slugify(value));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const parsedPriceUah = Number(priceUahDisplay);
    const parsedPriceUsd = Number(priceUsdDisplay);

    if (pricingType === "fixed") {
      if (!Number.isFinite(parsedPriceUah) || parsedPriceUah <= 0) return;
      if (!Number.isFinite(parsedPriceUsd) || parsedPriceUsd <= 0) return;
    }

    onSubmit({
      slug: slug.trim(),
      nameEn: nameEn.trim(),
      nameUk: nameUk.trim(),
      descriptionEn: descriptionEn.trim(),
      descriptionUk: descriptionUk.trim(),
      priceUahMinor:
        pricingType === "fixed" ? Math.round(parsedPriceUah * 100) : null,
      priceUsdMinor:
        pricingType === "fixed" ? Math.round(parsedPriceUsd * 100) : null,
      pricingType,
      imageUrl: imageUrl.trim() || null,
      active,
      sortOrder: Number(sortOrder) || 0,
    });
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("nameEn")} htmlFor="nameEn">
          <Input
            id="nameEn"
            value={nameEn}
            onChange={(e) => handleNameEnChange(e.target.value)}
            placeholder={t("nameEnPlaceholder")}
            required
          />
        </Field>
        <Field label={t("nameUk")} htmlFor="nameUk">
          <Input
            id="nameUk"
            value={nameUk}
            onChange={(e) => setNameUk(e.target.value)}
            placeholder="Онлайн коучинг"
            required
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_8rem]">
        <Field label={t("slug")} htmlFor="slug">
          <Input
            id="slug"
            className="font-numeric"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setAutoSlug(false);
            }}
            placeholder="online-coaching"
            required
          />
        </Field>
        <Field label={t("sortOrder")} htmlFor="sortOrder">
          <Input
            id="sortOrder"
            className="font-numeric"
            type="number"
            inputMode="numeric"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("descriptionEn")} htmlFor="descriptionEn">
          <Textarea
            id="descriptionEn"
            value={descriptionEn}
            onChange={(e) => setDescriptionEn(e.target.value)}
            className="min-h-32"
            required
          />
        </Field>
        <Field label={t("descriptionUk")} htmlFor="descriptionUk">
          <Textarea
            id="descriptionUk"
            value={descriptionUk}
            onChange={(e) => setDescriptionUk(e.target.value)}
            className="min-h-32"
            required
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label={t("pricingType")} htmlFor="pricingType">
          <Select
            value={pricingType}
            onValueChange={(value) =>
              setPricingType(value as "fixed" | "on_request")
            }
          >
            <SelectTrigger id="pricingType" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fixed">{t("pricingTypeFixed")}</SelectItem>
              <SelectItem value="on_request">
                {t("pricingTypeOnRequest")}
              </SelectItem>
            </SelectContent>
          </Select>
        </Field>
        {pricingType === "fixed" ? (
          <>
            <Field label={t("priceUah")} htmlFor="priceUah">
              <Input
                id="priceUah"
                className="font-numeric"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                value={priceUahDisplay}
                onChange={(e) => setPriceUahDisplay(e.target.value)}
                placeholder="5000"
                required
              />
            </Field>
            <Field label={t("priceUsd")} htmlFor="priceUsd">
              <Input
                id="priceUsd"
                className="font-numeric"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                value={priceUsdDisplay}
                onChange={(e) => setPriceUsdDisplay(e.target.value)}
                placeholder="100"
                required
              />
            </Field>
          </>
        ) : null}
      </div>

      <Field
        label={
          <>
            {t("imageUrl")}{" "}
            <span className="font-normal text-muted-foreground">
              {t("optional")}
            </span>
          </>
        }
        htmlFor="imageUrl"
      >
        <Input
          id="imageUrl"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="/images/{locale}/coworking-1.jpg"
        />
      </Field>

      <label
        htmlFor="activeToggle"
        className="flex min-h-14 items-center justify-between gap-4 rounded-lg border px-3 py-2.5"
      >
        <span className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">{t("active")}</span>
          <span className="text-xs text-muted-foreground">
            {t("activeHint")}
          </span>
        </span>
        <Switch
          id="activeToggle"
          checked={active}
          onCheckedChange={setActive}
        />
      </label>

      <DialogFooter className="mt-1">
        <DialogClose asChild>
          <Button type="button" variant="outline">
            {t("cancel")}
          </Button>
        </DialogClose>
        <Button type="submit" disabled={isSubmitting} className="min-w-28">
          {isSubmitting ? t("saving") : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

function Field({
  children,
  htmlFor,
  label,
}: {
  children: ReactNode;
  htmlFor: string;
  label: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
