"use client";

import { cn } from "@/lib/cn";

/**
 * Переключатель из двух-четырёх взаимоисключающих вариантов:
 * «Сегодня / Неделя / Месяц», «Склад / Торговый зал», «Режим сканера /
 * Ручной режим».
 *
 * Выпадающий список для трёх вариантов — лишний клик и спрятанный от
 * глаз выбор. Здесь все варианты видны сразу, и видно, какой сейчас.
 */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  size = "md",
  ariaLabel,
  className,
}: {
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (next: T) => void;
  size?: "sm" | "md";
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex rounded-btn border border-app-line bg-app-panel p-1",
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-[8px] font-bold whitespace-nowrap",
              "transition-[background-color,color] duration-150",
              "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-app-sapphire",
              size === "sm"
                ? "px-3 py-1.5 text-[12.5px]"
                : "px-4 py-2 text-[13.5px]",
              active
                ? "bg-app-sapphire text-white shadow-[0_6px_14px_-10px_rgb(15_82_186/0.9)]"
                : "text-app-dim hover:text-app-ink",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Фильтры-пилюли: в отличие от `Segmented`, живут в потоке и переносятся
 * на вторую строку. Используются там, где вариантов может стать много —
 * категории, типы уведомлений, типы документов.
 */
export function PillFilter<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  className,
}: {
  value: T;
  options: readonly { value: T; label: string; count?: number }[];
  onChange: (next: T) => void;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn("flex flex-wrap gap-2", className)}
    >
      {options.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5",
              "text-[13px] font-bold transition-colors duration-150",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-sapphire",
              active
                ? "border-app-navy bg-app-navy text-white"
                : "border-app-line bg-app-card text-app-dim hover:border-app-sapphire hover:text-app-sapphire",
            )}
          >
            {option.label}
            {typeof option.count === "number" ? (
              <span
                className={cn(
                  "font-mono text-[11.5px] font-bold num",
                  active ? "text-white/70" : "text-app-dim-2",
                )}
              >
                {option.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
