import { setRequestLocale } from "next-intl/server";
import { use } from "react";

import { AuthGuard } from "@/components/auth/auth-guard";
import { LinkedAccountsSettings } from "@/components/settings/linked-accounts";
import { MoreSections } from "@/components/settings/more-sections";
import { routing, type Locale } from "@/i18n/routing";
import { privateMetadata } from "@/lib/privateMetadata";

export const metadata = privateMetadata;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default function SettingsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = use(params);
  setRequestLocale(locale);

  return (
    <AuthGuard>
      <div className="mx-auto flex w-full max-w-[1040px] flex-col gap-6">
        <MoreSections />
        <LinkedAccountsSettings />
      </div>
    </AuthGuard>
  );
}
