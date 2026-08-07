import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Manrope } from "next/font/google";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Script from "next/script";

import { themeInitScript, ThemeSync } from "@/components/theme-toggle";
import { routing } from "@/i18n/routing";
import "../globals.css";

/*
 * Manrope через next/font — шрифт самохостится, внешних запросов
 * к fonts.googleapis.com в runtime нет, layout shift отсутствует.
 * ТЗ п. 4.3, DESIGN-SPEC.md П-1.
 */
const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

/*
 * IBM Plex Mono — только числа приложения: остатки, артикулы, деньги.
 * Причина функциональная, а не вкусовая: остатки читают колонкой, и
 * цифры обязаны стоять друг под другом. Рядом с геометричным Manrope
 * её промышленная интонация ещё и слышна (Этап 17, вариант «Б»).
 */
const plexMono = IBM_Plex_Mono({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-mono",
  display: "swap",
});

/**
 * Цвет системной панели браузера на телефоне. Два значения, чтобы
 * панель совпадала с фоном страницы в обеих темах, а не оставалась
 * белой полосой над тёмным сайтом.
 */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0f1e" },
  ],
  // Масштабирование намеренно не запрещаем: это ломает доступность
  // для тех, кто увеличивает текст.
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/** Все локали известны заранее → страницы собираются статически (SSG). */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Включает статический рендеринг вместо динамического.
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      className={`${manrope.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-page font-sans antialiased">
        {/* Выставляет сохранённую тему до первой отрисовки, иначе страница
            мигает светлой темой перед загрузкой React. Через next/script,
            а не голый <script>: React 19 ругается на script-теги внутри
            дерева компонентов. */}
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>

        {/* Возвращает data-theme после клиентских переходов: при смене
            локали React сбрасывает атрибут, а скрипт выше повторно
            не выполняется. */}
        <ThemeSync />

        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
