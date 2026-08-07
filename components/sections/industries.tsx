import {
  Briefcase,
  ShoppingBasket,
  Shirt,
  Store,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { CurveMockup } from "@/components/sections/mockups";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section";
import { anchors } from "@/lib/site";

type Key = "clothing" | "grocery" | "restaurant" | "company" | "hypermarket";

const REST: Array<{ key: Exclude<Key, "clothing">; icon: LucideIcon }> = [
  { key: "grocery", icon: ShoppingBasket },
  { key: "restaurant", icon: Utensils },
  { key: "company", icon: Briefcase },
  { key: "hypermarket", icon: Store },
];

/**
 * Отрасли. Раскладка неравная (Этап 18.2): одежда занимает крупную плитку,
 * остальные — мелкие.
 *
 * Это не приём ради оживления блока. Одежда — единственная отрасль, под
 * которую бэкенд действительно написан (`modules/industries/clothing`:
 * размеры, цвета, размерные кривые), и раскладка говорит об этом честно,
 * вместо ровной сетки, где все пять выглядят одинаково готовыми.
 */
export function Industries() {
  const t = useTranslations("industries");

  return (
    <section id={anchors.industries.slice(1)} className="bg-page py-24">
      <Container>
        <SectionHeader
          eyebrow={t("eyebrow")}
          title={t("title")}
          lead={t("lead")}
        />

        <div className="mt-14 grid gap-5 desktop:grid-cols-[1.35fr_1fr]">
          {/* Одежда — крупная плитка с настоящей кривой внутри. */}
          <a
            href={anchors.pricing}
            style={{ "--i": 0 } as React.CSSProperties}
            className="reveal-item flex flex-col justify-between gap-8 rounded-frame border border-line bg-card p-8 transition-[transform,border-color] duration-200 hover:-translate-y-[3px] hover:border-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 motion-reduce:hover:translate-y-0"
          >
            <div className="flex flex-col items-start gap-3.5">
              <span className="flex items-center gap-2.5">
                <Shirt className="size-5 text-brand-ink" aria-hidden />
                <span className="font-mono text-[11px] tracking-[0.18em] text-subtle uppercase">
                  {t("readyLabel")}
                </span>
              </span>
              <span className="block text-[clamp(22px,3vw,28px)] leading-tight font-extrabold tracking-[-0.026em]">
                {t("items.clothing.name")}
              </span>
              <span className="h-px w-14 bg-brand-600" />
              <span className="block max-w-[38ch] text-body leading-relaxed text-pretty text-muted">
                {t("items.clothing.long")}
              </span>
            </div>

            <div className="rounded-card bg-app-navy p-5">
              <CurveMockup
                bars={[
                  { size: "S", store: 34, back: 20 },
                  { size: "M", store: 0, back: 44, alert: true },
                  { size: "L", store: 16, back: 60, alert: true },
                  { size: "XL", store: 70 },
                  { size: "2XL", store: 90 },
                ]}
                caption={t("items.clothing.desc")}
                compact
              />
            </div>
          </a>

          {/* Остальные отрасли — мелкой сеткой. */}
          <div className="grid gap-5 tablet:grid-cols-2">
            {REST.map(({ key, icon: Icon }, index) => (
              <a
                key={key}
                href={anchors.pricing}
                style={{ "--i": index + 1 } as React.CSSProperties}
                className="reveal-item flex flex-col gap-2.5 rounded-card border border-line bg-card px-6 py-6 transition-[transform,border-color] duration-200 hover:-translate-y-[3px] hover:border-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 motion-reduce:hover:translate-y-0"
              >
                <Icon className="size-5 text-brand-ink" aria-hidden />
                <span className="mt-1 block text-[16.5px] font-bold">
                  {t(`items.${key}.name`)}
                </span>
                <span className="block text-[13.5px] leading-[1.45] text-subtle">
                  {t(`items.${key}.desc`)}
                </span>
              </a>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
