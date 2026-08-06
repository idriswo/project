"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";

export interface Overview {
  revenue: number;
  netProfit: number;
  salesCount: number;
  openDebt: number;
  healthScore: {
    score: number;
    status: "good" | "warning" | "critical";
    insights: string[];
  };
}

const STATUS_TEXT: Record<Overview["healthScore"]["status"], string> = {
  good: "text-success",
  warning: "text-warning",
  critical: "text-danger",
};

const STATUS_RING: Record<Overview["healthScore"]["status"], string> = {
  good: "border-success",
  warning: "border-warning",
  critical: "border-danger",
};

function formatMoney(value: number): string {
  return new Intl.NumberFormat("ru-RU").format(Math.round(value));
}

export function OverviewCards({ overview }: { overview: Overview }) {
  const t = useTranslations("dashboard.overview");
  const { healthScore } = overview;
  const statusColor = STATUS_TEXT[healthScore.status];
  const ringColor = STATUS_RING[healthScore.status];

  return (
    <div className="flex flex-col gap-6">
      <div className="mx-auto flex w-full max-w-[560px] flex-col items-center rounded-[20px] border border-line bg-card p-8 text-center shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
        <span className="text-[13px] font-bold tracking-[0.4px] text-subtle uppercase">
          {t("healthLabel")}
        </span>
        <div
          className={cn(
            "mt-4 flex size-28 items-center justify-center rounded-full border-4",
            ringColor,
          )}
        >
          <span className={cn("text-[40px] font-extrabold", statusColor)}>
            {healthScore.score}
          </span>
        </div>
        <span className={cn("mt-3 text-sm font-bold", statusColor)}>
          {t(`status.${healthScore.status}`)}
        </span>

        {healthScore.insights.length > 0 ? (
          <ul className="mt-6 flex w-full flex-col gap-2 text-left">
            {healthScore.insights.map((insight) => (
              <li key={insight} className="rounded-card bg-surface px-4 py-3 text-sm text-ink">
                {insight}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-4 tablet:grid-cols-4">
        <StatTile label={t("revenue")} value={formatMoney(overview.revenue)} />
        <StatTile label={t("netProfit")} value={formatMoney(overview.netProfit)} emphasis />
        <StatTile label={t("salesCount")} value={String(overview.salesCount)} />
        <StatTile
          label={t("openDebt")}
          value={formatMoney(overview.openDebt)}
          warn={overview.openDebt > 0}
        />
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  emphasis,
  warn,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  warn?: boolean;
}) {
  return (
    <div className="rounded-card border border-line bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
      <span className="block text-[12px] font-bold tracking-[0.3px] text-subtle uppercase">
        {label}
      </span>
      <span
        className={cn(
          "mt-2 block text-2xl font-extrabold",
          warn ? "text-danger" : emphasis ? "text-brand-ink" : "text-ink",
        )}
      >
        {value}
      </span>
    </div>
  );
}
