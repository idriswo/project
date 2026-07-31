import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section";
import { cn } from "@/lib/cn";
import { anchors } from "@/lib/site";

const PLANS = [
  { key: "basic", featured: false },
  { key: "standard", featured: true },
  { key: "full", featured: false },
] as const;

/** Тарифы. «Стандарт» выделен тёмным фоном и бейджем (макет п. 3.6). */
export function Pricing() {
  const t = useTranslations("pricing");

  return (
    <section id={anchors.pricing.slice(1)} className="bg-page py-26">
      <Container>
        <SectionHeader
          eyebrow={t("eyebrow")}
          title={t("title")}
          lead={t("lead")}
        />

        <div className="mt-14 grid items-stretch gap-6 tablet:grid-cols-2 desktop:grid-cols-3">
          {PLANS.map(({ key, featured }, index) => {
            const features = t.raw(`plans.${key}.features`) as string[];

            return (
              <div
                key={key}
                style={{ "--i": index } as React.CSSProperties}
                className={cn(
                  "reveal-item flex flex-col rounded-plan border px-8 py-9.5",
                  featured
                    ? "border-navy bg-navy shadow-plan"
                    : "border-line bg-card",
                )}
              >
                {featured ? (
                  <span className="mb-4 self-start rounded-full bg-accent-500 px-3 py-[5px] text-[12.5px] font-bold tracking-[0.4px] text-on-accent">
                    {t("popular")}
                  </span>
                ) : null}

                <h3
                  className={cn(
                    "text-[22px] font-extrabold",
                    featured ? "text-white" : "text-ink",
                  )}
                >
                  {t(`plans.${key}.name`)}
                </h3>

                <p
                  className={cn(
                    "mt-2 text-[14.5px] leading-normal",
                    featured ? "text-navy-text" : "text-subtle",
                  )}
                >
                  {t(`plans.${key}.tagline`)}
                </p>

                <p className="mt-6 mb-1 flex items-baseline gap-1.5">
                  <span
                    className={cn(
                      "text-price font-extrabold tracking-[-1.5px]",
                      featured ? "text-white" : "text-ink",
                    )}
                  >
                    {t(`plans.${key}.price`)}
                  </span>
                  <span
                    className={cn(
                      "text-[15px] font-semibold",
                      featured ? "text-navy-text" : "text-subtle",
                    )}
                  >
                    {t(`plans.${key}.period`)}
                  </span>
                </p>

                <hr
                  className={cn(
                    "my-6 border-t",
                    featured ? "border-navy-rule" : "border-line",
                  )}
                />

                <ul className="mb-7.5 flex flex-col gap-[13px]">
                  {features.map((feature) => (
                    <li
                      key={feature}
                      className={cn(
                        "flex items-start gap-2.5 text-[15px] leading-[1.4]",
                        featured ? "text-white" : "text-ink",
                      )}
                    >
                      <Check
                        className="mt-px size-[18px] shrink-0 text-accent-500"
                        aria-hidden
                      />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button href={anchors.top} className="mt-auto w-full py-3.5">
                  {t("cta")}
                </Button>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
