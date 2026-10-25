"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { appOpen } from "@/lib/site";

type NavItem = { href: string; label: string };

/**
 * Мобильное меню. В макете на ≤620px навигация просто скрывалась
 * без замены — здесь добавлен бургер (DESIGN-SPEC.md П-7).
 */
export function MobileMenu({
  items,
  labels,
  children,
}: {
  items: NavItem[];
  labels: {
    open: string;
    close: string;
    signIn: string;
    cta: string;
    comingSoon: string;
  };
  /** Переключатели темы и языка: в шапке телефона для них нет места. */
  children?: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();

  // Закрытие по Escape и блокировка прокрутки под открытой панелью.
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  return (
    <div className="desktop:hidden">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-label={isOpen ? labels.close : labels.open}
        className="inline-flex size-11 items-center justify-center rounded-[10px] text-ink transition-colors hover:bg-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        {isOpen ? (
          <X className="size-6" aria-hidden />
        ) : (
          <Menu className="size-6" aria-hidden />
        )}
      </button>

      {isOpen ? (
        <div
          id={panelId}
          className="absolute inset-x-0 top-full border-b border-line bg-card px-6 pt-4 pb-6 shadow-lg"
        >
          <nav className="flex flex-col">
            {items.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="border-b border-line py-3.5 text-base font-semibold text-ink last:border-0 hover:text-brand-ink"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="mt-5 flex flex-col gap-3 tablet:hidden">
            {appOpen ? (
              <>
                <Button
                  href="/auth"
                  variant="secondary"
                  size="lg"
                  onClick={() => setIsOpen(false)}
                >
                  {labels.signIn}
                </Button>
                <Button href="/auth" size="lg" onClick={() => setIsOpen(false)}>
                  {labels.cta}
                </Button>
              </>
            ) : (
              <Button size="lg" disabled>
                {labels.comingSoon}
              </Button>
            )}
          </div>

          {children ? (
            <div className="mt-5 flex items-center justify-between border-t border-line pt-5 tablet:hidden">
              {children}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
