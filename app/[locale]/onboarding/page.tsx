import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { VisualPanel } from "@/components/auth/visual-panel";
import { AuthGuard } from "@/components/auth/auth-guard";
import { routing, type Locale } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default function OnboardingPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = use(params);
  setRequestLocale(locale);

  return (
    <AuthGuard>
      <main className="flex min-h-screen items-center justify-center bg-surface px-5 py-8">
        <div className="grid w-full max-w-[1040px] grid-cols-[minmax(0,1fr)] overflow-hidden rounded-[24px] border border-line bg-card shadow-[0_40px_90px_-50px_rgb(15_25_60/0.35)] auth:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
          <VisualPanel />
          <OnboardingWizard />
        </div>
      </main>
    </AuthGuard>
  );
}
