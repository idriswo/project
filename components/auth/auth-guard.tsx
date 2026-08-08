"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "@/i18n/navigation";

import { fetchApi } from "@/lib/apiClient";
import { getActiveTenantId, setActiveTenantId } from "@/lib/activeTenant";
import { supabase } from "@/lib/supabase";

interface Profile {
  tenantId: string;
}

/**
 * Один аккаунт — до 2 магазинов (`profiles`, решение бекенда 2026-08-06).
 *
 * - profiles.length === 0 → ещё ни одного магазина, единственный выход —
 *   мастер создания (`/onboarding`).
 * - profiles.length >= 1 → магазины уже есть. С `/auth` и с корня после
 *   входа ведём на `/stores` (список + кнопка "создать ещё"), а не сразу
 *   в `/dashboard` — иначе созданные магазины было бы негде увидеть.
 * - `/onboarding` остаётся доступной, пока не достигнут лимит в 2 магазина
 *   (это и есть кнопка "создать ещё" со страницы `/stores`).
 * - Остальные защищённые страницы (`/dashboard`, `/inventory`, `/settings`)
 *   требуют выбранного активного магазина — если его нет или он больше не
 *   принадлежит пользователю, отправляем на `/stores` выбрать заново.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        if (!pathname.includes("/auth")) {
          router.push("/auth");
        }
        setLoading(false);
        return;
      }

      try {
        const me = (await fetchApi("/me")) as { profiles?: Profile[] };
        // Неожиданный ответ не должен ронять защиту: считаем, что магазинов нет.
        const profiles = Array.isArray(me?.profiles) ? me.profiles : [];
        const MAX_TENANTS = 2;

        if (profiles.length === 0) {
          if (!pathname.includes("/onboarding")) {
            router.push("/onboarding");
          }
          setLoading(false);
          return;
        }

        if (pathname.includes("/auth")) {
          router.push("/stores");
          setLoading(false);
          return;
        }

        if (pathname.includes("/onboarding")) {
          if (profiles.length >= MAX_TENANTS) {
            router.push("/stores");
          }
          setLoading(false);
          return;
        }

        if (pathname.includes("/stores")) {
          setLoading(false);
          return;
        }

        // Остальные страницы приложения требуют выбранного активного магазина.
        const activeTenantId = getActiveTenantId();
        const activeIsValid = profiles.some((p) => p.tenantId === activeTenantId);

        if (!activeIsValid) {
          if (profiles.length === 1) {
            // Один магазин — выбор очевиден, не заставляем щёлкать лишний раз.
            setActiveTenantId(profiles[0].tenantId);
          } else {
            router.push("/stores");
            setLoading(false);
            return;
          }
        }
      } catch (error) {
        console.error("Auth Guard Error:", error);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [pathname, router]);

  if (loading) return <Splash />;

  return <>{children}</>;
}

/**
 * Заставка на время проверки сессии.
 *
 * Раньше здесь стояло голое «Loading...» — английское слово чёрным по
 * белому. В браузере это проскакивало незаметно, но в установленном
 * приложении именно оно и есть первый экран: программа открывается и
 * первым делом показывает служебную надпись на чужом языке.
 *
 * Теперь это знак TIM и приветствие. Проверка занимает те же доли
 * секунды, но окно с самого начала выглядит как программа.
 */
function Splash() {
  const t = useTranslations("app.splash");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-app-bg">
      <span
        aria-hidden
        className="flex size-16 items-center justify-center rounded-[18px] bg-app-sapphire text-[30px] font-extrabold tracking-[0.5px] text-white shadow-[0_18px_36px_-18px_rgb(15_82_186/0.8)]"
      >
        T
      </span>

      <p
        role="status"
        className="text-[15px] font-bold tracking-[-0.01em] text-app-ink"
      >
        {t("greeting")}
      </p>

      {/* Полоса вместо спиннера: она заполняется слева направо и читается
          как «идёт», а не как «зависло». */}
      <span
        aria-hidden
        className="h-1 w-32 overflow-hidden rounded-full bg-app-track"
      >
        <span className="block h-full w-1/3 rounded-full bg-app-sapphire motion-safe:animate-app-slide" />
      </span>
    </div>
  );
}
