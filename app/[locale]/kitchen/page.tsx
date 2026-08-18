import { setRequestLocale } from "next-intl/server";
import { use } from "react";

import { AuthGuard } from "@/components/auth/auth-guard";
import { KitchenView } from "@/components/kitchen/kitchen-view";
import { routing, type Locale } from "@/i18n/routing";
import { privateMetadata } from "@/lib/privateMetadata";

export const metadata = privateMetadata;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default function KitchenPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = use(params);
  setRequestLocale(locale);

  return (
    <AuthGuard>
      <KitchenView />
    </AuthGuard>
  );
}
