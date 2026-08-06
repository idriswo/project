import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { routing, type Locale } from "@/i18n/routing";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = use(params);
  setRequestLocale(locale);

  return <ForgotPasswordForm />;
}
