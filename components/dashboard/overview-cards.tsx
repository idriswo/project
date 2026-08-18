"use client";

import { AlertTriangle, CheckCircle2, TrendingUp, Info, Receipt, ShoppingBag, Banknote } from "lucide-react";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";

import type { Tone } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { count, money } from "@/lib/format";
import type { AppRole } from "@/lib/roles";
import { canSeeProfit } from "@/lib/roles";

export interface Overview {
  revenue: number;
  netProfit: number;
  salesCount: number;
  openDebt: number;
  healthScore?: HealthScore;
}

export interface SalesSummary {
  averageCheck: number;
  itemsSold: number;
}

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
    <div className="flex flex-col gap-4 tablet:gap-6">
      {/* Bento Grid Layout */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 tablet:gap-6">
        
        {/* Main Hero Card (Spans 2 columns) */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="col-span-2 relative overflow-hidden rounded-[24px] bg-[#051130] p-6 tablet:p-8 shadow-2xl shadow-[#051130]/20 border border-white/10"
        >
          {/* Subtle Glow Background */}
          <div className="absolute -top-24 -right-24 size-48 rounded-full bg-app-sapphire/20 blur-[60px] pointer-events-none" />
          
          <div className="relative z-10 flex flex-col gap-3">
            <span className="block text-[12px] font-extrabold tracking-[0.2em] text-white/50 uppercase">
              {showProfit ? t("netProfitToday") : t("revenueToday")}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-[clamp(40px,6vw,56px)] leading-[1.1] font-extrabold tracking-[-0.04em] text-white">
                {money(showProfit ? overview.netProfit : overview.revenue)}
              </span>
              <span className="text-xl font-bold tracking-[0.06em] text-white/40">
                {t("currency")}
              </span>
            </div>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 w-fit border border-white/5 backdrop-blur-sm">
              <TrendingUp className="size-3.5 text-app-ok" />
              <span className="text-[12px] font-semibold text-white/70">{periodLabel}</span>
            </div>
          </div>
        </motion.div>

        {/* Sales Count Card */}
        <BentoCard delay={0.1}>
          <div className="flex size-10 items-center justify-center rounded-2xl bg-app-panel text-app-dim mb-4">
            <Receipt className="size-5" />
          </div>
          <span className="text-[12px] font-extrabold tracking-[0.1em] text-app-dim-2 uppercase mb-1">
            {t("salesCount")}
          </span>
          <span className="font-mono text-3xl font-extrabold tracking-tight text-app-ink">
            {count(overview.salesCount)}
          </span>
        </BentoCard>

        {/* Average Check Card */}
        <BentoCard delay={0.2}>
          <div className="flex size-10 items-center justify-center rounded-2xl bg-app-sapphire/10 text-app-sapphire mb-4">
            <ShoppingBag className="size-5" />
          </div>
          <span className="text-[12px] font-extrabold tracking-[0.1em] text-app-dim-2 uppercase mb-1">
            {t("averageCheck")}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-3xl font-extrabold tracking-tight text-app-ink">
              {money(summary?.averageCheck)}
            </span>
            <span className="text-sm font-bold text-app-dim-2">{t("currency")}</span>
          </div>
        </BentoCard>

        {/* Revenue Card (if Profit is shown above) */}
        {showProfit ? (
          <BentoCard delay={0.3}>
            <div className="flex size-10 items-center justify-center rounded-2xl bg-app-ok-soft text-app-ok mb-4">
              <Banknote className="size-5" />
            </div>
            <span className="text-[12px] font-extrabold tracking-[0.1em] text-app-dim-2 uppercase mb-1">
              {t("revenue")}
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-3xl font-extrabold tracking-tight text-app-ink">
                {money(overview.revenue)}
              </span>
              <span className="text-sm font-bold text-app-dim-2">{t("currency")}</span>
            </div>
          </BentoCard>
        ) : null}

        {/* Debt Card */}
        <BentoCard 
          delay={0.4} 
          className={cn(overview.openDebt > 0 && "border-app-low/30 bg-app-low-soft/50")}
        >
          <div className={cn(
            "flex size-10 items-center justify-center rounded-2xl mb-4",
            overview.openDebt > 0 ? "bg-app-low-soft text-app-low" : "bg-app-panel text-app-dim"
          )}>
            <Info className="size-5" />
          </div>
          <span className={cn(
            "text-[12px] font-extrabold tracking-[0.1em] uppercase mb-1",
            overview.openDebt > 0 ? "text-app-low" : "text-app-dim-2"
          )}>
            {t("openDebt")}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className={cn(
              "font-mono text-3xl font-extrabold tracking-tight",
              overview.openDebt > 0 ? "text-app-low" : "text-app-ink"
            )}>
              {money(overview.openDebt)}
            </span>
            <span className={cn(
              "text-sm font-bold",
              overview.openDebt > 0 ? "text-app-low/60" : "text-app-dim-2"
            )}>{t("currency")}</span>
          </div>
        </BentoCard>

      </div>

      {healthScore ? <HealthCard health={healthScore} /> : null}
    </div>
  );
}

function BentoCard({ children, delay = 0, className }: { children: React.ReactNode, delay?: number, className?: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      className={cn(
        "col-span-1 flex flex-col justify-center rounded-[24px] border border-app-line bg-app-card p-6 shadow-[0_1px_2px_rgb(15_25_60/0.04),0_12px_28px_-24px_rgb(15_25_60/0.35)] transition-all duration-300 hover:shadow-lg hover:border-app-line-strong",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

function HealthCard({ health }: { health: HealthScore }) {
  const t = useTranslations("dashboard.overview");
  const tone = STATUS_TONE[health.status];
  const Icon = health.status === "good" ? CheckCircle2 : AlertTriangle;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5, ease: "easeOut" }}
      className="rounded-[24px] border border-app-line bg-app-card p-6 tablet:p-8 shadow-[0_1px_2px_rgb(15_25_60/0.04),0_12px_28px_-24px_rgb(15_25_60/0.35)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 border-b border-app-line pb-5">
        <div className="flex items-center gap-4">
          <span
            aria-hidden
            className={cn(
              "flex size-14 shrink-0 items-center justify-center rounded-[18px]",
              tone === "ok"
                ? "bg-app-ok-soft text-app-ok"
                : tone === "low"
                  ? "bg-app-low-soft text-app-low"
                  : "bg-app-out-soft text-app-out",
            )}
          >
            <Icon className="size-6" />
          </span>
          <div className="flex flex-col gap-1">
            <span className="text-[12px] font-extrabold tracking-[0.14em] text-app-dim-2 uppercase">
              {t("healthLabel")}
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-3xl font-extrabold tracking-tight text-app-ink">
                {health.score}
              </span>
              <span className="text-sm font-bold text-app-dim-2">/100</span>
            </div>
          </div>
        </div>
      </div>
      <ul className="mt-5 flex flex-col gap-2.5">
        {health.insights.map((text, i) => (
          <li key={i} className="flex gap-3 text-[14px] font-medium leading-relaxed text-app-dim">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-app-dim-2" aria-hidden />
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
