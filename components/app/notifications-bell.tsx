"use client";

import { Bell, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { NotificationsPanel } from "@/components/app/notifications-panel";
import { fetchUnreadCount } from "@/lib/api/notifications";
import { cn } from "@/lib/cn";

/**
 * Колокольчик уведомлений (Э-22) и выдвижная панель (Э-15).
 *
 * Точка на колокольчике — единственное, что видно постоянно, поэтому
 * она обязана значить «есть непрочитанное», а не «есть уведомления
 * вообще»: иначе через день на неё перестают смотреть.
 *
 * Панель выезжает справа и не уводит со страницы. Уведомление чаще
 * всего читают посреди другой работы, и терять место — дорого.
 */
export function NotificationsBell({
  tone = "dark",
}: {
  tone?: "dark" | "light";
}) {
  const t = useTranslations("app.notifications");
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  // Счётчик перечитывается при каждом открытии и закрытии: внутри панели
  // человек мог отметить всё прочитанным.
  useEffect(() => {
    let alive = true;
    fetchUnreadCount()
      .then((value) => alive && setUnread(value))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [open]);

  // Escape закрывает панель — то же поведение, что у модального окна.
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("open", { count: unread })}
        className={cn(
          "relative flex size-9 shrink-0 items-center justify-center rounded-full",
          "transition-colors duration-150",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-sapphire",
          tone === "dark"
            ? "text-navy-text hover:bg-white/8 hover:text-white"
            : "bg-app-panel text-app-dim hover:text-app-sapphire",
        )}
      >
        <Bell className="size-4.5" aria-hidden />
        {unread > 0 ? (
          <span
            aria-hidden
            className="absolute top-1.5 right-1.5 size-2.5 rounded-full bg-app-out ring-2 ring-app-navy"
          />
        ) : null}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            aria-label={t("close")}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-app-navy/45 backdrop-blur-[2px]"
          />

          <aside
            role="dialog"
            aria-modal="true"
            aria-label={t("title")}
            className="relative flex h-full w-[min(420px,100vw)] flex-col overflow-y-auto bg-app-card p-5 shadow-[-24px_0_60px_-30px_rgb(15_25_60/0.6)]"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t("close")}
              className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full text-app-dim-2 transition-colors duration-150 hover:bg-app-panel hover:text-app-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-sapphire"
            >
              <X className="size-4.5" aria-hidden />
            </button>

            <NotificationsPanel compact />
          </aside>
        </div>
      ) : null}
    </>
  );
}
