"use client";

import { AlertTriangle, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge, type Tone } from "@/components/ui/badge";
import { DataCard, Eyebrow, HeroStat, SubStat } from "@/components/ui/stat";
import { cn } from "@/lib/cn";
import { count, money } from "@/lib/format";
import type { AppRole } from "@/lib/roles";
import { canSeeProfit } from "@/lib/roles";

/**
 * Совпадает с `overview()` в бэкенде (`reports.service.ts`).
 * `healthScore` объявлен необязательным намеренно: тип описывает то, что
 * реально пришло по сети, а не то, что обещано схемой. Неполный ответ
 * должен стоить одной карточки, а не всего экрана.
 */
export interface Overview {
  revenue: number;
  netProfit: number;
  salesCount: number;
  openDebt: number;
  healthScore?: HealthScore;
}

/** Часть `/reports/sales` — то, чего нет в `/reports/overview`. */
export interface SalesSummary {
  averageCheck: number;
  itemsSold: number;
}

/** Соответствует `HealthScore` в `reports.service.ts` бэкенда. */
interface HealthScore {
  score: number;
  status: "good" | "warning" | "critical";
  insights: string[];
}

const STATUS_TONE: Record<HealthScore["status"], Tone> = {
  good: "ok",
  warning: "low",
  critical: "out",
};

/**
 * Главный блок дашборда.
 *
 * Иерархия здесь — сама суть экрана. Владелец открывает приложение
 * ради одного числа: сколько заработано. Оно и стоит первым, крупнее
 * всего остального в два с лишним раза и в фирменном сапфире. Чеки,
 * средний чек и долг — тем же порядком, но серым и мелким: их читают
 * вторым взглядом, а не первым.
 *
 * Управляющему главным числом ставится выручка, а не чистая прибыль:
 * закуп и маржа — не его данные (`canSeeProfit`).
 */
export function OverviewCards({
  overview,
  summary,
  role,
  periodLabel,
}: {
  overview: Overview;
  summary: SalesSummary | null;
  role: AppRole;
  periodLabel: string;
}) {
  const t = useTranslations("dashboard.overview");
  const showProfit = canSeeProfit(role);
  const { healthScore } = overview;

  return (
    <div className="flex flex-col gap-4">
      <DataCard className="p-6 tablet:p-8">
        <HeroStat
          label={showProfit ? t("netProfitToday") : t("revenueToday")}
          value={money(showProfit ? overview.netProfit : overview.revenue)}
          unit={t("currency")}
          hint={periodLabel}
        />

        <div className="mt-8 flex flex-wrap gap-x-10 gap-y-6 border-t border-app-line pt-6">
          <SubStat
            label={t("salesCount")}
            value={count(overview.salesCount)}
          />
          <SubStat
            label={t("averageCheck")}
            value={money(summary?.averageCheck)}
            unit={t("currency")}
          />
          {showProfit ? (
            <SubStat
              label={t("revenue")}
              value={money(overview.revenue)}
              unit={t("currency")}
            />
          ) : null}
          <SubStat
            label={t("openDebt")}
            value={money(overview.openDebt)}
            unit={t("currency")}
            tone={overview.openDebt > 0 ? "low" : "dim"}
          />
        </div>
      </DataCard>

      {healthScore ? <HealthCard health={healthScore} /> : null}
    </div>
  );
}

/**
 * Оценка состояния магазина.
 *
 * Раньше это был круг на 112px с числом внутри — самый крупный элемент
 * страницы. Оценка полезна, но она не то, ради чего сюда заходят, и
 * забирать у выручки первое место ей нельзя. Теперь это строка со
 * значком, а объяснения оценки — списком под ней: они и есть польза,
 * само число без них ничего не говорит.
 */
function HealthCard({ health }: { health: HealthScore }) {
  const t = useTranslations("dashboard.overview");
  const tone = STATUS_TONE[health.status];
  const Icon = health.status === "good" ? CheckCircle2 : AlertTriangle;

  return (
    <DataCard className="p-6 tablet:p-7">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="flex items-center gap-3.5">
          <span
            aria-hidden
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-xl",
              tone === "ok"
                ? "bg-app-ok-soft text-app-ok"
                : tone === "low"
                  ? "bg-app-low-soft text-app-low"
                  : "bg-app-out-soft text-app-out",
            )}
          >
            <Icon className="size-5" />
          </span>
          <div className="flex flex-col gap-1">
            <Eyebrow>{t("healthLabel")}</Eyebrow>
            <span className="font-mono text-[19px] leading-none font-bold text-app-ink tabular-nums">
              {health.score}
              <small className="ml-1 text-[0.55em] font-semibold text-app-dim-2">
                / 100
              </small>
            </span>
          </div>
        </div>
        <Badge tone={tone}>{t(`status.${health.status}`)}</Badge>
      </div>

      {health.insights.length > 0 ? (
        <ul className="mt-5 flex flex-col gap-2">
          {health.insights.map((insight) => (
            <li
              key={insight}
              className="flex items-start gap-2.5 rounded-card bg-app-panel px-4 py-3 text-[13.5px] leading-snug text-app-ink"
            >
              <ArrowUpRight
                className="mt-0.5 size-4 shrink-0 text-app-sapphire"
                aria-hidden
              />
              {insight}
            </li>
          ))}
        </ul>
      ) : null}
    </DataCard>
  );
}
