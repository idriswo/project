import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";

import { AuthForm } from "@/components/auth/auth-form";
import { VisualPanel } from "@/components/auth/visual-panel";
import { routing, type Locale } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.meta" });

  return {
    title: t("titleLogin"),
    description: t("description"),
    // Страницы входа не должны попадать в поисковую выдачу.
    robots: { index: false, follow: false },
  };
}

export default function AuthPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = use(params);
  setRequestLocale(locale);

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-5 py-8">
      <div className="grid w-full max-w-[1040px] overflow-hidden rounded-[24px] border border-line bg-white shadow-[0_40px_90px_-50px_rgb(15_25_60/0.35)] auth:grid-cols-[1.05fr_1fr]">
        <VisualPanel />
        <AuthForm />
      </div>
    </main>
  );
}
