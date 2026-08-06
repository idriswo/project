"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/dashboard/empty-state";
import { type Overview, OverviewCards } from "@/components/dashboard/overview-cards";
import { Link, useRouter } from "@/i18n/navigation";
import { clearActiveTenantId } from "@/lib/activeTenant";
import { fetchApi } from "@/lib/apiClient";
import { supabase } from "@/lib/supabase";

interface MeResponse {
  tenant: { name: string } | null;
}

/**
 * Ҳолати "холӣ" бо `productsCount === 0 && salesCount === 0` муайян
 * мешавад — соддатарин сигнали воқеӣ барои "ин дӯкон ҳанӯз кор накардааст".
 */
export function DashboardView() {
  const t = useTranslations("dashboard");
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [tenantName, setTenantName] = useState("");
  const [productsCount, setProductsCount] = useState(0);
  const [usersCount, setUsersCount] = useState(1);
  const [overview, setOverview] = useState<Overview | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // allSettled, а не all: упавший отчёт не должен прятать название
      // магазина, а отсутствие товаров — ломать всё остальное.
      const [me, products, users, overviewData] = await Promise.allSettled([
        fetchApi("/me") as Promise<MeResponse>,
        fetchApi("/inventory/products?limit=1") as Promise<{ total: number }>,
        fetchApi("/users"),
        fetchApi("/reports/overview?period=month") as Promise<Overview>,
      ]);

      if (cancelled) return;

      setTenantName(me.status === "fulfilled" ? (me.value?.tenant?.name ?? "") : "");
      setProductsCount(
        products.status === "fulfilled" && typeof products.value?.total === "number"
          ? products.value.total
          : 0,
      );
      setUsersCount(
        users.status === "fulfilled" && Array.isArray(users.value) ? users.value.length : 1,
      );
      setOverview(overviewData.status === "fulfilled" ? (overviewData.value ?? null) : null);

      // Экран считается сломанным, только если не пришло вообще ничего:
      // частичные данные лучше показать, чем спрятать за сообщением об ошибке.
      setFailed([me, products, users, overviewData].every((r) => r.status === "rejected"));
      setLoading(false);
    }

    load().catch(() => {
      if (cancelled) return;
      setFailed(true);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  async function handleLogout() {
    clearActiveTenantId();
    await supabase.auth.signOut();
    router.push("/auth");
  }

  const isEmpty = productsCount === 0 && (overview?.salesCount ?? 0) === 0;

  return (
    <div className="min-h-screen bg-surface">
      <header className="flex items-center justify-between bg-navy px-6 py-4 tablet:px-10">
        <span className="font-extrabold text-white">{tenantName || "TIM"}</span>
        <div className="flex items-center gap-5">
          <Link
            href="/stores"
            className="text-sm font-semibold text-navy-text transition-colors hover:text-white"
          >
            {t("switchStore")}
          </Link>
          <Link
            href="/settings"
            className="text-sm font-semibold text-navy-text transition-colors hover:text-white"
          >
            {t("settings")}
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm font-semibold text-navy-text transition-colors hover:text-white"
          >
            {t("logout")}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[960px] px-6 py-10 tablet:px-10">
        {loading ? (
          <p className="text-center text-subtle">{t("loading")}</p>
        ) : failed ? (
          <div className="mx-auto flex max-w-[420px] flex-col items-center rounded-[20px] border border-line bg-card p-8 text-center shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
            <p className="text-body text-pretty text-subtle">{t("loadFailed")}</p>
            <button
              type="button"
              onClick={() => setReloadKey((n) => n + 1)}
              className="mt-6 h-11 rounded-card border-[1.5px] border-field-border px-6 text-sm font-bold text-ink transition-[border-color,box-shadow] duration-150 hover:border-brand-600 hover:shadow-[0_10px_22px_-14px_rgb(15_82_186/0.5)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            >
              {t("retry")}
            </button>
          </div>
        ) : isEmpty ? (
          <EmptyState
            tenantName={tenantName}
            productsCount={productsCount}
            usersCount={usersCount}
            salesCount={overview?.salesCount ?? 0}
          />
        ) : overview ? (
          <OverviewCards overview={overview} />
        ) : null}
      </main>
    </div>
  );
}
