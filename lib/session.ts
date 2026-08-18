"use client";

import { useEffect, useState } from "react";

import { getActiveTenantId } from "@/lib/activeTenant";
import { fetchApi } from "@/lib/apiClient";
import { type AppRole, resolveAppRole } from "@/lib/roles";
import { supabase } from "@/lib/supabase";

/**
 * Кто вошёл, в каком магазине и с какими правами.
 *
 * Один запрос `/me` на экран вместо трёх копий одного и того же кода в
 * дашборде, кассе и складе.
 *
 * **Исправлено здесь:** прежние экраны читали `me.tenant.name`, а такого
 * поля у `/me` нет — ответ содержит `profiles[]`, и магазин лежит внутри
 * профиля (`auth.service.ts`, `getMe`). Поэтому название магазина в шапке
 * не показывалось никогда. Правильный источник — профиль активного
 * магазина, а он выбирается по `X-Tenant-Id` из localStorage.
 */

interface TenantSummary {
  id: string;
  name: string;
  slug: string;
  sphere: string;
}

interface Profile {
  id: string;
  tenantId: string;
  fullName: string | null;
  role: "OWNER" | "STAFF";
  tenant: TenantSummary;
}

interface MeResponse {
  profiles?: Profile[];
}

export interface AppSession {
  loading: boolean;
  storeName: string;
  fullName: string;
  /** Профиль в активном магазине. Нужен, чтобы узнать себя в списке
   *  сотрудников: себе роль менять нельзя, и кнопку надо гасить заранее. */
  profileId: string;
  role: AppRole;
  sphere: string;
  activeModules: string[];
  /** Не удалось спросить `/me`. Экран решает сам, тупик это или нет. */
  failed: boolean;
}

const INITIAL: AppSession = {
  loading: true,
  storeName: "",
  fullName: "",
  profileId: "",
  // До ответа считаем правами самые узкие из «полных»: показать лишнее и
  // отобрать через секунду хуже, чем показать чуть позже.
  role: "MANAGER",
  sphere: "CLOTHING",
  activeModules: [],
  failed: false,
};

export function useAppSession(): AppSession {
  const [session, setSession] = useState<AppSession>(INITIAL);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [me, user, modulesRes] = await Promise.allSettled([
        fetchApi("/me") as Promise<MeResponse>,
        supabase.auth.getUser(),
        fetchApi("/billing/my-modules") as Promise<{ modules: { moduleKey: string, status: string }[] }>,
      ]);

      if (cancelled) return;

      if (me.status !== "fulfilled") {
        setSession({ ...INITIAL, loading: false, failed: true });
        return;
      }

      const profiles = Array.isArray(me.value?.profiles)
        ? me.value.profiles
        : [];
      const activeId = getActiveTenantId();
      // Один магазин — выбирать нечего; два — берём тот, что в localStorage.
      const profile =
        profiles.find((p) => p.tenantId === activeId) ?? profiles[0] ?? null;

      const metaRole =
        user.status === "fulfilled"
          ? user.value.data.user?.user_metadata?.appRole
          : undefined;

      const activeModules = modulesRes.status === "fulfilled" 
        ? modulesRes.value.modules.filter(m => m.status === 'ACTIVE' || m.status === 'TRIAL').map(m => m.moduleKey)
        : [];

      setSession({
        loading: false,
        failed: false,
        storeName: profile?.tenant?.name ?? "",
        fullName: profile?.fullName ?? "",
        profileId: profile?.id ?? "",
        role: resolveAppRole(profile?.role, metaRole),
        sphere: profile?.tenant?.sphere ?? "CLOTHING",
        activeModules,
      });
    }

    load().catch(() => {
      if (!cancelled) setSession({ ...INITIAL, loading: false, failed: true });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return session;
}
