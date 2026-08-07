"use client";

import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

/**
 * Оболочка рабочих экранов магазина (Этап 17, вариант «Б»).
 *
 * Приложение всегда тёмное — в отличие от лендинга, у которого две темы.
 * Товар и числа светятся на глубокой сини, как вещи под софитами вечером.
 * Поэтому здесь используются токены `--color-app-*`, которые темой лендинга
 * не двигаются.
 *
 * Навигации всего четыре пункта, поэтому она горизонтальная: боковое меню
 * съело бы у планшета 240 пикселей ширины ради четырёх ссылок.
 */

const TABS = [
  { href: "/pos", key: "pos" },
  { href: "/floor", key: "floor" },
  { href: "/warehouse", key: "warehouse" },
  { href: "/dashboard", key: "reports" },
] as const;

export function AppShell({
  storeName,
  children,
}: {
  storeName?: string;
  children: React.ReactNode;
}) {
  const t = useTranslations("app.nav");
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-app-navy text-white">
      <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-white/8 px-5 py-4 tablet:px-6">
        <div className="flex items-baseline gap-3.5">
          <span className="text-sm font-extrabold tracking-[0.13em] uppercase">
            TIM
          </span>
          {storeName ? (
            <span className="truncate text-[12.5px] text-app-dim-2">
              {storeName}
            </span>
          ) : null}
        </div>

        <nav aria-label={t("label")} className="flex flex-wrap gap-x-5 gap-y-2">
          {TABS.map((tab) => {
            const active =
              pathname === tab.href || pathname.startsWith(`${tab.href}/`);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-sm text-[12.5px] tracking-[0.09em] uppercase transition-colors duration-150",
                  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-app-sapphire-lift",
                  active
                    ? "font-semibold text-white"
                    : "text-app-dim-2 hover:text-app-dim",
                )}
              >
                {t(tab.key)}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/stores"
          className="rounded-sm text-[12.5px] text-app-dim-2 transition-colors duration-150 hover:text-app-dim focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-app-sapphire-lift"
        >
          {t("switchStore")}
        </Link>
      </header>

      {children}
    </div>
  );
}

/** Заголовок раздела: тихая надпись капителью и крупное имя под ней. */
export function SectionHead({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-5 gap-y-4 px-5 pt-6 pb-1.5 tablet:px-6">
      <div className="flex flex-col gap-1.5">
        <span className="font-mono text-[10.5px] tracking-[0.22em] text-app-dim-2 uppercase">
          {eyebrow}
        </span>
        <b className="text-[clamp(26px,4vw,34px)] leading-none font-extrabold tracking-[-0.032em]">
          {title}
        </b>
      </div>
      {children ? (
        <div className="flex flex-wrap items-end gap-7">{children}</div>
      ) : null}
    </div>
  );
}

/** Число с подписью под ним. Золото — только когда цифра требует действия. */
export function HeadStat({
  value,
  label,
  gold,
}: {
  value: string;
  label: string;
  gold?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span
        className={cn(
          "font-mono text-[21px] font-bold tracking-[-0.02em] tabular-nums",
          gold ? "text-app-gold" : "text-white",
        )}
      >
        {value}
      </span>
      <span className="font-mono text-[10.5px] tracking-[0.13em] text-app-dim-2 uppercase">
        {label}
      </span>
    </div>
  );
}
