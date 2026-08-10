"use client";

import { ArrowDown, ArrowRight, ArrowUp, FilePlus2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { MockNotice } from "@/components/ui/mock-notice";
import { DashboardSkeleton } from "@/components/ui/skeleton";
import { DataCard, Eyebrow, PageHead } from "@/components/ui/stat";
import { DataTable, Td, Th } from "@/components/ui/table";
import {
  fetchLosses,
  type LossesReport,
  type LossTrend,
} from "@/lib/api/losses";
import { cn } from "@/lib/cn";
import { count, dayLabel, money, moneyShort, percent } from "@/lib/format";

/**
 * Отчёт о потерях (Э-17).
 *
 * Экран отвечает на два вопроса подряд: сколько мы потеряли и почему.
 * Поэтому сумма стоит первой и красным, а таблица причин — сразу за
 * графиком: увидев всплеск, человек тут же спрашивает «что это было».
 */

const SAPPHIRE = "#0F52BA";

const TREND_ICON: Record<LossTrend, typeof ArrowUp> = {
  up: ArrowUp,
  down: ArrowDown,
  flat: ArrowRight,
};

export function LossesView() {
  const t = useTranslations("app.losses");
  const [data, setData] = useState<LossesReport | null>(null);

  useEffect(() => {
    let alive = true;
    fetchLosses()
      .then((next) => alive && setData(next))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <PageHead eyebrow={t("eyebrow")} title={t("title")}>
        <Button href="/documents/write-off/102" variant="primary">
          <FilePlus2 className="size-[18px]" aria-hidden />
          {t("createAct")}
        </Button>
      </PageHead>

      <MockNotice text={t("mock")} />

      {!data ? (
        <DashboardSkeleton />
      ) : (
        <>
          <div className="grid gap-4 tablet:grid-cols-3">
            <DataCard className="p-5">
              <Eyebrow>{t("totalAmount")}</Eyebrow>
              <p className="mt-3 font-mono text-[28px] leading-none font-extrabold text-app-out num">
                {money(data.totalAmount)}
                <small className="ml-1.5 text-[0.45em] font-bold text-app-dim">
                  TJS
                </small>
              </p>
              <p className="mt-2 text-[13px] text-app-dim">{t("forPeriod")}</p>
            </DataCard>

            <DataCard className="p-5">
              <Eyebrow>{t("percentOfRevenue")}</Eyebrow>
              <p className="mt-3 font-mono text-[28px] leading-none font-extrabold text-app-ink num">
                {data.percentOfRevenue.toFixed(1)}%
              </p>
              <p className="mt-2 text-[13px] font-semibold text-app-out">
                {percent(data.deltaPercent)} {t("toPrevious")}
              </p>
            </DataCard>

            <DataCard className="p-5">
              <Eyebrow>{t("topCategory")}</Eyebrow>
              <p className="mt-3 text-[24px] leading-none font-extrabold text-app-ink">
                {data.topCategory.name}
              </p>
              <p className="mt-2 font-mono text-[13px] text-app-dim num">
                {count(data.topCategory.units)} {t("units")}
              </p>
            </DataCard>
          </div>

          <div className="grid gap-5 desktop:grid-cols-[1.15fr_1fr]">
            <DataCard className="p-5">
              <h2 className="text-[17px] font-extrabold tracking-[-0.015em] text-app-ink">
                {t("dynamics")}
              </h2>
              <div className="mt-5 h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={data.byDay.map((day) => ({
                      ...day,
                      label: dayLabel(day.date),
                      /* Всплеск рисуем отдельным рядом: заливка под
                       * линией одинаковая, а выброс должен быть виден. */
                      spikeAmount: day.spike ? day.amount : null,
                    }))}
                    margin={{ top: 8, right: 8, bottom: 0, left: -12 }}
                  >
                    <CartesianGrid stroke="#E6EBF2" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#7C8598", fontSize: 12 }}
                    />
                    <YAxis
                      tickFormatter={moneyShort}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#7C8598", fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(value) => money(Number(value))}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #E6EBF2",
                        fontSize: 13,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      name={t("lossAmount")}
                      stroke={SAPPHIRE}
                      strokeWidth={2.5}
                      fill="rgba(15,82,186,0.10)"
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </DataCard>

            <div className="flex flex-col gap-5">
              <div>
                <h2 className="mb-3 text-[17px] font-extrabold tracking-[-0.015em] text-app-ink">
                  {t("reasons")}
                </h2>
                <DataTable
                  className="min-w-0"
                  caption={t("reasons")}
                  head={
                    <>
                      <Th>{t("reason")}</Th>
                      <Th align="right">{t("amount")}</Th>
                      <Th align="right">{t("share")}</Th>
                      <Th align="center">{t("trend")}</Th>
                    </>
                  }
                >
                  {data.reasons.map((row) => {
                    const Icon = TREND_ICON[row.trend];
                    return (
                      <tr key={row.reason}>
                        <Td className="font-semibold">
                          {t(`reasonNames.${row.reason}`)}
                        </Td>
                        <Td numeric align="right">
                          {money(row.amount)}
                        </Td>
                        <Td numeric align="right" className="text-app-dim">
                          {row.share}%
                        </Td>
                        <Td align="center">
                          <Icon
                            className={cn(
                              "inline size-4",
                              row.trend === "up"
                                ? "text-app-out"
                                : row.trend === "down"
                                  ? "text-app-ok"
                                  : "text-app-dim-2",
                            )}
                            aria-label={t(`trends.${row.trend}`)}
                          />
                        </Td>
                      </tr>
                    );
                  })}
                </DataTable>
              </div>

              <div>
                <h2 className="mb-3 text-[17px] font-extrabold tracking-[-0.015em] text-app-ink">
                  {t("worstItems")}
                </h2>
                <ul className="flex flex-col divide-y divide-app-line rounded-frame border border-app-line bg-app-card">
                  {data.items.map((item) => (
                    <li
                      key={item.sku}
                      className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3.5"
                    >
                      <span className="min-w-0">
                        <span className="block font-semibold text-app-ink">
                          {item.name}
                        </span>
                        <span className="font-mono text-[12px] text-app-dim num">
                          {item.sku}
                        </span>
                      </span>
                      <span className="text-right">
                        <span className="block font-mono text-[13.5px] font-bold text-app-out num">
                          {item.diffQty} {t("pcs")}
                        </span>
                        <span className="block font-mono text-[12.5px] text-app-dim num">
                          {money(item.diffAmount)} TJS
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
