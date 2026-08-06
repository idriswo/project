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
  const [tenantName, setTenantName] = useState("");
  const [productsCount, setProductsCount] = useState(0);
  const [usersCount, setUsersCount] = useState(1);
  const [overview, setOverview] = useState<Overview | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [me, products, users, overviewData] = await Promise.all([
        fetchApi("/me") as Promise<MeResponse>,
        fetchApi("/inventory/products?limit=1") as Promise<{ total: number }>,
        fetchApi("/users").catch(() => [] as unknown[]),
        fetchApi("/reports/overview?period=month") as Promise<Overview>,
      ]);

      if (cancelled) return;

      setTenantName(me.tenant?.name ?? "");
      setProductsCount(products.total);
      setUsersCount(Array.isArray(users) ? users.length : 1);
      setOverview(overviewData);
      setLoading(false);
    }

    load().catch(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

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
