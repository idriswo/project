import { setRequestLocale } from "next-intl/server";
import { use } from "react";

import { AuthGuard } from "@/components/auth/auth-guard";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { routing, type Locale } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default function DashboardPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = use(params);
  setRequestLocale(locale);

  return (
    <AuthGuard>
      <DashboardView />
    </AuthGuard>
  );
}
