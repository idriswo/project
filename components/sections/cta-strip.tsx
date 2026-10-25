import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { appOpen } from "@/lib/site";

/** Синяя CTA-плашка перед футером. Есть в макете, в ТЗ отсутствует. */
export function CtaStrip() {
  const t = useTranslations("ctaStrip");
  const tCommon = useTranslations("common");

  return (
    <section className="bg-page pb-24">
      <Container>
        <div className="reveal rounded-cta bg-brand-600 px-6 py-16 text-center tablet:px-12">
          <h2 className="text-[30px] leading-[1.1] font-extrabold tracking-[-1px] text-balance text-white tablet:text-[38px]">
            {t("title")}
          </h2>

          <p className="mx-auto mt-4 max-w-[520px] text-lg leading-relaxed text-pretty text-brand-100">
            {t("lead")}
          </p>

          {appOpen ? (
            <Button href="/auth" size="lg" className="mt-8">
              {t("cta")}
            </Button>
          ) : (
            <Button size="lg" className="mt-8" disabled>
              {tCommon("comingSoon")}
            </Button>
          )}
        </div>
      </Container>
    </section>
  );
}
