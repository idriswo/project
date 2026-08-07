import type { MetadataRoute } from "next";

import { routing } from "@/i18n/routing";
import { absoluteUrl, privatePaths } from "@/lib/site";

/**
 * robots.txt.
 *
 * Лендинг открыт, личный кабинет закрыт. Пути перечисляются с локалью и
 * без неё: `/ru/pos` — реальный адрес, `/pos` — то, куда ведёт редирект
 * с корня, и робот может встретить обе формы.
 *
 * Важно: `robots.txt` — просьба, а не запрет. Страницы приложения дополнительно
 * помечены `noindex` в метаданных (ROADMAP 5.10); одного файла было бы мало.
 */
export default function robots(): MetadataRoute.Robots {
  const disallow = privatePaths.flatMap((path) => [
    path,
    ...routing.locales.map((locale) => `/${locale}${path}`),
  ]);

  return {
    rules: [{ userAgent: "*", allow: "/", disallow }],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
