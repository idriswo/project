"use client";

import {
  Boxes,
  ChartColumn,
  IdCard,
  LayoutDashboard,
  LogOut,
  type LucideIcon,
  ScanLine,
  Shirt,
  Store,
  UserRound,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { clearActiveTenantId } from "@/lib/activeTenant";
import { cn } from "@/lib/cn";
import { type AppRole, navFor, type NavKey, tabsFor } from "@/lib/roles";
import { supabase } from "@/lib/supabase";

/**
 * Оболочка рабочих экранов (Этап 19).
 *
 * Рабочая область светлая (#F8FAFC), тёмным остался только столб
 * навигации: он отделяет «где я нахожусь» от «с чем я работаю», и
 * товар на белой карточке рядом с ним читается как товар, а не как
 * строка отчёта.
 *
 * Столб слева на широком экране, нижние вкладки на телефоне. Это не
 * два разных меню, а один список из `navFor(role)` — иначе продавец
 * увидел бы на телефоне то, чего нет на планшете.
 *
 * Иконки подписаны всегда. Ряд одинаковых серых пиктограмм без подписей
 * приходится запоминать; подпись читают.
 */

const ICONS: Record<NavKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  pos: ScanLine,
  customers: Users,
  floor: Shirt,
  warehouse: Boxes,
  reports: ChartColumn,
  staff: IdCard,
};

const HREFS: Record<NavKey, string> = {
  dashboard: "/dashboard",
  pos: "/pos",
  customers: "/customers",
  floor: "/floor",
  warehouse: "/warehouse",
  reports: "/reports",
  staff: "/staff",
};

function useActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({
  storeName,
  role,
  children,
}: {
  storeName?: string;
  role: AppRole;
  children: React.ReactNode;
}) {
  const t = useTranslations("app.nav");
  const isActive = useActive();
  const router = useRouter();
  const keys = navFor(role);

  /**
   * Выход живёт здесь, а не на странице настроек: у кассира раздел всего
   * один, и до настроек он мог бы не дойти. Активный магазин чистим до
   * `signOut` — иначе следующий человек за тем же прилавком унаследует
   * чужой выбор из localStorage (та же ошибка, что была в 16.19.1).
   */
  async function handleLogout() {
    clearActiveTenantId();
    await supabase.auth.signOut();
    router.push("/auth");
  }

  return (
    <div className="min-h-screen bg-app-bg text-app-ink">
      {/* ── Столб навигации: только широкий экран ──────────────── */}
      <aside
        className="fixed inset-y-0 left-0 z-30 hidden w-[236px] flex-col bg-app-navy desktop:flex"
        aria-label={t("label")}
      >
        <div className="flex flex-col gap-1 px-6 pt-7 pb-6">
          <span className="text-[15px] font-extrabold tracking-[0.16em] text-white uppercase">
            TIM
          </span>
          {storeName ? (
            <span className="truncate text-[12.5px] font-semibold text-navy-text">
              {storeName}
            </span>
          ) : null}
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3">
          {keys.map((key) => (
            <SideLink
              key={key}
              href={HREFS[key]}
              icon={ICONS[key]}
              label={t(key)}
              active={isActive(HREFS[key])}
            />
          ))}
        </nav>

        <div className="flex flex-col gap-1 px-3 pb-5">
          <SideLink
            href="/settings"
            icon={UserRound}
            label={t("profile")}
            active={isActive("/settings")}
          />
          <SideLink
            href="/stores"
            icon={Store}
            label={t("switchStore")}
            active={false}
          />
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14.5px] font-semibold text-navy-text transition-colors duration-150 hover:bg-white/6 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-sapphire-lift"
          >
            <LogOut className="size-[18px] shrink-0" aria-hidden />
            {t("logout")}
          </button>
        </div>
      </aside>

      {/* ── Шапка телефона и планшета ──────────────────────────── */}
      <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-app-line bg-app-card/85 px-5 py-3.5 backdrop-blur-sm desktop:hidden">
        <div className="flex min-w-0 items-baseline gap-3">
          <span className="text-[13px] font-extrabold tracking-[0.16em] text-app-ink uppercase">
            TIM
          </span>
          {storeName ? (
            <span className="truncate text-[12.5px] font-semibold text-app-dim">
              {storeName}
            </span>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/settings"
            aria-label={t("profile")}
            className="flex size-9 items-center justify-center rounded-full bg-app-panel text-app-dim transition-colors duration-150 hover:text-app-sapphire focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-sapphire"
          >
            <UserRound className="size-4.5" aria-hidden />
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            aria-label={t("logout")}
            className="flex size-9 items-center justify-center rounded-full bg-app-panel text-app-dim transition-colors duration-150 hover:text-app-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-sapphire"
          >
            <LogOut className="size-4.5" aria-hidden />
          </button>
        </div>
      </header>

      {/* Отступ снизу — под нижние вкладки, иначе они накрывают кнопку
       * «Продать», ровно ту, ради которой экран открыли. */}
      <main className="px-4 pt-5 pb-28 tablet:px-6 desktop:pt-8 desktop:pr-8 desktop:pb-10 desktop:pl-[268px]">
        {children}
      </main>

      <BottomTabs role={role} />
    </div>
  );
}

function SideLink({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14.5px] font-semibold",
        "transition-[background-color,color] duration-150",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-sapphire-lift",
        active
          ? // Полупрозрачный сапфир, а не сплошной: активный пункт должен
            // читаться как подсветка внутри столба, а не как кнопка поверх него.
            "bg-app-sapphire/28 text-white"
          : "text-navy-text hover:bg-white/6 hover:text-white",
      )}
    >
      <Icon className="size-[18px] shrink-0" aria-hidden />
      {label}
    </Link>
  );
}

function BottomTabs({ role }: { role: AppRole }) {
  const t = useTranslations("app.nav");
  const isActive = useActive();
  // Не `navFor`: в полосу помещаются четыре раздела, остальные живут в
  // профиле — иначе у владельца было бы восемь целей шириной по 40px.
  const keys = tabsFor(role);

  // Профиль — всегда последняя вкладка: у кассира разделов всего один,
  // и без него он не смог бы выйти из аккаунта.
  const tabs: { href: string; icon: LucideIcon; label: string }[] = [
    ...keys.map((key) => ({
      href: HREFS[key],
      icon: ICONS[key],
      label: t(key),
    })),
    { href: "/settings", icon: UserRound, label: t("profile") },
  ];

  return (
    <nav
      aria-label={t("label")}
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-app-line bg-app-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm desktop:hidden"
    >
      {tabs.map((tab) => {
        const active = isActive(tab.href);
        const Icon = tab.icon;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 pt-2 pb-2",
              "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-app-sapphire",
              active ? "text-app-sapphire" : "text-app-dim-2",
            )}
          >
            <span
              className={cn(
                "flex h-7 w-12 items-center justify-center rounded-full",
                "transition-[background-color] duration-150",
                // Мягкий круг под активной иконкой: подсветка видна боковым
                // зрением, и вкладку не приходится искать глазами.
                active ? "bg-app-sapphire-soft" : "bg-transparent",
              )}
            >
              <Icon className="size-[19px]" aria-hidden />
            </span>
            <span className="text-[10.5px] font-bold tracking-[0.02em]">
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
