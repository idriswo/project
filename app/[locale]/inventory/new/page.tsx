import { setRequestLocale } from "next-intl/server";
import { use } from "react";

import { AuthGuard } from "@/components/auth/auth-guard";
import { AddProductForm } from "@/components/inventory/add-product-form";
import { routing, type Locale } from "@/i18n/routing";

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
      <AddProductForm />
    </AuthGuard>
  );
}
