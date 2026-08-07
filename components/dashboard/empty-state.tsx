"use client";

import { CheckCircle2, Circle, PackagePlus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyBlock } from "@/components/ui/empty";
import { cn } from "@/lib/cn";

interface Props {
  tenantName: string;
  productsCount: number;
  usersCount: number;
  salesCount: number;
}

/**
 * Первый экран нового магазина.
 *
 * «Нет данных» здесь было бы правдой и не было бы помощью: магазин
 * только что завели, данным взяться неоткуда. Поэтому экран не
 * оправдывается, а показывает три шага до первой продажи и ведёт к
 * первому из них.
 *
 * Пункт «пригласить продавца» опирается на реальные данные
 * (`usersCount > 1`), но настоящего приглашения в бэкенде ещё нет —
 * без пометки «скоро» этот пункт обманывал бы.
 */
export function EmptyState({
  tenantName,
  productsCount,
  usersCount,
  salesCount,
}: Props) {
  const t = useTranslations("dashboard.empty");

  const checklist = [
    { key: "addProduct", done: productsCount > 0, soon: false },
    { key: "inviteSeller", done: usersCount > 1, soon: true },
    { key: "firstSale", done: salesCount > 0, soon: false },
  ] as const;

  return (
    <EmptyBlock
      art="box"
      title={t("heading", { name: tenantName })}
      lead={t("lead")}
      action={
        <Button href="/inventory/new" size="xl">
          <PackagePlus className="size-5" aria-hidden />
          {t("cta")}
        </Button>
      }
      className="mx-auto max-w-[620px]"
    >
      <ul className="flex flex-col gap-2.5 text-left">
        {checklist.map((item) => (
          <li
            key={item.key}
            className={cn(
              "flex items-center gap-3 rounded-card border px-4.5 py-3.5",
              item.done
                ? "border-app-ok/20 bg-app-ok-soft"
                : "border-app-line bg-app-panel",
            )}
          >
            {item.done ? (
              <CheckCircle2
                className="size-5 shrink-0 text-app-ok"
                aria-hidden
              />
            ) : (
              <Circle className="size-5 shrink-0 text-app-dim-2" aria-hidden />
            )}
            <span
              className={cn(
                "flex-1 text-[14.5px] font-semibold",
                item.done ? "text-app-dim line-through" : "text-app-ink",
              )}
            >
              {t(`checklist.${item.key}`)}
            </span>
            {item.soon && !item.done ? <Badge>{t("soon")}</Badge> : null}
          </li>
        ))}
      </ul>
    </EmptyBlock>
  );
}
