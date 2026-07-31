import { Check, PlayCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { anchors } from "@/lib/site";

const TRUST_KEYS = ["noCard", "fastStart", "yourLanguage"] as const;

/** Hero: единственный <h1> страницы (ТЗ п. 4.1). */
export function Hero() {
  const t = useTranslations("hero");

  return (
    <section id={anchors.top.slice(1)} className="bg-surface">
      <Container className="grid items-center gap-11 pt-22 pb-24 desktop:grid-cols-[1.05fr_1fr] desktop:gap-16">
        <div>
          <span className="inline-block rounded-full bg-brand-50 px-3.5 py-[7px] text-[13px] font-bold tracking-[0.3px] text-brand-ink">
            {t("badge")}
          </span>

          <h1 className="mt-[22px] text-[38px] leading-[1.05] font-extrabold tracking-[-1.5px] text-balance tablet:text-[44px] desktop:text-h1">
            {t("title")}
          </h1>

          <p className="mt-6 max-w-[480px] text-lead leading-relaxed text-pretty text-muted">
            {t("lead")}
          </p>

          <div className="mt-9 flex flex-wrap gap-3.5">
            <Button href="/auth" size="lg">
              {t("ctaPrimary")}
            </Button>
            <Button href={anchors.features} size="lg" variant="secondary">
              <PlayCircle className="size-[19px]" aria-hidden />
              {t("ctaSecondary")}
            </Button>
          </div>

          <ul className="mt-[34px] flex flex-wrap items-center gap-x-[22px] gap-y-2 text-sm font-semibold text-subtle">
            {TRUST_KEYS.map((key) => (
              <li key={key} className="inline-flex items-center gap-[7px]">
                <Check className="size-[17px] text-brand-ink" aria-hidden />
                {t(`trust.${key}`)}
              </li>
            ))}
          </ul>
        </div>

        {/* Плейсхолдер мокапа — заменяется на next/image после получения
            скриншота системы от заказчика (блокер Б-3, задача 1.14). */}
        <div className="rounded-frame border border-line-alt bg-card p-3.5 shadow-mockup">
          <div
            className="flex aspect-[560/420] items-center justify-center rounded-[10px] bg-surface-alt font-mono text-[15px] text-subtle"
            role="img"
            aria-label={t("mockupAlt")}
          >
            app dashboard mockup
          </div>
        </div>
      </Container>
    </section>
  );
}
