import { getTranslations } from "next-intl/server";

import { FAQ_KEYS } from "@/components/sections/faq";
import type { Locale } from "@/i18n/routing";
import { absoluteUrl, siteUrl } from "@/lib/site";

/**
 * Структурированные данные лендинга (ТЗ п. 4.2).
 *
 * Пишется одним блоком `@graph`: так связанные сущности ссылаются друг на
 * друга по `@id`, и поисковик понимает, что приложение и организация —
 * одного продукта, а не два независимых объекта.
 *
 * Чего здесь намеренно нет:
 * - `contactPoint` у организации. Контакты в `lib/site.ts` — заглушки из
 *   макета (Б-8), и публиковать вымышленный телефон в поиске нельзя.
 * - `aggregateRating` и отзывы. Их не существует; размечать несуществующие
 *   оценки — прямой путь к ручным санкциям Google.
 * - `BreadcrumbList`. Внутренних страниц пока нет, цепочке неоткуда взяться.
 *
 * ⚠️ Валюта `UZS` соответствует ценам на видимой странице, но зависит от
 * нерешённого Б-10 (страна). Определится — править и здесь, и в текстах.
 */

const PLAN_KEYS = ["basic", "standard", "full"] as const;
const CURRENCY = "UZS";

/** «149 000» → «149000». Schema.org ждёт число, а не отформатированную строку. */
function toAmount(price: string): string {
  return price.replace(/[^\d.]/g, "") || "0";
}

export async function JsonLd({ locale }: { locale: Locale }) {
  const [meta, pricing, faq] = await Promise.all([
    getTranslations({ locale, namespace: "meta" }),
    getTranslations({ locale, namespace: "pricing" }),
    getTranslations({ locale, namespace: "faq" }),
  ]);

  const organizationId = `${siteUrl}/#organization`;
  const appId = `${siteUrl}/#software`;

  const graph = [
    {
      "@type": "Organization",
      "@id": organizationId,
      name: "TIM",
      url: siteUrl,
      description: meta("description"),
    },
    {
      "@type": "SoftwareApplication",
      "@id": appId,
      name: "TIM",
      applicationCategory: "BusinessApplication",
      // Веб-приложение: ставить нечего, работает в браузере.
      operatingSystem: "Web",
      url: absoluteUrl(`/${locale}`),
      description: meta("description"),
      publisher: { "@id": organizationId },
      offers: PLAN_KEYS.map((key) => ({
        "@type": "Offer",
        name: pricing(`plans.${key}.name`),
        price: toAmount(pricing(`plans.${key}.price`)),
        priceCurrency: CURRENCY,
        category: "subscription",
      })),
    },
    {
      "@type": "FAQPage",
      "@id": `${siteUrl}/#faq`,
      mainEntity: FAQ_KEYS.map((key) => ({
        "@type": "Question",
        name: faq(`items.${key}.q`),
        acceptedAnswer: { "@type": "Answer", text: faq(`items.${key}.a`) },
      })),
    },
  ];

  return (
    <script
      type="application/ld+json"
      // Данные наши собственные, из файлов переводов, а не пользовательский ввод.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": graph,
        }),
      }}
    />
  );
}
