import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section";

/** Ключи вопросов. Порядок — от того, что спрашивают чаще. */
export const FAQ_KEYS = [
  "start",
  "training",
  "data",
  "offline",
  "devices",
  "switch",
] as const;

/**
 * FAQ. Закрывает пункт 3.10 и расхождение Р-2: в макете блока не было,
 * а ТЗ п. 3 его рекомендует, и без него не собрать `FAQPage` в JSON-LD.
 *
 * Аккордеон на `<details>`/`<summary>` — ни строчки JavaScript. Браузер сам
 * даёт раскрытие, управление с клавиатуры и поиск по странице внутри
 * закрытых секций. Своя реализация на состоянии всё это пришлось бы
 * повторять руками и половину растерять.
 *
 * Вопросы — только про свою систему. Правило «без конкурентов» от
 * 2026-07-31 распространяется и сюда (Журнал решений).
 */
export function Faq() {
  const t = useTranslations("faq");

  return (
    <section id="faq" className="bg-page py-24">
      <Container>
        <div className="grid gap-12 desktop:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] desktop:gap-20">
          <div className="desktop:sticky desktop:top-28 desktop:self-start">
            <SectionHeader
              eyebrow={t("eyebrow")}
              title={t("title")}
              lead={t("lead")}
              align="left"
            />
          </div>

          <div className="flex flex-col">
            {FAQ_KEYS.map((key, index) => (
              <details
                key={key}
                className="reveal-item group border-b border-line first:border-t"
                style={{ "--i": index } as React.CSSProperties}
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-6 text-left transition-colors duration-200 marker:content-none hover:text-brand-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 [&::-webkit-details-marker]:hidden">
                  <h3 className="text-[17.5px] leading-snug font-bold text-balance">
                    {t(`items.${key}.q`)}
                  </h3>
                  <Plus
                    aria-hidden
                    className="mt-0.5 size-5 shrink-0 text-brand-600 transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none"
                  />
                </summary>
                <p className="max-w-[62ch] pb-6 text-body leading-relaxed text-pretty text-muted">
                  {t(`items.${key}.a`)}
                </p>
              </details>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
