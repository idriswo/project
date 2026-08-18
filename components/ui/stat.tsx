"use client";

import { cn } from "@/lib/cn";
import { motion } from "motion/react";

/**
 * Числа приложения.
 *
 * Правило одно и оно жёсткое: на экране есть ровно **одно** главное
 * число, и оно крупнее всего остального в разы. Деньги за сегодня —
 * это то, ради чего владелец открывает приложение; если выручка,
 * количество чеков и средний чек набраны одним кеглем, экран
 * приходится читать, вместо того чтобы посмотреть на него.
 */

/** Карточка данных — базовая поверхность приложения вместо строк таблицы. */
export function DataCard({
  className,
  children,
  ...rest
}: React.ComponentProps<typeof motion.div>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      {...rest}
      className={cn(
        "rounded-[24px] border border-app-line bg-app-card shadow-[0_1px_2px_rgb(15_25_60/0.04),0_12px_28px_-24px_rgb(15_25_60/0.35)] transition-all duration-300 hover:shadow-lg hover:border-app-line-strong",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}

/** Тихая надпись капителью над числом или разделом. */
export function Eyebrow({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "block text-[12px] font-bold tracking-[0.14em] text-app-dim-2 uppercase",
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * Главное число экрана: 36px на телефоне, 48px на широком.
 * Моноширинный намеренно — деньги и остатки читают колонкой, и цифры
 * обязаны стоять друг под другом.
 */
export function HeroStat({
  label,
  value,
  unit,
  hint,
  tone = "sapphire",
}: {
  label: string;
  value: string;
  unit?: string;
  hint?: React.ReactNode;
  tone?: "sapphire" | "ink" | "gold";
}) {
  const color =
    tone === "gold"
      ? "text-app-gold"
      : tone === "ink"
        ? "text-app-ink"
        : "text-app-sapphire";

  return (
    <div className="flex flex-col gap-2">
      <Eyebrow>{label}</Eyebrow>
      <span
        className={cn(
          "font-mono leading-none font-extrabold tracking-[-0.035em] num",
          "text-[clamp(36px,7vw,48px)]",
          color,
        )}
      >
        {value}
        {unit ? (
          <small className="ml-2 text-[0.36em] font-bold tracking-[0.06em] text-app-dim">
            {unit}
          </small>
        ) : null}
      </span>
      {hint ? <div className="text-[13px] text-app-dim">{hint}</div> : null}
    </div>
  );
}

/**
 * Число второго ряда: заметно меньше главного и серое.
 * Разница в кегле здесь — это и есть иерархия, без неё карточка
 * превращается в таблицу.
 */
export function SubStat({
  label,
  value,
  unit,
  tone = "dim",
}: {
  label: string;
  value: string;
  unit?: string;
  tone?: "dim" | "ok" | "low" | "out";
}) {
  const color = {
    dim: "text-app-ink",
    ok: "text-app-ok",
    low: "text-app-low",
    out: "text-app-out",
  }[tone];

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span
        className={cn(
          "font-mono text-[19px] leading-none font-bold tracking-[-0.02em] num",
          color,
        )}
      >
        {value}
        {unit ? (
          <small className="ml-1 text-[0.6em] font-semibold text-app-dim-2">
            {unit}
          </small>
        ) : null}
      </span>
      <span className="text-[11.5px] font-semibold tracking-[0.06em] text-app-dim-2 uppercase">
        {label}
      </span>
    </div>
  );
}

/** Заголовок раздела: капитель и крупное имя под ней, справа — действия. */
export function PageHead({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 pb-2 border-b border-app-line mb-4">
      <div className="flex min-w-0 flex-col gap-1.5">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="text-[clamp(28px,5vw,36px)] leading-none font-extrabold tracking-[-0.03em] text-app-ink drop-shadow-sm">
          {title}
        </h1>
      </div>
      {children ? (
        <div className="flex flex-wrap items-center gap-3">{children}</div>
      ) : null}
    </div>
  );
}
