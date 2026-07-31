import { useTranslations } from "next-intl";

import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section";
import { cn } from "@/lib/cn";

const STEPS = [
  { key: "signup", tone: "brand" },
  { key: "modules", tone: "brand" },
  { key: "start", tone: "accent" },
] as const;

/** Три шага запуска. Третий номер — янтарный (макет п. 3.5). */
export function HowItWorks() {
  const t = useTranslations("howItWorks");

  return (
    <section className="bg-surface py-24">
      <Container>
        <SectionHeader eyebrow={t("eyebrow")} title={t("title")} />

        <ol className="mt-14 grid gap-7 tablet:grid-cols-2 desktop:grid-cols-3">
          {STEPS.map(({ key, tone }, index) => (
            <li key={key}>
              <Card
                className="reveal-item h-full px-8 py-9"
                style={{ "--i": index } as React.CSSProperties}
              >
                <span
                  className={cn(
                    "mb-5.5 flex size-11 items-center justify-center rounded-btn text-[19px] font-extrabold",
                    tone === "accent"
                      ? "bg-accent-500 text-on-accent"
                      : "bg-brand-600 text-white",
                  )}
                  aria-hidden
                >
                  {index + 1}
                </span>
                <h3 className="text-h3 font-bold">{t(`steps.${key}.title`)}</h3>
                <p className="mt-[11px] text-body leading-relaxed text-muted">
                  {t(`steps.${key}.text`)}
                </p>
              </Card>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
