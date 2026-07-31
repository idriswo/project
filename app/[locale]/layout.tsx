import type { Metadata } from "next";
import { Manrope } from "next/font/google";
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
    <html lang={locale} className={manrope.variable} suppressHydrationWarning>
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
