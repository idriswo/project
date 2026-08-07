import { setRequestLocale } from "next-intl/server";
import { use } from "react";

import { NewProductForm } from "@/components/app/new-product-form";
import { AuthGuard } from "@/components/auth/auth-guard";
import { routing, type Locale } from "@/i18n/routing";
import { privateMetadata } from "@/lib/privateMetadata";

export const metadata = privateMetadata;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default function NewProductPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = use(params);
  setRequestLocale(locale);

  return (
    <AuthGuard>
      <NewProductForm />
    </AuthGuard>
  );
}
