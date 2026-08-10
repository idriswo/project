"use client";

import {
  Boxes,
  ChartColumn,
  ChevronRight,
  IdCard,
  LayoutDashboard,
  type LucideIcon,
  ScanLine,
  Shirt,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { SECTION_ICONS } from "@/components/app/sections";
import { DataCard, Eyebrow } from "@/components/ui/stat";
import { Link } from "@/i18n/navigation";
import {
  extraFor,
  type NavKey,
  SECTION_GROUPS,
  sectionsFor,
} from "@/lib/roles";
import { useAppSession } from "@/lib/session";

/**
 * Разделы, которые не поместились в нижние вкладки телефона.
 *
 * В полосе внизу четыре раздела — те, куда заходят каждый день. Отчёты и
 * сотрудники сюда не попали: их смотрят сидя, а не стоя у прилавка. Но
 * попасть в них с телефона всё равно надо, иначе владелец с телефоном
 * просто не найдёт свои отчёты.
 *
 * На широком экране блок скрыт: там столб слева показывает всё сразу, и
 * второй список тех же ссылок был бы шумом.
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

export function MoreSections() {
  const t = useTranslations("app.nav");
  const session = useAppSession();
  const keys = extraFor(session.role);

  if (session.loading) return null;

  return (
    <>
      {keys.length > 0 ? (
        <DataCard className="p-6 desktop:hidden">
          <Eyebrow>{t("more")}</Eyebrow>
          <div className="mt-3 flex flex-col">
            {keys.map((key) => (
              <Row
                key={key}
                href={HREFS[key]}
                icon={ICONS[key]}
                label={t(key)}
              />
            ))}
          </div>
        </DataCard>
      ) : null}

      {/* Разделы Этапа 20. Показываем и на телефоне тоже: в нижнюю полосу
       * помещаются четыре вкладки, а этих разделов семнадцать — без этого
       * списка с телефона до них не добраться вообще. */}
      {SECTION_GROUPS.map((group) => {
        const items = sectionsFor(session.role, group);
        if (items.length === 0) return null;

        return (
          <DataCard key={group} className="p-6 desktop:hidden">
            <Eyebrow>{t(`groups.${group}`)}</Eyebrow>
            <div className="mt-3 flex flex-col">
              {items.map((item) => (
                <Row
                  key={item.key}
                  href={item.href}
                  icon={SECTION_ICONS[item.key]}
                  label={t(`sections.${item.key}`)}
                />
              ))}
            </div>
          </DataCard>
        );
      })}
    </>
  );
}

function Row({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3.5 border-b border-app-line py-3.5 last:border-b-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-sapphire"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-card bg-app-panel text-app-sapphire">
        <Icon className="size-[18px]" aria-hidden />
      </span>
      <span className="flex-1 text-[14.5px] font-semibold text-app-ink">
        {label}
      </span>
      <ChevronRight className="size-4.5 shrink-0 text-app-dim-2" aria-hidden />
    </Link>
  );
}
