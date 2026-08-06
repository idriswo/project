"use client";

import { CheckCircle2, Circle, PackagePlus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

interface Props {
  tenantName: string;
  productsCount: number;
  usersCount: number;
  salesCount: number;
}

/**
 * Чеклисти "даъвати корманд" ба маълумоти воқеӣ (usersCount > 1) такя
 * мекунад, вале ягон роҳи воқеии даъват дар backend ҳанӯз нест — бинобар
 * ин бидуни матни "тez мешавад" ин банд фиреб медод.
 */
export function EmptyState({ tenantName, productsCount, usersCount, salesCount }: Props) {
  const t = useTranslations("dashboard.empty");

  const checklist = [
    { key: "addProduct", done: productsCount > 0, soon: false },
    { key: "inviteSeller", done: usersCount > 1, soon: true },
    { key: "firstSale", done: salesCount > 0, soon: false },
  ] as const;

  return (
    <div className="mx-auto max-w-[560px] rounded-[20px] border border-line bg-card p-8 text-center shadow-[0_1px_3px_rgba(0,0,0,0.08)] tablet:p-12">
      <h1 className="text-[26px] font-extrabold tracking-[-0.6px] text-balance">
        {t("heading", { name: tenantName })}
      </h1>
      <p className="mt-2.5 text-body leading-normal text-pretty text-subtle">{t("lead")}</p>

      <Link
        href="/inventory/new"
        className="mt-8 inline-flex h-14.5 items-center justify-center gap-2 rounded-card bg-accent-500 px-8 text-[17px] font-extrabold text-on-accent shadow-[0_12px_24px_-12px_rgb(242_166_35/0.7)] transition-[background,transform] duration-150 hover:-translate-y-0.5 hover:bg-accent-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 active:translate-y-0 motion-reduce:hover:translate-y-0"
      >
        <PackagePlus className="size-5" aria-hidden />
        {t("cta")}
      </Link>

      <ul className="mt-10 flex flex-col gap-3 text-left">
        {checklist.map((item) => (
          <li
            key={item.key}
            className={cn(
              "flex items-center gap-3 rounded-card border border-line px-4.5 py-3.5",
              item.done ? "bg-success/5" : "bg-surface",
            )}
          >
            {item.done ? (
              <CheckCircle2 className="size-5 shrink-0 text-success" aria-hidden />
            ) : (
              <Circle className="size-5 shrink-0 text-subtle" aria-hidden />
            )}
            <span
              className={cn(
                "flex-1 font-semibold",
                item.done ? "text-subtle line-through" : "text-ink",
              )}
            >
              {t(`checklist.${item.key}`)}
            </span>
            {item.soon && !item.done ? (
              <span className="shrink-0 rounded-full bg-line px-2.5 py-1 text-[11px] font-bold whitespace-nowrap text-subtle">
                {t("soon")}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
