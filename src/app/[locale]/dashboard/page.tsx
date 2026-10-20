import { ArrowRight, BookOpen, ShoppingBag, Wallet } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { cache, Suspense } from "react";

import { CabinetPage } from "@/components/cabinet/cabinet-page-shell";
import { DataList, type DataListColumn } from "@/components/shell/data-list";
import { EmptyState } from "@/components/shell/empty-state";
import { Section } from "@/components/shell/page";
import { StatCard } from "@/components/shell/stat-card";
import {
  getPaymentBadgeStatus,
  StatusBadge,
} from "@/components/shell/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/routing";
import { requireAuthPageAccess } from "@/lib/auth/auth-server";
import { getDashboardAccount } from "@/lib/dashboard-account";
import {
  isSuccessfulPaymentStatus,
  resolvePaymentStatus,
} from "@/lib/payments";
import { getActiveFeatures } from "@/lib/server/user-features";
import {
  listUserPurchases,
  type UserPurchaseRecord,
} from "@/lib/server/user-purchases";

const RECENT_LIMIT = 5;

// Both sections read the same list; cache dedupes it to one request.
const getPurchasesNewestFirst = cache(async () =>
  (await listUserPurchases()).toSorted((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  ),
);

function intlLocale(locale: string) {
  return locale === "ua" ? "uk-UA" : "en-US";
}

function formatAmount(amountMinor: number, currency: string, locale: string) {
  const amount = new Intl.NumberFormat(intlLocale(locale), {
    maximumFractionDigits: 2,
  }).format(amountMinor / 100);
  return `${amount} ${currency}`;
}

function formatDate(iso: string, locale: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(intlLocale(locale), {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

async function OverviewStats() {
  const [purchases, features, locale, t] = await Promise.all([
    getPurchasesNewestFirst(),
    getActiveFeatures(),
    getLocale(),
    getTranslations("dashboardHome.stats"),
  ]);
  const paid = purchases.filter((item) =>
    isSuccessfulPaymentStatus(item.status),
  );
  const latest = purchases[0];
  const hasLessons = features.has("lectures");

  return (
    <Section>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <StatCard
          label={t("purchases")}
          value={purchases.length}
          icon={ShoppingBag}
        />
        <StatCard label={t("paid")} value={paid.length} icon={Wallet} />
        <StatCard
          className="col-span-2 md:col-span-1"
          label={t("lastPurchase")}
          value={latest ? formatDate(latest.createdAt, locale) : t("never")}
        />
        <StatCard
          className="col-span-2 md:col-span-1"
          label={t("lessons")}
          icon={BookOpen}
          value={hasLessons ? t("lessonsUnlocked") : t("lessonsLocked")}
          badge={
            <StatusBadge status={hasLessons ? "success" : "neutral"}>
              {hasLessons ? t("lessonsUnlocked") : t("lessonsLocked")}
            </StatusBadge>
          }
        />
      </div>
    </Section>
  );
}

async function RecentPurchases() {
  const [purchases, locale, t, purchasesT] = await Promise.all([
    getPurchasesNewestFirst(),
    getLocale(),
    getTranslations("dashboardHome"),
    getTranslations("purchases"),
  ]);

  const columns: DataListColumn<UserPurchaseRecord>[] = [
    {
      id: "product",
      header: purchasesT("columns.product"),
      mobile: "title",
      cell: (item) =>
        (locale === "ua" ? item.productNameUk : item.productNameEn) ??
        item.description,
    },
    {
      id: "status",
      header: purchasesT("columns.status"),
      mobile: "trailing",
      cell: (item) => {
        const status = resolvePaymentStatus(item.status);
        return (
          <StatusBadge status={getPaymentBadgeStatus(item.status)}>
            {status
              ? purchasesT(`statuses.${status}`)
              : purchasesT("statuses.unknown", { status: item.status })}
          </StatusBadge>
        );
      },
    },
    {
      id: "amount",
      header: purchasesT("columns.amount"),
      align: "end",
      cell: (item) => (
        <span className="font-numeric">
          {formatAmount(item.amountMinor, item.currency, locale)}
        </span>
      ),
    },
    {
      id: "date",
      header: purchasesT("columns.date"),
      align: "end",
      cell: (item) => (
        <span className="text-muted-foreground">
          {formatDate(item.createdAt, locale)}
        </span>
      ),
    },
  ];

  return (
    <Section
      title={t("recentTitle")}
      description={t("recentDescription")}
      actions={
        purchases.length > RECENT_LIMIT ? (
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/purchases">
              {t("viewAll")}
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        ) : null
      }
    >
      <DataList
        items={purchases.slice(0, RECENT_LIMIT)}
        columns={columns}
        getKey={(item) => item.id}
        empty={
          <EmptyState
            icon={ShoppingBag}
            title={purchasesT("emptyTitle")}
            description={purchasesT("emptyDescription")}
          />
        }
      />
    </Section>
  );
}

export default async function UserDashboardPage() {
  const [t, access] = await Promise.all([
    getTranslations("dashboardHome"),
    requireAuthPageAccess(),
  ]);
  const account = getDashboardAccount(access.authenticatedUser);

  return (
    <CabinetPage
      title={t("greeting", { name: account.fullName })}
      description={t("signedInAs", {
        email: access.authenticatedUser.email ?? account.email,
      })}
      actions={
        <Button variant="outline" asChild>
          <Link href="/dashboard/purchases">{t("viewPurchases")}</Link>
        </Button>
      }
    >
      <Suspense
        fallback={
          <Section>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
              {["a", "b", "c", "d"].map((key) => (
                <Skeleton key={key} className="h-[106px] rounded-xl" />
              ))}
            </div>
          </Section>
        }
      >
        <OverviewStats />
      </Suspense>
      <Suspense
        fallback={
          <Section>
            <Skeleton className="h-64 rounded-xl" />
          </Section>
        }
      >
        <RecentPurchases />
      </Suspense>
    </CabinetPage>
  );
}
