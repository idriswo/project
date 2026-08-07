"use client";

import { useTranslations } from "next-intl";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { dayLabel, money, moneyShort } from "@/lib/format";

/**
 * Выручка по дням.
 *
 * Линия, а не столбцы: у месяца тридцать точек, и тридцать столбцов на
 * ширине телефона превращаются в частокол. Линия показывает то, ради
 * чего график открывают, — идёт вверх или вниз.
 *
 * Янтарь на графике ровно один — лучший день месяца. Второй акцент
 * отменил бы первый.
 */

export interface DayPoint {
  date: string;
  revenue: number;
  count: number;
}

const SAPPHIRE = "#0F52BA";
const AMBER = "#F2A623";

export function RevenueChart({ data }: { data: DayPoint[] }) {
  const t = useTranslations("dashboard.chart");

  // Лучший день ищем по выручке. Если весь ряд нулевой, точки нет:
  // «лучший день» с нулём в подписи выглядел бы издевательством.
  const best = data.reduce<DayPoint | null>(
    (top, point) =>
      point.revenue > 0 && (!top || point.revenue > top.revenue) ? point : top,
    null,
  );

  return (
    <div className="h-[200px] w-full tablet:h-[240px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 12, right: 12, bottom: 0, left: -12 }}
        >
          <CartesianGrid stroke="#EEF2F7" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={dayLabel}
            tick={{ fill: "#7C8598", fontSize: 11, fontWeight: 600 }}
            tickLine={false}
            axisLine={false}
            // Подписывать каждый из тридцати дней некуда — они слипнутся.
            interval="preserveStartEnd"
            minTickGap={28}
          />
          <YAxis
            tickFormatter={moneyShort}
            tick={{ fill: "#7C8598", fontSize: 11, fontWeight: 600 }}
            tickLine={false}
            axisLine={false}
            width={52}
          />
          <Tooltip
            cursor={{ stroke: "#D5DDE8", strokeWidth: 1 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0].payload as DayPoint;
              return (
                <div className="rounded-xl border border-app-line bg-app-card px-3.5 py-2.5 shadow-[0_16px_32px_-20px_rgb(15_25_60/0.5)]">
                  <span className="block text-[11.5px] font-bold text-app-dim-2">
                    {dayLabel(point.date)}
                  </span>
                  <span className="mt-1 block font-mono text-[15px] font-bold text-app-ink tabular-nums">
                    {money(point.revenue)}
                  </span>
                  <span className="mt-0.5 block text-[11.5px] text-app-dim">
                    {t("checks", { count: point.count })}
                  </span>
                </div>
              );
            }}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke={SAPPHIRE}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, fill: SAPPHIRE, stroke: "#fff", strokeWidth: 2 }}
            isAnimationActive={false}
          />
          {best ? (
            <ReferenceDot
              x={best.date}
              y={best.revenue}
              r={5}
              fill={AMBER}
              stroke="#fff"
              strokeWidth={2}
            />
          ) : null}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
