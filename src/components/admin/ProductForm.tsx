"use client";

import { useTranslations } from "next-intl";
import type { FormEvent } from "react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
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
  priceMinor: number;
  currency: string;
  imageUrl: string | null;
  active: boolean;
  sortOrder: number;
}

interface ProductFormProps {
  initialData?: Partial<ProductFormData>;
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
  const [priceDisplay, setPriceDisplay] = useState(
    initialData?.priceMinor ? String(initialData.priceMinor / 100) : "",
  );
  const [currency, setCurrency] = useState(initialData?.currency ?? "UAH");
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

    const parsedPrice = Number(priceDisplay);
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) return;

    onSubmit({
      slug: slug.trim(),
      nameEn: nameEn.trim(),
      nameUk: nameUk.trim(),
      descriptionEn: descriptionEn.trim(),
      descriptionUk: descriptionUk.trim(),
      priceMinor: Math.round(parsedPrice * 100),
      currency,
      imageUrl: imageUrl.trim() || null,
      active,
      sortOrder: Number(sortOrder) || 0,
    });
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="nameEn">{t("nameEn")}</Label>
          <Input
            className="h-9"
            id="nameEn"
            value={nameEn}
            onChange={(e) => handleNameEnChange(e.target.value)}
            placeholder={t("nameEnPlaceholder")}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nameUk">{t("nameUk")}</Label>
          <Input
            className="h-9"
            id="nameUk"
            value={nameUk}
            onChange={(e) => setNameUk(e.target.value)}
            placeholder="Онлайн коучинг"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">{t("slug")}</Label>
        <Input
          className="h-9"
          id="slug"
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setAutoSlug(false);
          }}
          placeholder="online-coaching"
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="descriptionEn">{t("descriptionEn")}</Label>
          <Textarea
            id="descriptionEn"
            value={descriptionEn}
            onChange={(e) => setDescriptionEn(e.target.value)}
            className="min-h-40"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="descriptionUk">{t("descriptionUk")}</Label>
          <Textarea
            id="descriptionUk"
            value={descriptionUk}
            onChange={(e) => setDescriptionUk(e.target.value)}
            className="min-h-40"
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="price">{t("price")}</Label>
          <Input
            className="h-9"
            id="price"
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            value={priceDisplay}
            onChange={(e) => setPriceDisplay(e.target.value)}
            placeholder="5000"
            required
          />
        </div>
        <div className="space-y-2">
          <Label>{t("currency")}</Label>
          <Select
            value={currency}
            onValueChange={(value) => setCurrency(value as string)}
          >
            <SelectTrigger className="h-9 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="UAH">UAH</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="sortOrder">{t("sortOrder")}</Label>
          <Input
            className="h-9"
            id="sortOrder"
            type="number"
            inputMode="numeric"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="imageUrl">
          {t("imageUrl")}{" "}
          <span className="font-normal text-muted-foreground">
            {t("optional")}
          </span>
        </Label>
        <Input
          className="h-9"
          id="imageUrl"
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://..."
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border px-3 py-2">
        <div className="space-y-0.5">
          <Label htmlFor="activeToggle">{t("active")}</Label>
          <p className="text-xs text-muted-foreground">{t("activeHint")}</p>
        </div>
        <Switch
          id="activeToggle"
          checked={active}
          onCheckedChange={setActive}
        />
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isSubmitting} className="h-9 min-w-28">
          {isSubmitting ? t("saving") : submitLabel}
        </Button>
      </div>
    </form>
  );
}
