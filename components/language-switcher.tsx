"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { Flag } from "@/components/flags";
import { Link, usePathname } from "@/i18n/navigation";
import { localeNames, routing, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/cn";

/**
 * Выпадающий список языков: флаг страны рядом с названием языка.
 *
 * Раньше это был ряд из трёх кодов (RU TG EN). Список компактнее и
 * сразу показывает, какой язык выбран.
 */
export function LanguageSwitcher({
  current,
  label,
  tone = "light",
}: {
  current: Locale;
  label: string;
  tone?: "light" | "dark";
}) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!isOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-label={label}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg py-1.5 pr-1.5 pl-2 text-[13px] font-bold uppercase transition-colors",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
          tone === "dark"
            ? "text-navy-text hover:bg-navy-rule hover:text-white"
            : "text-subtle hover:bg-surface hover:text-brand-ink",
        )}
      >
        <Flag locale={current} className="size-[18px]" />
        {current}
        <ChevronDown
          className={cn(
            "size-3.5 transition-transform duration-150 motion-reduce:transition-none",
            isOpen && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {isOpen ? (
        <div
          id={menuId}
          role="menu"
          className="absolute top-full right-0 z-50 mt-2 min-w-[168px] overflow-hidden rounded-xl border border-line bg-card py-1 shadow-[0_18px_40px_-20px_rgb(15_25_60/0.45)]"
        >
          {routing.locales.map((locale) => {
            const isActive = locale === current;

            return (
              <Link
                key={locale}
                href={pathname}
                locale={locale}
                role="menuitem"
                aria-current={isActive ? "true" : undefined}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold transition-colors",
                  isActive
                    ? "bg-brand-50 text-brand-ink"
                    : "text-ink hover:bg-surface",
                )}
              >
                <Flag locale={locale} className="size-5" />
                <span className="flex-1">{localeNames[locale]}</span>
                {isActive ? (
                  <Check className="size-4 text-brand-ink" aria-hidden />
                ) : null}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
