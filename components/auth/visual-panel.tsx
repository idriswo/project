import { TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";

import { Logo } from "@/components/logo";
import { Link } from "@/i18n/navigation";

/** Столбики схематичного графика: высота, цвет, задержка анимации. */
const BARS = [
  { height: "48%", tone: "muted", delay: "0s" },
  { height: "66%", tone: "muted", delay: "0.08s" },
  { height: "54%", tone: "muted", delay: "0.16s" },
  { height: "82%", tone: "brand", delay: "0.24s" },
  { height: "70%", tone: "muted", delay: "0.32s" },
  { height: "100%", tone: "accent", delay: "0.40s" },
  { height: "76%", tone: "muted", delay: "0.48s" },
] as const;

const BAR_COLORS = {
  muted: "rgba(255,255,255,0.14)",
  brand: "#0F52BA",
  accent: "#F2A623",
} as const;

const panelSurface = "border border-white/10 bg-white/5";

/**
 * Левая тёмная панель страницы входа: логотип, декоративная витрина
 * аналитики и слоган. Полностью декоративна — на ≤900px скрывается.
 */
export function VisualPanel() {
  const t = useTranslations("auth.visual");
  const tAuth = useTranslations("auth");

  return (
    <div className="relative hidden min-h-0 flex-col justify-between overflow-x-hidden overflow-y-auto bg-navy p-14 auth:flex">
      {/* Размытые пятна фона */}
      <div
        aria-hidden
        className="absolute -top-[90px] -right-[70px] size-[340px] animate-tim-float rounded-full"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(15,82,186,0.55), rgba(15,82,186,0))",
        }}
      />
      <div
        aria-hidden
        className="absolute bottom-5 -left-10 size-[180px] animate-tim-float-alt rounded-full"
        style={{
          background:
            "radial-gradient(circle at 40% 40%, rgba(242,166,35,0.35), rgba(242,166,35,0))",
        }}
      />

      <div className="relative">
        {/* Логотип тоже ведёт на лендинг: привычный способ вернуться */}
        <Link
          href="/"
          aria-label={tAuth("backToSite")}
          className="inline-block rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          <Logo tone="dark" />
        </Link>
      </div>

      <div className="relative my-2">
        <div className={`rounded-frame p-6.5 ${panelSurface}`}>
          <div className="mb-5.5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.5px] text-navy-text uppercase">
                {t("revenueLabel")}
              </p>
              <p className="mt-1 text-[26px] font-extrabold tracking-[-0.5px] text-white">
                {t("revenueValue")}
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-500/15 px-2.5 py-1.5 text-xs font-bold text-accent-500">
              <TrendingUp className="size-3.5" aria-hidden />
              {t("growthBadge")}
            </span>
          </div>

          <div
            className="flex h-30 items-end gap-2.5"
            role="img"
            aria-label={t("chartAlt")}
          >
            {BARS.map((bar, index) => (
              <div
                key={index}
                className="flex-1 animate-tim-grow rounded-t-md rounded-b-[3px]"
                style={{
                  height: bar.height,
                  background: BAR_COLORS[bar.tone],
                  animationDelay: bar.delay,
                }}
              />
            ))}
          </div>
        </div>

        <div className="mt-3.5 flex gap-3">
          <div className={`flex-1 rounded-card px-4.5 py-4 ${panelSurface}`}>
            <p className="text-[11.5px] font-semibold text-navy-text uppercase">
              {t("ordersLabel")}
            </p>
            <p className="mt-1 text-xl font-extrabold text-white">
              {t("ordersValue")}
            </p>
          </div>
          <div className={`flex-1 rounded-card px-4.5 py-4 ${panelSurface}`}>
            <p className="text-[11.5px] font-semibold text-navy-text uppercase">
              {t("stockLabel")}
            </p>
            <p className="mt-1 text-xl font-extrabold text-accent-500">
              {t("stockValue")}
            </p>
          </div>
        </div>
      </div>

      <div className="relative">
        <p className="text-[22px] leading-[1.25] font-extrabold tracking-[-0.4px] text-white">
          {t("title")}
        </p>
        <p className="mt-2.5 text-[14.5px] leading-[1.55] text-navy-text">
          {t("subtitle")}
        </p>
      </div>
    </div>
  );
}
