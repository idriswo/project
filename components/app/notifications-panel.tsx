"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { EmptyBlock } from "@/components/ui/empty";
import { MockNotice } from "@/components/ui/mock-notice";
import { PillFilter } from "@/components/ui/segmented";
import { ListSkeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import {
  type AppNotification,
  dismissNotification,
  fetchNotifications,
  markAllRead,
  markRead,
  type NotificationKind,
} from "@/lib/api/notifications";
import { cn } from "@/lib/cn";

/**
 * Список уведомлений (Э-15).
 *
 * Один компонент на две поверхности: выдвижную панель из шапки и
 * страницу `/notifications`. Список один и тот же, и расходиться им
 * нельзя — иначе в панели и на странице окажутся разные новости.
 *
 * Важность показана полосой слева и подписью, а не только цветом:
 * красная полоска без слова «критическое» ничего не сообщает тому, кто
 * не различает красный и зелёный.
 */

type Filter = "all" | NotificationKind;

const TONE: Record<NotificationKind, string> = {
  critical: "bg-app-out",
  stock: "bg-app-low",
  order: "bg-app-sapphire",
  system: "bg-app-dim-2",
};

export function NotificationsPanel({ compact }: { compact?: boolean }) {
  const t = useTranslations("app.notifications");
  const [items, setItems] = useState<AppNotification[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  const load = useCallback(() => {
    fetchNotifications()
      .then(setItems)
      .catch(() => {});
  }, []);

  useEffect(load, [load]);

  const all = items ?? [];
  const visible = all.filter(
    (item) => filter === "all" || item.kind === filter,
  );

  async function handleReadAll() {
    await markAllRead();
    load();
  }

  async function handleDismiss(id: string) {
    await dismissNotification(id);
    load();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          className={cn(
            "font-extrabold tracking-[-0.02em] text-app-ink",
            compact ? "text-[19px]" : "text-[clamp(24px,4vw,30px)]",
          )}
        >
          {t("title")}
        </h2>
        <button
          type="button"
          onClick={handleReadAll}
          className="text-[13px] font-bold text-app-sapphire underline underline-offset-2 transition-colors duration-150 hover:text-[#0b3f8f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-sapphire"
        >
          {t("markAllRead")}
        </button>
      </div>

      {compact ? null : <MockNotice text={t("mock")} />}

      <PillFilter
        ariaLabel={t("filterLabel")}
        value={filter}
        onChange={setFilter}
        options={[
          { value: "all", label: t("filters.all") },
          { value: "critical", label: t("filters.critical") },
          { value: "order", label: t("filters.order") },
          { value: "stock", label: t("filters.stock") },
          { value: "system", label: t("filters.system") },
        ]}
      />

      {!items ? (
        <ListSkeleton rows={3} />
      ) : visible.length === 0 ? (
        <EmptyBlock
          art="search"
          title={t("emptyTitle")}
          lead={t("emptyLead")}
        />
      ) : (
        <ul className="flex flex-col divide-y divide-app-line border-y border-app-line">
          {visible.map((item) => (
            <li
              key={item.id}
              className={cn(
                "flex gap-3 py-4",
                !item.read && "bg-app-sapphire-soft/40",
              )}
            >
              <span
                aria-hidden
                className={cn("w-1 shrink-0 rounded-full", TONE[item.kind])}
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                  <span className="font-extrabold text-app-ink">
                    {item.title}
                  </span>
                  <span className="text-[11.5px] font-bold tracking-[0.06em] text-app-dim-2 uppercase">
                    {t(`kinds.${item.kind}`)}
                  </span>
                </div>

                <p className="mt-1 text-[13.5px] leading-snug text-app-dim">
                  {item.body}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                  {item.actionHref ? (
                    <Link
                      href={item.actionHref}
                      onClick={() => markRead(item.id)}
                      className="text-[13px] font-bold text-app-sapphire underline underline-offset-2"
                    >
                      {item.actionLabel}
                    </Link>
                  ) : null}
                  <span className="text-[12px] text-app-dim-2">
                    {item.time}
                  </span>
                </div>
              </div>

              <button
                type="button"
                aria-label={t("dismiss")}
                onClick={() => handleDismiss(item.id)}
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-app-dim-2 transition-colors duration-150 hover:bg-app-panel hover:text-app-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-sapphire"
              >
                <X className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      {compact ? (
        <Link
          href="/notifications"
          className="rounded-btn bg-app-sapphire px-4 py-3 text-center text-[14px] font-bold text-white transition-colors duration-150 hover:bg-[#0b3f8f]"
        >
          {t("viewAll")}
        </Link>
      ) : null}
    </div>
  );
}
