"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/cn";

/** Переключатель локали: сохраняет текущий путь, меняет только язык. */
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

  return (
    <nav aria-label={label} className="flex items-center gap-1">
      {routing.locales.map((locale) => {
        const isActive = locale === current;

        return (
          <Link
            key={locale}
            href={pathname}
            locale={locale}
            aria-current={isActive ? "true" : undefined}
            className={cn(
              "rounded-md px-2 py-1 text-[13px] font-bold uppercase transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
              isActive
                ? tone === "dark"
                  ? "bg-navy-rule text-white"
                  : "bg-brand-50 text-brand-600"
                : tone === "dark"
                  ? "text-navy-text hover:text-white"
                  : "text-subtle hover:text-brand-600",
            )}
          >
            {locale}
          </Link>
        );
      })}
    </nav>
  );
}
