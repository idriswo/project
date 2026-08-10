"use client";

import { LogOut, Store } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link, useRouter } from "@/i18n/navigation";
import { clearActiveTenantId } from "@/lib/activeTenant";
import { supabase } from "@/lib/supabase";
import { DataCard, Eyebrow } from "@/components/ui/stat";

export function AccountActions() {
  const t = useTranslations("app.nav");
  const router = useRouter();

  async function handleLogout() {
    clearActiveTenantId();
    await supabase.auth.signOut();
    router.push("/auth");
  }

  return (
    <DataCard className="p-6">
      <Eyebrow>{t("profile")}</Eyebrow>
      <div className="mt-3 flex flex-col">
        <Link
          href="/stores"
          className="flex items-center gap-3.5 border-b border-app-line py-3.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-sapphire"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-card bg-app-panel text-app-sapphire">
            <Store className="size-[18px]" aria-hidden />
          </span>
          <span className="flex-1 text-[14.5px] font-semibold text-app-ink">
            {t("switchStore")}
          </span>
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3.5 pt-3.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-sapphire"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-card bg-app-panel text-app-out">
            <LogOut className="size-[18px]" aria-hidden />
          </span>
          <span className="flex-1 text-left text-[14.5px] font-semibold text-app-out">
            {t("logout")}
          </span>
        </button>
      </div>
    </DataCard>
  );
}
