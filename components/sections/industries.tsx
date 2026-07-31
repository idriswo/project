import {
  Briefcase,
  ShoppingBasket,
  Shirt,
  Store,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section";
import { anchors } from "@/lib/site";

const ITEMS: Array<{
  key: "clothing" | "grocery" | "restaurant" | "company" | "hypermarket";
  icon: LucideIcon;
}> = [
  { key: "clothing", icon: Shirt },
  { key: "grocery", icon: ShoppingBasket },
  { key: "restaurant", icon: Utensils },
  { key: "company", icon: Briefcase },
  { key: "hypermarket", icon: Store },
];

/** Карточки отраслей: 5 → 3 → 1 колонка (макет п. 3.4). */
export function Industries() {
  const t = useTranslations("industries");

  return (
    <section id={anchors.industries.slice(1)} className="bg-white py-20">
      <Container>
        <SectionHeader
          eyebrow={t("eyebrow")}
          title={t("title")}
          lead={t("lead")}
        />

        <div className="mt-13 grid gap-5 tablet:grid-cols-3 desktop:grid-cols-5">
          {ITEMS.map(({ key, icon: Icon }) => (
            <a
              key={key}
              href={anchors.pricing}
              className="block rounded-card border border-line bg-white px-5.5 py-7.5 text-center transition-[transform,border-color] duration-150 hover:-translate-y-[3px] hover:border-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 motion-reduce:hover:translate-y-0"
            >
              <span className="mx-auto mb-4 flex size-[58px] items-center justify-center rounded-card bg-surface-alt">
                <Icon className="size-[26px] text-brand-600" aria-hidden />
              </span>
              <span className="block text-[16.5px] font-bold">
                {t(`items.${key}.name`)}
              </span>
              <span className="mt-1.5 block text-[13.5px] leading-[1.45] text-subtle">
                {t(`items.${key}.desc`)}
              </span>
            </a>
          ))}
        </div>
      </Container>
    </section>
  );
}
