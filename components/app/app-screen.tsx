"use client";

import { useTranslations } from "next-intl";

import { AppShell } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";
import { EmptyBlock } from "@/components/ui/empty";
import { useAppSession } from "@/lib/session";
import { type AppRole, homeFor } from "@/lib/roles";

/**
 * Оболочка одного рабочего экрана.
 *
 * Каждый экран из `design/STITCH-SCREENS.md` начинается одинаково:
 * спросить `/me`, обернуться в `AppShell`, проверить роль и, если
 * человеку сюда нельзя, показать не пустую страницу, а объяснение и
 * дорогу назад. Двадцать копий этого кода разъехались бы на третьем
 * экране, поэтому он живёт здесь.
 *
 * Ширина ограничена 1040px — той же, что у отчётов и дашборда: таблица
 * во весь 27-дюймовый монитор нечитаема, глаз теряет строку.
 */
export function AppScreen({
  allow,
  wide,
  children,
}: {
  /** Кому можно. Не указано — можно всем, у кого есть доступ в приложение. */
  allow?: readonly AppRole[];
  /** Приёмка и инвентаризация — широкие таблицы, им 1040px мало. */
  wide?: boolean;
  children: React.ReactNode;
}) {
  const t = useTranslations("app.access");
  const session = useAppSession();
  const permitted = !allow || allow.includes(session.role);

  return (
    <AppShell storeName={session.storeName} role={session.role}>
      <div
        className={
          wide
            ? "mx-auto w-full max-w-[1320px]"
            : "mx-auto w-full max-w-[1040px]"
        }
      >
        {permitted ? (
          children
        ) : (
          <EmptyBlock
            art="search"
            title={t("title")}
            lead={t("lead")}
            action={
              <Button href={homeFor(session.role)} size="xl" variant="sapphire">
                {t("cta")}
              </Button>
            }
          />
        )}
      </div>
    </AppShell>
  );
}
