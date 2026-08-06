"use client";

import { Plus, Store as StoreIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Link, useRouter } from "@/i18n/navigation";
import { fetchApi } from "@/lib/apiClient";
import { clearActiveTenantId, setActiveTenantId } from "@/lib/activeTenant";
import { supabase } from "@/lib/supabase";

type Role = "OWNER" | "STAFF";
type Industry = "CLOTHING" | "FOOD" | "RESTAURANT";

interface StoreProfile {
  tenantId: string;
  role: Role;
  tenant: { id: string; name: string; slug: string; industry: Industry };
}

const MAX_TENANTS = 2;

/**
 * Список магазинов пользователя (до 2, решение бекенда 2026-08-06) —
 * промежуточный экран после логина, до этого его не было: AuthGuard сразу
 * либо гнал в dashboard, либо (из-за бага) всегда в onboarding.
 */
export function StorePicker() {
  const t = useTranslations("stores");
  const router = useRouter();

  const [profiles, setProfiles] = useState<StoreProfile[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const me = await fetchApi("/me");
        if (!cancelled) setProfiles(Array.isArray(me?.profiles) ? me.profiles : []);
      } catch {
        if (!cancelled) setProfiles([]);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  function openStore(tenantId: string) {
    setActiveTenantId(tenantId);
    router.push("/dashboard");
  }

  async function handleLogout() {
    // Выбранный магазин живёт в localStorage и переживает выход — если его не
    // стереть, следующий вошедший на этом компьютере унаследует чужой выбор.
    clearActiveTenantId();
    await supabase.auth.signOut();
    router.push("/auth");
  }

  return (
    <div className="flex min-w-0 flex-col p-6 tablet:p-14">
      <h1 className="text-[26px] font-extrabold tracking-[-0.6px] text-balance">{t("heading")}</h1>
      <p className="mt-2.5 text-body leading-normal text-pretty text-subtle">{t("lead")}</p>

      {profiles === null ? (
        <p className="mt-8.5 text-subtle">{t("loading")}</p>
      ) : (
        <div className="mt-8.5 flex flex-col gap-3">
          {profiles.map((profile) => (
            <button
              key={profile.tenantId}
              type="button"
              onClick={() => openStore(profile.tenantId)}
              className="flex items-center gap-3.5 rounded-card border-[1.5px] border-field-border bg-card px-5 py-4 text-left transition-[border-color,box-shadow] duration-150 hover:border-brand-600 hover:shadow-[0_10px_22px_-14px_rgb(15_82_186/0.5)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-ink">
                <StoreIcon className="size-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-extrabold text-ink">
                  {profile.tenant.name}
                </span>
                <span className="block text-sm text-subtle">{t(`roles.${profile.role}`)}</span>
              </span>
            </button>
          ))}

          {profiles.length < MAX_TENANTS ? (
            <Link
              href="/onboarding"
              className="flex items-center gap-3.5 rounded-card border-[1.5px] border-dashed border-field-border px-5 py-4 text-left transition-[border-color,box-shadow] duration-150 hover:border-brand-600 hover:shadow-[0_10px_22px_-14px_rgb(15_82_186/0.5)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface text-subtle">
                <Plus className="size-5" aria-hidden />
              </span>
              <span className="font-extrabold text-ink">{t("createNew")}</span>
            </Link>
          ) : null}
        </div>
      )}

      <button
        type="button"
        onClick={handleLogout}
        className="mt-6 self-start text-sm font-semibold text-subtle transition-colors hover:text-brand-ink"
      >
        {t("logout")}
      </button>
    </div>
  );
}
