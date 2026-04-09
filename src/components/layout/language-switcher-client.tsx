"use client";

import { Languages } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type Locale, localeNames, locales } from "@/i18n/config";

const localeLabels: Record<Locale, string> = {
  en: "en",
  ua: "укр",
};

export function LanguageSwitcherClient() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const [hash, setHash] = useState("");

  const normalizedPathname = pathname.startsWith("/")
    ? pathname
    : `/${pathname}`;
  const segments = normalizedPathname.split("/").filter(Boolean);

  while (segments[0] && locales.includes(segments[0] as Locale)) {
    segments.shift();
  }

  const pathnameWithoutLocale = segments.length
    ? `/${segments.join("/")}`
    : "/";

  useEffect(() => {
    setHash(window.location.hash);
  }, []);

  const suffix = pathnameWithoutLocale === "/" ? "" : pathnameWithoutLocale;
  const queryAndHash = `${search ? `?${search}` : ""}${hash}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex">
          <Languages />
          {localeLabels[locale]}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((item) => (
          <DropdownMenuItem key={item} asChild>
            <a
              href={`/${item}${suffix}${queryAndHash}`}
              className={item === locale ? "font-medium" : undefined}
            >
              {localeNames[item]}
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
