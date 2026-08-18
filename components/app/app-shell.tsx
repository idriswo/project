"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Boxes,
  ChartColumn,
  IdCard,
  LayoutDashboard,
  LogOut,
  type LucideIcon,
  ScanLine,
  Shirt,
  UserRound,
  Users,
  Wallet,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  ChefHat,
  UtensilsCrossed,
  CalendarClock,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { NotificationsBell } from "@/components/app/notifications-bell";
import { SECTION_ICONS } from "@/components/app/sections";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { clearActiveTenantId } from "@/lib/activeTenant";
import { cn } from "@/lib/cn";
import {
  type AppRole,
  navFor,
  type NavKey,
  SECTION_GROUPS,
  type SectionGroup,
  sectionsFor,
  tabsFor,
  groupForPath
} from "@/lib/roles";
import { type AppSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";

/**
 * Оболочка рабочих экранов (Этап 19 + Two-Tier Sidebar).
 */

const ICONS: Record<NavKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  pos: ScanLine,
  customers: Users,
  floor: Shirt,
  warehouse: Boxes,
  reports: ChartColumn,
  staff: IdCard,
  kitchen: ChefHat,
  tables: UtensilsCrossed,
  booking: CalendarClock,
};

const HREFS: Record<NavKey, string> = {
  dashboard: "/dashboard",
  pos: "/pos",
  customers: "/customers",
  floor: "/floor",
  warehouse: "/warehouse",
  reports: "/reports",
  staff: "/staff",
  kitchen: "/kitchen",
  tables: "/tables",
  booking: "/booking",
};

const TIER1_ICONS: Record<"main" | SectionGroup, LucideIcon> = {
  main: LayoutDashboard,
  goods: Boxes,
  money: Wallet,
  analytics: ChartColumn,
  clients: Users,
  docs: Settings,
};

function getGroupHref(group: "main" | SectionGroup, role: AppRole, sphere: string, activeModules: string[]): string {
  if (group === "main") return HREFS[navFor(role, sphere, activeModules)[0]];
  const items = sectionsFor(role, group);
  return items.length > 0 ? items[0].href : "/dashboard";
}

function useActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({
  session,
  children,
}: {
  session: AppSession;
  children: React.ReactNode;
}) {
  const storeName = session.storeName;
  const role = session.role;
  const sphere = session.sphere;
  const activeModules = session.activeModules;
  const t = useTranslations("app.nav");
  const isActive = useActive();
  const pathname = usePathname();
  const router = useRouter();
  
  // State for collapsible sidebar
  const [isPinned, setIsPinned] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("tim-sidebar-pinned");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved !== null) setIsPinned(saved === "true");
  }, []);

  const togglePin = () => {
    setIsPinned((prev) => {
      const next = !prev;
      localStorage.setItem("tim-sidebar-pinned", next.toString());
      return next;
    });
  };

  const activeGroup = groupForPath(pathname);
  const mainKeys = navFor(role, sphere, activeModules);
  const availableGroups: ("main" | SectionGroup)[] = (["main"] as ("main" | SectionGroup)[]).concat(
    SECTION_GROUPS.filter((g) => sectionsFor(role, g).length > 0)
  );

  const isSidebarOpen = isPinned || isHovered;

  async function handleLogout() {
    clearActiveTenantId();
    await supabase.auth.signOut();
    router.push("/auth");
  }

  return (
    <div className="min-h-screen bg-app-bg text-app-ink">
      {/* ── Two-Tier Sidebar Wrapper ────────────────────────── */}
      <div 
        className="fixed inset-y-0 left-0 z-40 hidden desktop:flex group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Tier 1: Узкий сайдбар с иконками */}
        <aside
          className="z-20 w-[72px] h-full flex-col items-center bg-[#051130] py-7 flex relative shadow-2xl"
          aria-label="Primary navigation"
        >
          <div className="flex w-full justify-center pb-6">
             <img src="/icon-192.png" alt="TIM" className="size-8 rounded-lg" />
          </div>
          
          <nav className="flex w-full flex-1 flex-col items-center gap-3 overflow-visible pt-2 pb-4">
            {availableGroups.map((group) => (
              <Tier1Link
                key={group}
                href={getGroupHref(group, role, sphere, activeModules)}
                icon={TIER1_ICONS[group]}
                label={t(`groups.${group}`)}
                active={activeGroup === group}
                showTooltip={!isSidebarOpen}
              />
            ))}
          </nav>
          
          <div className="flex flex-col items-center gap-4 pt-4">
            <NotificationsBell tone="light" />
            <Tier1Link
              href="/settings"
              icon={UserRound}
              label={t("profile")}
              active={isActive("/settings")}
              showTooltip={!isSidebarOpen}
            />
          </div>
        </aside>

        {/* Tier 2: Меню выбранной категории */}
        <aside
          className={cn(
            "flex flex-col bg-app-navy/95 backdrop-blur-md z-10 transition-all duration-300 overflow-hidden h-full",
            isPinned 
              ? "w-[236px] border-r border-[#1a2b5e] opacity-100 shadow-none" 
              : isHovered 
                ? "w-[236px] border-r border-[#1a2b5e] opacity-100 shadow-[20px_0_40px_rgba(0,0,0,0.5)]" 
                : "w-0 border-r-0 border-transparent opacity-0 shadow-none"
          )}
          aria-label={t("label")}
        >
          <div className="w-[236px] flex flex-col h-full">
            <div className="flex items-start justify-between gap-2 px-6 pt-7 pb-6">
              <div className="flex min-w-0 flex-col gap-1">
                <span className="text-[12px] font-extrabold tracking-[0.2em] text-white/80 uppercase">
                  {t(`groups.${activeGroup}`)}
                </span>
                {storeName ? (
                  <span className="truncate text-[12px] font-medium text-navy-text">
                    {storeName}
                  </span>
                ) : null}
              </div>
              
              <button 
                onClick={togglePin} 
                className="text-navy-dim hover:text-white transition-colors p-1"
                title={isPinned ? "Скрыть панель" : "Закрепить панель"}
              >
                {isPinned ? <PanelLeftClose className="size-4.5" /> : <PanelLeftOpen className="size-4.5" />}
              </button>
            </div>

            <nav className="custom-scrollbar flex flex-1 flex-col gap-1 overflow-y-auto px-3 pb-4">
              {activeGroup === "main" && mainKeys.map((key) => (
                <SideLink
                  key={key}
                  href={HREFS[key]}
                  icon={ICONS[key]}
                  label={t(key)}
                  active={isActive(HREFS[key])}
                />
              ))}

              {activeGroup !== "main" && (
                <div className="flex flex-col gap-1">
                  {sectionsFor(role, activeGroup).map((item) => (
                    <SideLink
                      key={item.key}
                      href={item.href}
                      icon={SECTION_ICONS[item.key]}
                      label={t(`sections.${item.key}`)}
                      active={isActive(item.href)}
                    />
                  ))}
                </div>
              )}
            </nav>
          </div>
        </aside>
      </div>

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
          <NotificationsBell tone="light" />
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

      {/* Отступ снизу — под нижние вкладки, отступ слева — под два сайдбара */}
      <main 
        className={cn(
          "px-4 pt-5 pb-28 tablet:px-6 desktop:pt-8 desktop:pr-8 desktop:pb-10 transition-[padding] duration-300",
          isPinned ? "desktop:pl-[340px]" : "desktop:pl-[104px]"
        )}
      >
        {children}
      </main>

      <BottomTabs session={session} />
    </div>
  );
}

function Tier1Link({
  href,
  icon: Icon,
  label,
  active,
  showTooltip = true,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
  showTooltip?: boolean;
}) {
  return (
    <div className="group relative flex justify-center">
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "relative flex size-[44px] items-center justify-center rounded-xl transition-colors duration-200 z-10",
          active ? "text-white" : "text-white/50 hover:text-white"
        )}
      >
        {active && (
          <motion.div
            layoutId="tier1Active"
            className="absolute inset-0 rounded-xl bg-app-sapphire/80 shadow-[0_0_15px_rgba(37,99,235,0.4)] -z-10"
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
          />
        )}
        <Icon className="size-[22px] relative z-20" aria-hidden />
      </Link>
      {showTooltip && (
        <div className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 rounded-lg bg-zinc-800/95 backdrop-blur-sm px-3 py-1.5 text-[12.5px] font-bold tracking-wide text-white opacity-0 shadow-xl border border-white/10 transition-all duration-200 group-hover:opacity-100 whitespace-nowrap z-50">
          {label}
        </div>
      )}
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
        "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold tracking-[0.02em]",
        "transition-colors duration-200 z-10",
        active
          ? "text-white"
          : "text-white/60 hover:text-white hover:bg-white/5",
      )}
    >
      {active && (
        <motion.div
          layoutId="sideLinkActive"
          className="absolute inset-0 rounded-xl bg-white/10 shadow-sm backdrop-blur-sm -z-10 border border-white/5"
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
        />
      )}
      <Icon className="size-[18px] shrink-0 relative z-20" aria-hidden />
      <span className="relative z-20">{label}</span>
    </Link>
  );
}

function BottomTabs({ session }: { session: AppSession }) {
  const t = useTranslations("app.nav");
  const isActive = useActive();
  // Не `navFor`: в полосу помещаются четыре раздела, остальные живут в
  // профиле — иначе у владельца было бы восемь целей шириной по 40px.
  const keys = tabsFor(session.role, session.sphere, session.activeModules);

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
