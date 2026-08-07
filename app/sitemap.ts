import type { MetadataRoute } from "next";

import { routing } from "@/i18n/routing";
import { absoluteUrl } from "@/lib/site";

/**
 * Карта сайта.
 *
 * Публичная страница пока одна — лендинг, но в трёх локалях. Каждая
 * запись перечисляет переводы через `alternates.languages`: без этого
 * поисковик считает версии конкурирующими страницами и выбирает одну
 * сам, обычно не ту.
 *
 * Разделы приложения (`lib/site.ts` → `privatePaths`) сюда не попадают
 * намеренно: снаружи они всё равно показывают форму входа, и держать их
 * в карте значило бы звать робота на страницы без содержимого.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(
    routing.locales.map((code) => [code, absoluteUrl(`/${code}`)]),
  );

  return routing.locales.map((locale) => ({
    url: absoluteUrl(`/${locale}`),
    lastModified: new Date(),
    changeFrequency: "monthly",
    // Русская версия — основная: с неё начинается корень сайта.
    priority: locale === routing.defaultLocale ? 1 : 0.8,
    alternates: { languages },
  }));
}
