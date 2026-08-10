"use client";

import { Award, Crown, Star } from "lucide-react";
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

import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { MockNotice } from "@/components/ui/mock-notice";
import { DataCard, Eyebrow, PageHead } from "@/components/ui/stat";
import {
  fetchLoyaltyOverview,
  fetchLoyaltySettings,
  fetchLoyaltyTiers,
  fetchRepeatRate,
  fetchTopCustomers,
  type LoyaltyOverview,
  type LoyaltySettings,
  type LoyaltyTier,
  type RepeatPoint,
  saveLoyaltySettings,
  type TopCustomer,
} from "@/lib/api/loyalty";
import { count, money } from "@/lib/format";

/**
 * Программа лояльности (Э-18).
 *
 * Часть экрана работает по-настоящему: правила начисления и стоимость
 * балла приходят из `GET /loyalty/settings` и сохраняются туда же.
 * Уровни, агрегаты, топ клиентов и график повторных покупок — на
 * заглушках (модуль 12 в `BACKEND-REQUESTS.md`), и об этом сказано
 * плашкой: смешивать живые и выдуманные числа молча нельзя.
 */

const SAPPHIRE = "#0F52BA";
const AMBER = "#F2A623";

const TIER_ICON = [Award, Star, Crown];

export function LoyaltyView() {
  const t = useTranslations("app.loyalty");
  const [overview, setOverview] = useState<LoyaltyOverview | null>(null);
  const [settings, setSettings] = useState<LoyaltySettings | null>(null);
  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
  const [top, setTop] = useState<TopCustomer[]>([]);
  const [repeat, setRepeat] = useState<RepeatPoint[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let alive = true;
    const guard =
      <T,>(setter: (value: T) => void) =>
      (value: T) => {
        if (alive) setter(value);
      };

    fetchLoyaltyOverview()
      .then(guard(setOverview))
      .catch(() => {});
    fetchLoyaltySettings()
      .then(guard(setSettings))
      .catch(() => {});
    fetchLoyaltyTiers()
      .then(guard(setTiers))
      .catch(() => {});
    fetchTopCustomers()
      .then(guard(setTop))
      .catch(() => {});
    fetchRepeatRate()
      .then(guard(setRepeat))
      .catch(() => {});

    return () => {
      alive = false;
    };
  }, []);

  async function handleSaveSettings() {
    if (!settings) return;
    try {
      await saveLoyaltySettings(settings);
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }

  const chartRows = repeat.map((point) => ({
    ...point,
    // Полоса рисуется во всю высоту графика, поэтому её значение —
    // максимум шкалы, а не сам показатель.
    promoBand: point.promotion ? 100 : 0,
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHead eyebrow={t("eyebrow")} title={t("title")}>
        <Button href="/marketing/promotions/new">{t("startPromotion")}</Button>
      </PageHead>

      <MockNotice text={t("mock")} />

      <div className="grid gap-4 tablet:grid-cols-2 desktop:grid-cols-4">
        <Metric label={t("members")} value={count(overview?.members)} accent />
        <Metric
          label={t("pointsIssued")}
          value={count(overview?.pointsIssued)}
        />
        <Metric
          label={t("pointsRedeemed")}
          value={count(overview?.pointsRedeemed)}
        />
        <Metric
          label={t("revenueFromLoyal")}
          value={money(overview?.revenueFromLoyal)}
          unit="TJS"
        />
      </div>

      <div className="grid gap-5 desktop:grid-cols-2">
        {/* ── Правила: живой запрос ─────────────────────────────── */}
        <DataCard className="flex flex-col gap-4 p-5">
          <div>
            <h2 className="text-[17px] font-extrabold tracking-[-0.015em] text-app-ink">
              {t("config")}
            </h2>
            <p className="mt-1 text-[13px] text-app-dim">{t("configHint")}</p>
          </div>

          <div className="grid gap-4 tablet:grid-cols-2">
            <Field label={t("pointsPerAmount")}>
              {(props) => (
                <TextInput
                  {...props}
                  inputMode="numeric"
                  className="h-12 text-right font-mono"
                  value={settings?.pointsPerAmount ?? ""}
                  onChange={(event) =>
                    setSettings((prev) =>
                      prev
                        ? {
                            ...prev,
                            pointsPerAmount:
                              Number(event.target.value.replace(/\D/g, "")) ||
                              0,
                          }
                        : prev,
                    )
                  }
                />
              )}
            </Field>
            <Field label={t("pointValue")}>
              {(props) => (
                <TextInput
                  {...props}
                  inputMode="decimal"
                  className="h-12 text-right font-mono"
                  value={settings?.pointValue ?? ""}
                  onChange={(event) =>
                    setSettings((prev) =>
                      prev
                        ? {
                            ...prev,
                            pointValue: Number(event.target.value) || 0,
                          }
                        : prev,
                    )
                  }
                />
              )}
            </Field>
          </div>

          <Button
            type="button"
            variant="sapphire"
            disabled={!settings}
            onClick={handleSaveSettings}
          >
            {t("saveConfig")}
          </Button>
          {saved ? (
            <p role="status" className="text-[13px] font-semibold text-app-ok">
              {t("configSaved")}
            </p>
          ) : null}
        </DataCard>

        {/* ── Уровни ────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          <h2 className="text-[17px] font-extrabold tracking-[-0.015em] text-app-ink">
            {t("tiers")}
          </h2>
          <div className="grid gap-3 tablet:grid-cols-3">
            {tiers.map((tier, index) => {
              const Icon = TIER_ICON[index] ?? Award;
              return (
                <DataCard key={tier.id} className="p-4">
                  <span className="flex size-9 items-center justify-center rounded-full bg-app-sapphire text-white">
                    <Icon className="size-4.5" aria-hidden />
                  </span>
                  <p className="mt-3 font-extrabold text-app-ink">
                    {tier.name}
                  </p>
                  <p className="mt-1 font-mono text-[12px] text-app-dim num">
                    {count(tier.minPoints)}
                    {tier.maxPoints ? `–${count(tier.maxPoints)}` : "+"}{" "}
                    {t("points")}
                  </p>
                  <p className="mt-2 text-[13px] leading-snug text-app-dim">
                    {t("discount", { percent: tier.discountPercent })}
                    <span className="block">{tier.perks}</span>
                  </p>
                </DataCard>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-5 desktop:grid-cols-[1.15fr_1fr]">
        <DataCard className="p-5">
          <h2 className="text-[17px] font-extrabold tracking-[-0.015em] text-app-ink">
            {t("repeatRate")}
          </h2>
          <p className="mt-1 text-[13px] text-app-dim">{t("repeatHint")}</p>
          <div className="mt-5 h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartRows}
                margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
              >
                <CartesianGrid stroke="#E6EBF2" vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#7C8598", fontSize: 12 }}
                />
                <YAxis
                  domain={[0, 100]}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#7C8598", fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value) => `${Number(value)}%`}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #E6EBF2",
                    fontSize: 13,
                  }}
                />
                <Bar
                  dataKey="promoBand"
                  name={t("promotionPeriod")}
                  fill={AMBER}
                  fillOpacity={0.35}
                  maxBarSize={44}
                  radius={[6, 6, 0, 0]}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  name={t("repeatRate")}
                  stroke={SAPPHIRE}
                  strokeWidth={2.5}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </DataCard>

        <DataCard className="p-5">
          <h2 className="text-[17px] font-extrabold tracking-[-0.015em] text-app-ink">
            {t("topCustomers")}
          </h2>
          <ol className="mt-4 flex flex-col divide-y divide-app-line border-t border-app-line">
            {top.map((customer, index) => (
              <li
                key={customer.name}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3"
              >
                <span className="flex min-w-0 items-baseline gap-3">
                  <span className="font-mono text-[13px] font-bold text-app-dim-2 num">
                    {index + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold text-app-ink">
                      {customer.name}
                    </span>
                    <span className="font-mono text-[12px] text-app-dim num">
                      {count(customer.points)} {t("points")}
                    </span>
                  </span>
                </span>
                <span className="font-mono text-[13.5px] font-bold text-app-ink num">
                  {t("ltv")} {money(customer.ltv)}
                </span>
              </li>
            ))}
          </ol>
        </DataCard>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  unit,
  accent,
}: {
  label: string;
  value: string;
  unit?: string;
  accent?: boolean;
}) {
  return (
    <DataCard className="p-5">
      <Eyebrow>{label}</Eyebrow>
      <p
        className={`mt-3 font-mono text-[26px] leading-none font-extrabold num ${
          accent ? "text-app-sapphire" : "text-app-ink"
        }`}
      >
        {value}
        {unit ? (
          <small className="ml-1.5 text-[0.5em] font-bold text-app-dim">
            {unit}
          </small>
        ) : null}
      </p>
    </DataCard>
  );
}
