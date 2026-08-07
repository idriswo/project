import { useTranslations } from "next-intl";

import {
  CheckoutMockup,
  MoneyMockup,
  StaffMockup,
  StockMockup,
} from "@/components/sections/mockups";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section";
import { cn } from "@/lib/cn";
import { anchors } from "@/lib/site";

type Key = "warehouse" | "checkout" | "accounting" | "staff";

const ORDER: Key[] = ["warehouse", "checkout", "accounting", "staff"];

/**
 * Возможности системы: склад, касса, бухгалтерия, сотрудники.
 *
 * Зигзаг, а не сетка карточек (Этап 18.1). Раньше здесь стояли четыре
 * одинаковых блока «иконка сверху, заголовок, абзац» — ровно тот шаблон,
 * который заказчик отдельно попросил убрать. Иконка ничего не объясняет
 * про склад; кривая остатков объясняет.
 *
 * Стороны чередуются через `even:` на строке: текст и мокап меняются
 * местами, поэтому глаз не залипает на одном ритме.
 *
 * На месте блока «Проблема» из макета. Тот строился на сравнении с
 * конкурентом — по решению заказчика от 2026-07-31 сайт говорит только
 * о собственном продукте (см. Журнал решений в ROADMAP.md).
 */
export function Features() {
  const t = useTranslations("features");

  const shots = {
    warehouse: (
      <StockMockup
        labels={{
          tab: t("mockup.tabStock"),
          product: t("mockup.product"),
          product2: t("mockup.product2"),
        }}
      />
    ),
    checkout: (
      <CheckoutMockup
        labels={{
          tab: t("mockup.tabCheckout"),
          product: t("mockup.product"),
          product2: t("mockup.product2"),
          color: t("mockup.color"),
          color2: t("mockup.color2"),
          total: t("mockup.total"),
          sell: t("mockup.sell"),
        }}
      />
    ),
    accounting: (
      <MoneyMockup
        labels={{
          tab: t("mockup.tabMoney"),
          revenue: t("mockup.revenue"),
          profit: t("mockup.profit"),
          sales: t("mockup.sales"),
          debt: t("mockup.debt"),
        }}
      />
    ),
    staff: (
      <StaffMockup
        labels={{
          tab: t("mockup.tabStaff"),
          roleSeller: t("mockup.roleSeller"),
          roleOwner: t("mockup.roleOwner"),
        }}
      />
    ),
  } satisfies Record<Key, React.ReactNode>;

  return (
    <section id={anchors.features.slice(1)} className="bg-page pt-26 pb-10">
      <Container>
        <SectionHeader
          eyebrow={t("eyebrow")}
          title={t("title")}
          lead={t("lead")}
        />

        <div className="mt-16 flex flex-col gap-20 desktop:gap-28">
          {ORDER.map((key, index) => (
            <article
              key={key}
              className={cn(
                "reveal-item grid items-center gap-8 desktop:grid-cols-2 desktop:gap-16",
                // Каждый второй ряд разворачивается: мокап уходит влево.
                index % 2 === 1 && "desktop:[&>*:first-child]:order-2",
              )}
              style={{ "--i": index } as React.CSSProperties}
            >
              <div className="flex flex-col items-start gap-4">
                <span className="font-mono text-[11px] tracking-[0.18em] text-subtle uppercase">
                  {t(`items.${key}.label`)}
                </span>
                <h3 className="text-[clamp(24px,3.4vw,32px)] leading-tight font-extrabold tracking-[-0.028em] text-balance">
                  {t(`items.${key}.title`)}
                </h3>
                {/* Тонкая сапфировая черта под заголовком — из брифа. */}
                <span className="h-px w-14 bg-brand-600" />
                <p className="max-w-[46ch] text-lead leading-relaxed text-pretty text-muted">
                  {t(`items.${key}.text`)}
                </p>
              </div>

              {shots[key]}
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
