import { setRequestLocale } from "next-intl/server";
import { use } from "react";

import { CtaStrip } from "@/components/sections/cta-strip";
import { Features } from "@/components/sections/features";
import { Footer } from "@/components/sections/footer";
import { Header } from "@/components/sections/header";
import { Hero } from "@/components/sections/hero";
import { HowItWorks } from "@/components/sections/how-it-works";
import { Industries } from "@/components/sections/industries";
import { Pricing } from "@/components/sections/pricing";
import type { Locale } from "@/i18n/routing";

export default function HomePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = use(params);
  setRequestLocale(locale);

  return (
    <>
      <Header locale={locale} />

      <main>
        <div id="top" />
        <Hero />
        <Features />
        <Industries />
        <HowItWorks />
        <Pricing />
        <CtaStrip />
      </main>

      <Footer />
    </>
  );
}
