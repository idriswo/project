"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/app/app-shell";
import { Badge, stockTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyBlock } from "@/components/ui/empty";
import { ListSkeleton } from "@/components/ui/skeleton";
import { DataCard, Eyebrow, PageHead, SubStat } from "@/components/ui/stat";
import { fetchApi } from "@/lib/apiClient";
import { cn } from "@/lib/cn";
import { count, money, percent } from "@/lib/format";
import { canSeeMoney, canSeeProfit, homeFor } from "@/lib/roles";
import { useAppSession } from "@/lib/session";

type Period = "today" | "week" | "month";

const PERIODS: Period[] = ["today", "week", "month"];

function get<T>(endpoint: string): Promise<T> {
  return fetchApi(endpoint) as Promise<T>;
}

interface SalesSummary {
  revenue: number;
  salesCount: number;
  itemsSold: number;
  discountTotal: number;
  averageCheck: number;
}

interface Profit {
  revenue: number;
  cost: number;
  grossProfit: number;
  discountTotal: number;
  netProfit: number;
  margin: number;
}

interface TopRow {
  variantId: string;
  productName: string;
  size: string | null;
  color: string | null;
  soldQuantity: number;
  revenue: number;
  stockLeft: number;
}

interface StockRow {
  variantId: string;
  productName: string;
  size: string | null;
  color: string | null;
  quantity: number;
}

interface DeadRow extends StockRow {
  frozenMoney: number;
}

interface SizeRow {
  size: string;
  soldQuantity: number;
}

/**
 * Отчёты (Этап 19.19).
 *
 * Шесть блоков на существующих эндпоинтах. Седьмого — возвратов — нет:
 * `GET /reports/returns` появится только с задачей 7.2 бэкенда, и пустая
 * рамка под него обещала бы то, чего не существует.
 *
 * Прибыль отделена от продаж не оформлением, а доступом: выручку видит и
 * управляющий, себестоимость и маржу — только владелец.
 */
export function ReportsView() {
  const t = useTranslations("app.reports");
  const session = useAppSession();

  const [period, setPeriod] = useState<Period>("month");
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const [sales, setSales] = useState<SalesSummary | null>(null);
  const [profit, setProfit] = useState<Profit | null>(null);
  const [top, setTop] = useState<TopRow[]>([]);
  const [low, setLow] = useState<StockRow[]>([]);
  const [dead, setDead] = useState<DeadRow[]>([]);
  const [sizes, setSizes] = useState<SizeRow[]>([]);

  const allowed = canSeeMoney(session.role);
  const showProfit = canSeeProfit(session.role);

  /** Смена периода и повтор — события, а не эффект: setState внутри
   *  эффекта дал бы лишний каскад рендеров (та же правка, что в 19.9). */
  function reload(next?: Period) {
    setLoading(true);
    if (next) setPeriod(next);
    else setReloadKey((n) => n + 1);
  }

  useEffect(() => {
    if (!allowed) return;
    let cancelled = false;

    async function load() {
      const [s, p, tp, lo, de, sz] = await Promise.allSettled([
        get<SalesSummary>(`/reports/sales?period=${period}`),
        showProfit
          ? get<Profit>(`/reports/profit?period=${period}`)
          : Promise.resolve(null),
        get<TopRow[]>(`/reports/top-products?period=${period}&limit=5`),
        get<StockRow[]>("/reports/low-stock?threshold=3&limit=6"),
        get<DeadRow[]>("/reports/dead-stock?days=60&limit=6"),
        get<SizeRow[]>(`/reports/size-analysis?period=${period}`),
      ]);

      if (cancelled) return;

      setSales(s.status === "fulfilled" ? (s.value ?? null) : null);
      setProfit(p.status === "fulfilled" ? (p.value ?? null) : null);
      setTop(
        tp.status === "fulfilled" && Array.isArray(tp.value) ? tp.value : [],
      );
      setLow(
        lo.status === "fulfilled" && Array.isArray(lo.value) ? lo.value : [],
      );
      setDead(
        de.status === "fulfilled" && Array.isArray(de.value) ? de.value : [],
      );
      setSizes(
        sz.status === "fulfilled" && Array.isArray(sz.value) ? sz.value : [],
      );
      setLoading(false);
    }

    load().catch(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [period, reloadKey, allowed, showProfit]);

  if (!allowed) {
    return (
      <AppShell storeName={session.storeName} role={session.role}>
        <div className="mx-auto w-full max-w-[1040px]">
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
        </div>
      </AppShell>
    );
  }

  const peakSize = Math.max(...sizes.map((s) => s.soldQuantity), 1);

  return (
    <AppShell storeName={session.storeName} role={session.role}>
      <div className="mx-auto flex w-full max-w-[1040px] flex-col gap-6">
        <PageHead eyebrow={t("eyebrow")} title={t("title")}>
          <div className="flex gap-1 rounded-full bg-app-panel p-1">
            {PERIODS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => reload(p)}
                aria-pressed={p === period}
                className={cn(
                  "rounded-full px-4 py-2 text-[13px] font-bold transition-colors duration-150",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-sapphire",
                  p === period
                    ? "bg-app-card text-app-ink shadow-[0_1px_3px_rgb(0_0_0/0.08)]"
                    : "text-app-dim hover:text-app-ink",
                )}
              >
                {t(`period.${p}`)}
              </button>
            ))}
          </div>
        </PageHead>

        {loading || session.loading ? (
          <ListSkeleton rows={6} />
        ) : (
          <>
            {/* ── Продажи ─────────────────────────────────── */}
            <DataCard className="flex flex-wrap gap-x-10 gap-y-6 p-6 tablet:p-7">
              <SubStat
                label={t("sales.revenue")}
                value={money(sales?.revenue)}
              />
              <SubStat
                label={t("sales.count")}
                value={count(sales?.salesCount)}
              />
              <SubStat
                label={t("sales.average")}
                value={money(sales?.averageCheck)}
              />
              <SubStat
                label={t("sales.items")}
                value={count(sales?.itemsSold)}
              />
              <SubStat
                label={t("sales.discount")}
                value={money(sales?.discountTotal)}
              />
            </DataCard>

            {/* ── Прибыль: только владельцу ───────────────── */}
            {showProfit && profit ? (
              <DataCard className="p-6 tablet:p-7">
                <Eyebrow>{t("profit.title")}</Eyebrow>
                <div className="mt-5 flex flex-wrap gap-x-10 gap-y-6">
                  <SubStat
                    label={t("profit.net")}
                    value={money(profit.netProfit)}
                    tone={profit.netProfit > 0 ? "ok" : "out"}
                  />
                  <SubStat
                    label={t("profit.margin")}
                    value={percent(profit.margin)}
                  />
                  <SubStat
                    label={t("profit.cost")}
                    value={money(profit.cost)}
                  />
                  <SubStat
                    label={t("profit.gross")}
                    value={money(profit.grossProfit)}
                  />
                </div>
              </DataCard>
            ) : null}

            {/* ── Топ товаров ─────────────────────────────── */}
            <ReportCard
              title={t("top.title")}
              empty={top.length === 0}
              emptyText={t("top.empty")}
            >
              {top.map((row) => (
                <Row
                  key={row.variantId}
                  name={row.productName}
                  meta={[row.color, row.size].filter(Boolean).join(" · ")}
                  value={money(row.revenue)}
                  side={t("top.sold", { count: row.soldQuantity })}
                />
              ))}
            </ReportCard>

            {/* ── Заканчивается ───────────────────────────── */}
            <ReportCard
              title={t("low.title")}
              empty={low.length === 0}
              emptyText={t("low.empty")}
            >
              {low.map((row) => (
                <Row
                  key={row.variantId}
                  name={row.productName}
                  meta={[row.color, row.size].filter(Boolean).join(" · ")}
                  badge={
                    <Badge tone={stockTone(row.quantity)}>
                      {t("low.left", { count: row.quantity })}
                    </Badge>
                  }
                />
              ))}
            </ReportCard>

            {/* ── Залежалось ──────────────────────────────── */}
            <ReportCard
              title={t("dead.title")}
              hint={t("dead.hint")}
              empty={dead.length === 0}
              emptyText={t("dead.empty")}
            >
              {dead.map((row) => (
                <Row
                  key={row.variantId}
                  name={row.productName}
                  meta={[row.color, row.size].filter(Boolean).join(" · ")}
                  value={money(row.frozenMoney)}
                  side={t("dead.pieces", { count: row.quantity })}
                />
              ))}
            </ReportCard>

            {/* ── Размеры ─────────────────────────────────── */}
            <ReportCard
              title={t("sizes.title")}
              empty={sizes.length === 0}
              emptyText={t("sizes.empty")}
            >
              {sizes.map((row) => (
                <div
                  key={row.size}
                  className="flex items-center gap-4 border-b border-app-line py-3 last:border-b-0"
                >
                  <span className="w-12 shrink-0 font-mono text-[13px] font-bold text-app-ink">
                    {row.size}
                  </span>
                  <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-app-track">
                    <span
                      className="block h-full rounded-full bg-app-sapphire"
                      style={{
                        width: `${Math.max(4, Math.round((row.soldQuantity / peakSize) * 100))}%`,
                      }}
                    />
                  </span>
                  <span className="w-12 shrink-0 text-right font-mono text-[13px] text-app-dim tabular-nums">
                    {count(row.soldQuantity)}
                  </span>
                </div>
              ))}
            </ReportCard>
          </>
        )}
      </div>
    </AppShell>
  );
}

function ReportCard({
  title,
  hint,
  empty,
  emptyText,
  children,
}: {
  title: string;
  hint?: string;
  empty: boolean;
  emptyText: string;
  children: React.ReactNode;
}) {
  return (
    <DataCard className="p-6 tablet:p-7">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <Eyebrow>{title}</Eyebrow>
        {hint ? (
          <span className="text-[12.5px] text-app-dim">{hint}</span>
        ) : null}
      </div>
      {empty ? (
        <p className="mt-5 text-[13.5px] text-app-dim">{emptyText}</p>
      ) : (
        <div className="mt-3 flex flex-col">{children}</div>
      )}
    </DataCard>
  );
}

function Row({
  name,
  meta,
  value,
  side,
  badge,
}: {
  name: string;
  meta?: string;
  value?: string;
  side?: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 border-b border-app-line py-3 last:border-b-0">
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[14px] font-semibold text-app-ink">
          {name}
        </span>
        {meta ? (
          <span className="font-mono text-[11.5px] tracking-[0.05em] text-app-dim-2 uppercase">
            {meta}
          </span>
        ) : null}
      </span>

      {badge ? (
        <span className="shrink-0">{badge}</span>
      ) : (
        <span className="flex shrink-0 flex-col items-end gap-0.5">
          {value ? (
            <span className="font-mono text-[14px] font-bold text-app-ink tabular-nums">
              {value}
            </span>
          ) : null}
          {side ? (
            <span className="text-[11.5px] text-app-dim">{side}</span>
          ) : null}
        </span>
      )}
    </div>
  );
}
