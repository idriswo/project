"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

/**
 * Куда возвращает Google после OAuth (см. `redirectTo` в auth-form.tsx).
 *
 * Обмен `?code=` на сессию делает САМ клиент supabase-js (`detectSessionInUrl`,
 * включён по умолчанию) — он читает code_verifier, который signInWithOAuth
 * сохранил в localStorage. Серверный route handler здесь не сработал бы:
 * PKCE code_verifier лежит в браузере, а не в cookie (проект не использует
 * @supabase/ssr), поэтому раньше редирект шёл на несуществующий
 * `/api/auth/callback` и получал 404.
 *
 * Сюда же ведёт `emailRedirectTo` из `signUp()` в auth-form.tsx — Supabase
 * присылает письмо для подтверждения почты, и ссылка в письме возвращает
 * сюда же. Пароль в этом проекте задаётся ПРИ регистрации (обычная форма
 * email+пароль под лейблом «Google» — см. auth-form.tsx), поэтому здесь
 * достаточно дождаться сессии и уйти на /onboarding.
 */
export default function AuthCallbackPage() {
  const t = useTranslations("auth.callback");
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let redirected = false;

    function goToOnboarding() {
      if (redirected) return;
      redirected = true;
      router.replace("/onboarding");
    }

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) goToOnboarding();
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) goToOnboarding();
    });

    const timeout = setTimeout(() => {
      if (!redirected) setFailed(true);
    }, 10_000);

    return () => {
      subscription.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface px-5 text-center">
      {failed ? (
        <>
          <p className="text-danger">{t("failed")}</p>
          <button
            type="button"
            onClick={() => router.replace("/auth")}
            className="text-sm font-semibold text-brand-ink hover:underline"
          >
            {t("retry")}
          </button>
        </>
      ) : (
        <p className="text-subtle">{t("loading")}</p>
      )}
    </main>
  );
}
