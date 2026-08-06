"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/cn";

/**
 * Кнопка возврата наверх. Страница длинная (около 4000px), без неё
 * подъём к форме регистрации требует долгой прокрутки.
 *
 * Видимость определяется наблюдением за Hero, а не слушателем scroll:
 * так нет работы на каждый кадр прокрутки.
 */
export function BackToTop({ label }: { label: string }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("top");
    if (!hero) return;

    // Кнопка появляется, когда Hero целиком ушёл вверх за экран.
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(!entry.isIntersecting),
      { rootMargin: "-80px 0px 0px 0px", threshold: 0 },
    );

    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  function scrollToTop() {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label={label}
      tabIndex={isVisible ? 0 : -1}
      aria-hidden={!isVisible}
      className={cn(
        // bottom учитывает safe-area: на iPhone с жестовой полосой
        // кнопка иначе прижимается к самому краю и попадает под неё.
        "fixed right-5 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-40",
        "flex size-12 items-center justify-center rounded-full",
        "border border-line bg-card text-brand-ink shadow-[0_10px_30px_-12px_rgb(15_25_60/0.45)]",
        "transition-[opacity,transform] duration-200",
        "hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
        "motion-reduce:transition-none",
        isVisible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0",
      )}
    >
      <ArrowUp className="size-5" aria-hidden />
    </button>
  );
}
