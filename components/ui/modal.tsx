"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

import { cn } from "@/lib/cn";

/**
 * Модальное окно.
 *
 * Сделано на нативном `<dialog>`: браузер сам ставит фокус-ловушку,
 * закрывает по Escape и рисует подложку. Ручная реализация всего этого
 * обычно теряет что-нибудь одно, и чаще всего — возврат фокуса на
 * кнопку, из которой окно открыли.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      // Клик по подложке — это клик по самому <dialog>: содержимое лежит
      // во вложенном блоке, и до него событие не долетает.
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className={cn(
        "m-auto w-[min(560px,calc(100vw-32px))] rounded-frame bg-transparent p-0",
        "backdrop:bg-app-navy/45 backdrop:backdrop-blur-[2px]",
        className,
      )}
    >
      <div className="overflow-hidden rounded-frame border border-app-line bg-app-card shadow-[0_30px_70px_-30px_rgb(15_25_60/0.55)]">
        <div className="flex items-center justify-between gap-4 bg-app-navy px-5 py-4">
          <h2 className="text-[16px] font-extrabold text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-navy-text transition-colors duration-150 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-sapphire-lift"
          >
            <X className="size-4.5" aria-hidden />
            <span className="sr-only">{title}</span>
          </button>
        </div>

        <div className="flex flex-col gap-4 p-5">{children}</div>

        {footer ? (
          <div className="border-t border-app-line bg-app-panel p-5">
            {footer}
          </div>
        ) : null}
      </div>
    </dialog>
  );
}
