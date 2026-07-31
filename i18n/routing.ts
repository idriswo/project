import { defineRouting } from "next-intl/routing";

/**
 * Локали проекта. Решение зафиксировано в ROADMAP.md:
 * мультиязычность закладывается сразу, чтобы позже не переделывать
 * роутинг, sitemap и hreflang (ТЗ п. 4.4).
 */
export const routing = defineRouting({
  locales: ["ru", "tg", "en"],
  defaultLocale: "ru",
});

export type Locale = (typeof routing.locales)[number];

/** Соответствие локали и значения атрибута lang / hreflang. */
export const localeNames: Record<Locale, string> = {
  ru: "Русский",
  tg: "Тоҷикӣ",
  en: "English",
};
