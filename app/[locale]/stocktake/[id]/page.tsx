import { setRequestLocale } from "next-intl/server";
import { use } from "react";

import { AppScreen } from "@/components/app/app-screen";
import { StocktakeView } from "@/components/app/stocktake-view";
import { AuthGuard } from "@/components/auth/auth-guard";
import { type Locale } from "@/i18n/routing";
import { privateMetadata } from "@/lib/privateMetadata";

export const metadata = privateMetadata;

/* Номер документа заранее не известен — страница собирается по запросу.
 * Список локалей тут не помогает: статически предрендерить нечего. */
export default function Page({
  params,
}: {
  params: Promise<{ locale: Locale; id: string }>;
}) {
  const { locale, id } = use(params);
  setRequestLocale(locale);

  return (
    <AuthGuard>
      <AppScreen allow={["OWNER", "MANAGER", "WAREHOUSE"]} wide>
        <StocktakeView id={id} />
      </AppScreen>
    </AuthGuard>
  );
}
