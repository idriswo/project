"use client";

import { Clock, RotateCcw, Trophy } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { MockNotice } from "@/components/ui/mock-notice";
import { Segmented } from "@/components/ui/segmented";
import { DashboardSkeleton } from "@/components/ui/skeleton";
import { DataCard, Eyebrow, PageHead } from "@/components/ui/stat";
import { DataTable, Td, Th } from "@/components/ui/table";
import { fetchShiftAnalytics, type ShiftAnalytics } from "@/lib/api/shifts";
import { dayLabel, money, moneyShort, percent } from "@/lib/format";

/**
 * Анализ смен (Э-06).
 *
 * Столбцы — выручка смены, линия поверх — средний чек. Вместе они
 * отвечают на вопрос, который по отдельности не решается: смена подняла
 * выручку количеством чеков или их размером. Два отдельных графика
 * пришлось бы сравнивать глазами.
 */

const SAPPHIRE = "#0F52BA";
const AMBER = "#F2A623";

export function ShiftAnalyticsView() {
  const t = useTranslations("app.shiftAnalytics");
  const [days, setDays] = useState<"7" | "30">("7");
  const [data, setData] = useState<ShiftAnalytics | null>(null);

  useEffect(() => {
    let alive = true;
    fetchShiftAnalytics(days === "7" ? 7 : 30)
      .then((next) => alive && setData(next))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [days]);

  const rows =
    data?.days.map((day) => ({
      ...day,
      label: dayLabel(day.date),
    })) ?? [];

  // Лучший день красим золотом: это точка внимания, ради которой
  // график и смотрят.
  const best = rows.reduce(
    (top, row) => (row.revenue > (top?.revenue ?? 0) ? row : top),
    rows[0],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHead eyebrow={t("eyebrow")} title={t("title")}>
        <Segmented
          ariaLabel={t("period")}
          value={days}
          onChange={setDays}
          options={[
            { value: "7", label: t("last7") },
            { value: "30", label: t("last30") },
          ]}
        />
      </PageHead>

      <MockNotice text={t("mock")} />

      {!data ? (
        <DashboardSkeleton />
      ) : (
        <>
          <div className="grid gap-4 tablet:grid-cols-3">
            <Metric
              icon={<Trophy className="size-4.5" aria-hidden />}
              label={t("bestShift")}
              hint={data.bestShift.label}
              value={money(data.bestShift.revenue)}
              unit="TJS"
              delta={data.bestShift.deltaPercent}
            />
            <Metric
              icon={<Clock className="size-4.5" aria-hidden />}
              label={t("perHour")}
              value={money(data.revenuePerHour.value)}
              unit={t("perHourUnit")}
              delta={data.revenuePerHour.deltaPercent}
            />
            <Metric
              icon={<RotateCcw className="size-4.5" aria-hidden />}
              label={t("returns")}
              value={String(data.returns.count)}
              unit={t("returnsUnit")}
              delta={data.returns.deltaPercent}
              /* Меньше возвратов — лучше, поэтому знак дельты читается наоборот. */
              invert
            />
          </div>

          <DataCard className="p-5 tablet:p-6">
            <h2 className="text-[17px] font-extrabold tracking-[-0.015em] text-app-ink">
              {t("chartTitle")}
            </h2>
            <div className="mt-5 h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={rows}
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
                    yAxisId="revenue"
                    tickFormatter={moneyShort}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#7C8598", fontSize: 12 }}
                  />
                  <YAxis
                    yAxisId="check"
                    orientation="right"
                    tickFormatter={moneyShort}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#7C8598", fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(15,82,186,0.06)" }}
                    formatter={(value) => money(Number(value))}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #E6EBF2",
                      fontSize: 13,
                    }}
                  />
                  <Bar
                    yAxisId="revenue"
                    dataKey="revenue"
                    name={t("revenue")}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={38}
                    fill={SAPPHIRE}
                    /* Золотом — только лучший столбец, иначе акцент
                     * перестаёт быть акцентом. */
                    shape={(props: unknown) => {
                      const bar = props as {
                        x: number;
                        y: number;
                        width: number;
                        height: number;
                        payload: { label: string };
                      };
                      return (
                        <rect
                          x={bar.x}
                          y={bar.y}
                          width={bar.width}
                          height={bar.height}
                          rx={6}
                          fill={
                            bar.payload.label === best?.label ? AMBER : SAPPHIRE
                          }
                        />
                      );
                    }}
                  />
                  <Line
                    yAxisId="check"
                    type="monotone"
                    dataKey="avgCheck"
                    name={t("avgCheck")}
                    stroke={SAPPHIRE}
                    strokeWidth={2.5}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </DataCard>

          <div className="flex flex-col gap-3">
            <h2 className="text-[17px] font-extrabold tracking-[-0.015em] text-app-ink">
              {t("ranking")}
            </h2>
            <DataTable
              caption={t("ranking")}
              head={
                <>
                  <Th align="center">{t("rank")}</Th>
                  <Th>{t("employee")}</Th>
                  <Th>{t("shift")}</Th>
                  <Th align="right">{t("revenue")}</Th>
                  <Th align="right">{t("avgCheck")}</Th>
                </>
              }
            >
              {data.ranking.map((row, index) => (
                <tr key={row.name}>
                  <Td numeric align="center" className="text-app-dim">
                    {index + 1}
                  </Td>
                  <Td className="font-semibold">{row.name}</Td>
                  <Td className="text-app-dim">{row.shift}</Td>
                  <Td numeric align="right">
                    {money(row.revenue)}
                  </Td>
                  <Td numeric align="right">
                    {money(row.avgCheck)}
                  </Td>
                </tr>
              ))}
            </DataTable>
          </div>
        </>
      )}
    </div>
  );
}

function Metric({
  icon,
  label,
  hint,
  value,
  unit,
  delta,
  invert,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  value: string;
  unit: string;
  delta: number;
  invert?: boolean;
}) {
  const good = invert ? delta < 0 : delta > 0;

  return (
    <DataCard className="p-5">
      <div className="flex items-center gap-2.5 text-app-sapphire">
        {icon}
        <Eyebrow className="text-app-dim">{label}</Eyebrow>
      </div>
      {hint ? <p className="mt-1.5 text-[13px] text-app-dim">{hint}</p> : null}
      <p className="mt-3 flex flex-wrap items-baseline gap-2 font-mono text-[24px] leading-none font-extrabold text-app-ink num">
        {value}
        <small className="text-[0.5em] font-bold text-app-dim">{unit}</small>
        <small
          className={`text-[0.5em] font-bold ${
            good ? "text-app-ok" : "text-app-out"
          }`}
        >
          {percent(delta)}
        </small>
      </p>
    </DataCard>
  );
}
