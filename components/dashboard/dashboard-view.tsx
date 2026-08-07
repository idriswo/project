"use client";

import { PackagePlus, RotateCw, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/app/app-shell";
import { EmptyState } from "@/components/dashboard/empty-state";
import {
  type Overview,
  OverviewCards,
  type SalesSummary,
} from "@/components/dashboard/overview-cards";
import {
  type DayPoint,
  RevenueChart,
} from "@/components/dashboard/revenue-chart";
import { Badge, stockTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyBlock } from "@/components/ui/empty";
import { DashboardSkeleton } from "@/components/ui/skeleton";
import { DataCard, Eyebrow, PageHead } from "@/components/ui/stat";
import { fetchApi } from "@/lib/apiClient";
import { cn } from "@/lib/cn";
import { count } from "@/lib/format";
import { canSeeMoney, homeFor } from "@/lib/roles";
import { useAppSession } from "@/lib/session";

type Period = "today" | "week" | "month";

const PERIODS: Period[] = ["today", "week", "month"];

/** `fetchApi` не типизирован; обёртка держит приведение типов в одном месте. */
function get<T>(endpoint: string): Promise<T> {
  return fetchApi(endpoint) as Promise<T>;
}

interface LowStockRow {
  variantId: string;
  productName: string;
  size: string | null;
  color: string | null;
  quantity: number;
}

/**
 * Дашборд (Этап 19).
 *
 * Экран отвечает на один вопрос — сколько заработано — и только потом
 * на все остальные. Порядок блоков сверху вниз: главное число, кривая
 * месяца, что требует внимания. Пустое состояние определяется по
 * `productsCount === 0 && salesCount === 0` — простейший честный сигнал
 * «этот магазин ещё не работал».
 *
 * Запросы идут через `allSettled`: упавший отчёт не должен прятать
 * остальное (16.25). Экран считается сломанным, только если не пришло
 * вообще ничего.
 */
export function DashboardView() {
  const t = useTranslations("dashboard");
  const session = useAppSession();

  const [period, setPeriod] = useState<Period>("today");
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [productsCount, setProductsCount] = useState(0);
  const [usersCount, setUsersCount] = useState(1);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [days, setDays] = useState<DayPoint[]>([]);
  const [lowStock, setLowStock] = useState<LowStockRow[]>([]);

  // `setLoading(true)` живёт в обработчиках смены периода и повтора, а не
  // здесь: вызов setState прямо в теле эффекта запускает каскад рендеров
  // (правило `react-hooks/set-state-in-effect`).
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [
        products,
        users,
        overviewData,
        salesData,
        byDay,
        low,
      ] = await Promise.allSettled([
        get<{ total: number }>("/inventory/products?limit=1"),
        get<unknown[]>("/users"),
        get<Overview>(`/reports/overview?period=${period}`),
        get<SalesSummary>(`/reports/sales?period=${period}`),
        get<DayPoint[]>("/reports/sales-by-day?days=30"),
        get<LowStockRow[]>("/reports/low-stock?threshold=3&limit=5"),
      ]);

      if (cancelled) return;

      setProductsCount(
        products.status === "fulfilled" &&
          typeof products.value?.total === "number"
          ? products.value.total
          : 0,
      );
      setUsersCount(
        users.status === "fulfilled" && Array.isArray(users.value)
          ? users.value.length
          : 1,
      );
      setOverview(
        overviewData.status === "fulfilled" ? (overviewData.value ?? null) : null,
      );
      setSummary(salesData.status === "fulfilled" ? (salesData.value ?? null) : null);
      setDays(
        byDay.status === "fulfilled" && Array.isArray(byDay.value)
          ? byDay.value
          : [],
      );
      setLowStock(
        low.status === "fulfilled" && Array.isArray(low.value) ? low.value : [],
      );

      setFailed(
        [products, users, overviewData, salesData, byDay, low].every(
          (r) => r.status === "rejected",
        ),
      );
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
  }, [period, reloadKey]);

  const isEmpty = productsCount === 0 && (overview?.salesCount ?? 0) === 0;
  const allowed = canSeeMoney(session.role);

  return (
    <AppShell storeName={session.storeName} role={session.role}>
      <div className="mx-auto flex w-full max-w-[1040px] flex-col gap-6">
        <PageHead eyebrow={t("eyebrow")} title={session.storeName || "TIM"}>
          {allowed && !isEmpty ? (
            <PeriodSwitch
              value={period}
              onChange={(next) => {
                setLoading(true);
                setPeriod(next);
              }}
            />
          ) : null}
        </PageHead>

        {!allowed ? (
          // Кассиру и кладовщику отчёты не показываем. Не потому, что это
          // защита — её делает бэкенд, — а потому, что им здесь нечего
          // делать, и пустой отчёт только сбил бы с толку.
          <EmptyBlock
            art="chart"
            title={t("noAccess.heading")}
            lead={t("noAccess.lead")}
            action={
              <Button href={homeFor(session.role)} size="xl" variant="sapphire">
                {t("noAccess.cta")}
              </Button>
            }
          />
        ) : loading || session.loading ? (
          <DashboardSkeleton />
        ) : failed ? (
          <EmptyBlock
            art="search"
            title={t("loadFailedHeading")}
            lead={t("loadFailed")}
            action={
              <Button
                variant="sapphire"
                size="xl"
                onClick={() => {
                  setLoading(true);
                  setReloadKey((n) => n + 1);
                }}
              >
                <RotateCw className="size-5" aria-hidden />
                {t("retry")}
              </Button>
            }
          />
        ) : isEmpty ? (
          <EmptyState
            tenantName={session.storeName}
            productsCount={productsCount}
            usersCount={usersCount}
            salesCount={overview?.salesCount ?? 0}
          />
        ) : (
          <>
            {overview ? (
              <OverviewCards
                overview={overview}
                summary={summary}
                role={session.role}
                periodLabel={t(`period.${period}`)}
              />
            ) : null}

            <DataCard className="p-6 tablet:p-8">
              <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
                <Eyebrow>{t("chart.title")}</Eyebrow>
                <span className="flex items-center gap-2 text-[12px] font-semibold text-app-dim">
                  <span
                    aria-hidden
                    className="size-2.5 rounded-full bg-app-gold"
                  />
                  {t("chart.bestDay")}
                </span>
              </div>
              <div className="mt-5">
                {days.length > 0 ? (
                  <RevenueChart data={days} />
                ) : (
                  <p className="py-10 text-center text-sm text-app-dim">
                    {t("chart.empty")}
                  </p>
                )}
              </div>
            </DataCard>

            {lowStock.length > 0 ? <LowStockCard rows={lowStock} /> : null}
          </>
        )}
      </div>
    </AppShell>
  );
}

function PeriodSwitch({
  value,
  onChange,
}: {
  value: Period;
  onChange: (next: Period) => void;
}) {
  const t = useTranslations("dashboard.period");

  return (
    <div className="flex rounded-full border border-app-line bg-app-card p-1">
      {PERIODS.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          aria-pressed={p === value}
          className={cn(
            "rounded-full px-4 py-1.5 text-[13px] font-bold",
            "transition-[background-color,color] duration-150",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-sapphire",
            p === value
              ? "bg-app-sapphire text-white"
              : "text-app-dim hover:text-app-ink",
          )}
        >
          {t(p)}
        </button>
      ))}
    </div>
  );
}

/**
 * Что кончается. Карточки, а не строки таблицы: у каждой позиции свой
 * значок состояния, и «кончилось» видно цветом раньше, чем прочитано
 * название.
 */
function LowStockCard({ rows }: { rows: LowStockRow[] }) {
  const t = useTranslations("dashboard.lowStock");

  return (
    <DataCard className="p-6 tablet:p-8">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-app-low-soft text-app-low"
          >
            <TriangleAlert className="size-4.5" />
          </span>
          <Eyebrow>{t("title")}</Eyebrow>
        </div>
        <Button href="/warehouse" variant="quiet" size="sm">
          <PackagePlus className="size-4" aria-hidden />
          {t("cta")}
        </Button>
      </div>

      <ul className="mt-5 grid gap-2.5 tablet:grid-cols-2">
        {rows.map((row) => (
          <li
            key={row.variantId}
            className="flex items-center gap-3 rounded-card border border-app-line bg-app-panel px-4 py-3"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-bold text-app-ink">
                {row.productName}
              </span>
              <span className="mt-0.5 block font-mono text-[11.5px] tracking-[0.05em] text-app-dim-2 uppercase">
                {[row.color, row.size].filter(Boolean).join(" · ") || "—"}
              </span>
            </span>
            <Badge tone={stockTone(row.quantity)}>
              {row.quantity > 0 ? count(row.quantity) : t("out")}
            </Badge>
          </li>
        ))}
      </ul>
    </DataCard>
  );
}
