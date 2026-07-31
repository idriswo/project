import {
  Boxes,
  ScanBarcode,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Card, IconBox } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section";
import { anchors } from "@/lib/site";

const ITEMS: Array<{
  key: "warehouse" | "checkout" | "accounting" | "staff";
  icon: LucideIcon;
  tone: "brand" | "accent";
}> = [
  { key: "warehouse", icon: Boxes, tone: "accent" },
  { key: "checkout", icon: ScanBarcode, tone: "brand" },
  { key: "accounting", icon: Wallet, tone: "brand" },
  { key: "staff", icon: Users, tone: "brand" },
];

/**
 * Возможности системы: склад, касса, бухгалтерия, сотрудники.
 *
 * На месте блока «Проблема» из макета. Тот строился на сравнении с
 * конкурентом — по решению заказчика от 2026-07-31 сайт говорит только
 * о собственном продукте (см. Журнал решений в ROADMAP.md).
 */
export function Features() {
  const t = useTranslations("features");

  return (
    <section id={anchors.features.slice(1)} className="bg-page pt-26 pb-10">
      <Container>
        <SectionHeader
          eyebrow={t("eyebrow")}
          title={t("title")}
          lead={t("lead")}
        />

        <div className="mt-14 grid gap-6 tablet:grid-cols-2 desktop:grid-cols-4">
          {ITEMS.map(({ key, icon: Icon, tone }, index) => (
            <Card
              key={key}
              className="reveal-item"
              style={{ "--i": index } as React.CSSProperties}
            >
              <IconBox tone={tone} className="mb-5">
                <Icon className="size-6" aria-hidden />
              </IconBox>
              <h3 className="text-xl font-bold">{t(`items.${key}.title`)}</h3>
              <p className="mt-2.5 text-body leading-relaxed text-muted">
                {t(`items.${key}.text`)}
              </p>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
