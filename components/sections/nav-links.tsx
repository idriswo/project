"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/cn";

type NavItem = { href: string; label: string };

/**
 * Навигация с подсветкой раздела, который сейчас на экране.
 *
 * Через IntersectionObserver, а не слушатель scroll: обработчик scroll
 * срабатывает на каждый кадр и грузит main thread, что бьёт по INP (ТЗ п. 4.3).
 */
export function NavLinks({ items }: { items: NavItem[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const sections = items
      .map((item) => document.getElementById(item.href.slice(1)))
      .filter((element): element is HTMLElement => element !== null);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Активным считаем самый верхний из видимых сейчас разделов.
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
          )[0];

        if (visible) setActiveId(visible.target.id);
      },
      {
        // Верхняя граница опущена на высоту хедера, нижняя поднята,
        // чтобы активным был раздел в середине экрана, а не любой задетый.
        rootMargin: "-76px 0px -55% 0px",
        threshold: 0,
      },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav className="hidden items-center gap-[34px] tablet:flex">
      {items.map((item) => {
        const isActive = activeId === item.href.slice(1);

        return (
          <a
            key={item.href}
            href={item.href}
            aria-current={isActive ? "true" : undefined}
            className={cn(
              "relative text-[15px] font-semibold transition-colors",
              "after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:rounded-full after:bg-brand-600",
              "after:transition-[width] after:duration-200 motion-reduce:after:transition-none",
              isActive
                ? "text-brand-ink after:w-full"
                : "text-ink after:w-0 hover:text-brand-ink",
            )}
          >
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}
