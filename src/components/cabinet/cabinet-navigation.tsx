"use client";

import { useTranslations } from "next-intl";
import { use, useLayoutEffect, useRef, useState } from "react";

import { Link, usePathname } from "@/i18n/routing";
import { cabinetRoutes } from "@/lib/cabinet-routes";

const ROOT_HREF = "/dashboard";

/** Feature-gated routes stay hidden until the features promise resolves. */
function useCabinetRoutes(features?: Promise<string[]>) {
  const active = features ? use(features) : [];

  return cabinetRoutes.filter(
    (route) =>
      !("requiredFeature" in route) || active.includes(route.requiredFeature),
  );
}

function isActive(pathname: string, href: string) {
  if (href === ROOT_HREF) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Desktop project tabs under the top bar, with a sliding indicator. */
export function CabinetTabs({ features }: { features?: Promise<string[]> }) {
  const routes = useCabinetRoutes(features);
  const pathname = usePathname();
  const t = useTranslations("navigation.cabinet");
  const listRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<{
    left: number;
    width: number;
  } | null>(null);
  const [ready, setReady] = useState(false);

  // Measure the active tab after every route or tab-set change.
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname and routes change which link has aria-current.
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list || routes.length === 0) return;

    function measure() {
      const active = list?.querySelector<HTMLElement>('[aria-current="page"]');
      setIndicator(
        active ? { left: active.offsetLeft, width: active.offsetWidth } : null,
      );
    }

    measure();
    // Enable the slide only after the first position is painted.
    const frame = requestAnimationFrame(() => setReady(true));
    const observer = new ResizeObserver(measure);
    observer.observe(list);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [pathname, routes.length]);

  return (
    <nav aria-label={t("label")} className="hidden md:block">
      <div className="mx-auto max-w-6xl px-6">
        <div
          ref={listRef}
          className="no-scrollbar relative -mx-3 -mb-px flex h-11 items-center gap-1 overflow-x-auto"
        >
          {routes.map((route) => {
            const active = isActive(pathname, route.href);

            return (
              <Link
                key={route.href}
                href={route.href}
                aria-current={active ? "page" : undefined}
                className="rounded-md px-3 py-1.5 text-sm whitespace-nowrap text-muted-foreground outline-none transition-[color,background-color] duration-150 hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 aria-[current=page]:text-foreground"
              >
                {t(`routes.${route.key}.title`)}
              </Link>
            );
          })}
          {indicator ? (
            <span
              aria-hidden
              data-ready={ready}
              className="pointer-events-none absolute bottom-0 left-0 h-0.5 rounded-full bg-foreground data-[ready=true]:motion-safe:transition-[translate,width] data-[ready=true]:motion-safe:duration-150 data-[ready=true]:motion-safe:ease-out"
              style={{
                translate: `${indicator.left}px 0`,
                width: indicator.width,
              }}
            />
          ) : null}
        </div>
      </div>
    </nav>
  );
}

/** Mobile bottom tab bar, fixed above the home indicator. */
export function CabinetBottomNav({
  features,
}: {
  features?: Promise<string[]>;
}) {
  const routes = useCabinetRoutes(features);
  const pathname = usePathname();
  const t = useTranslations("navigation.cabinet");

  return (
    <nav
      aria-label={t("label")}
      className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t bg-background/90 backdrop-blur-md md:hidden"
    >
      <ul
        className="mx-auto grid h-(--bottom-nav-height) max-w-md"
        style={{
          gridTemplateColumns: `repeat(${routes.length}, minmax(0, 1fr))`,
        }}
      >
        {routes.map((route) => {
          const active = isActive(pathname, route.href);

          return (
            <li key={route.href} className="flex">
              <Link
                href={route.href}
                aria-current={active ? "page" : undefined}
                className="press flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground outline-none focus-visible:text-foreground aria-[current=page]:text-foreground"
              >
                <route.icon
                  className="size-5"
                  strokeWidth={active ? 2.25 : 1.75}
                />
                <span className="max-w-full truncate px-1">
                  {t(`routes.${route.key}.title`)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
