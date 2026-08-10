import { setRequestLocale } from "next-intl/server";
import { use } from "react";

import { AppScreen } from "@/components/app/app-screen";
import { TransferView } from "@/components/app/transfer-view";
import { AuthGuard } from "@/components/auth/auth-guard";
import { routing, type Locale } from "@/i18n/routing";
import { privateMetadata } from "@/lib/privateMetadata";

export const metadata = privateMetadata;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default function Page({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = use(params);
  setRequestLocale(locale);

  return (
    <AuthGuard>
      <AppScreen allow={["OWNER", "MANAGER", "SKLADCHI"]}>
        <TransferView />
      </AppScreen>
    </AuthGuard>
  );
}
