import { setRequestLocale } from "next-intl/server";
import { Suspense, use } from "react";

import { AppScreen } from "@/components/app/app-screen";
import { LabelsLoader } from "@/components/app/labels-loader";
import { AuthGuard } from "@/components/auth/auth-guard";
import { ListSkeleton } from "@/components/ui/skeleton";
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
      <AppScreen allow={["OWNER", "MANAGER", "WAREHOUSE"]}>
        {/* useSearchParams требует границы Suspense, иначе страница
         * не соберётся статически. */}
        <Suspense fallback={<ListSkeleton rows={1} />}>
          <LabelsLoader />
        </Suspense>
      </AppScreen>
    </AuthGuard>
  );
}
