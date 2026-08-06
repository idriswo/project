"use client";

import { ArrowLeft, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useState } from "react";

import { Link } from "@/i18n/navigation";
import { fetchApi } from "@/lib/apiClient";
import { phoneDigits } from "@/lib/phone";
import { supabase } from "@/lib/supabase";

type AuthProvider = "PHONE" | "WHATSAPP" | "TELEGRAM" | "GOOGLE";

interface LinkedAccount {
  id: string;
  provider: AuthProvider;
  providerId: string;
  isPrimary: boolean;
  createdAt: string;
}

type LinkStep = "idle" | "enterPhone" | "enterCode";

const COUNTRY_CODE = "+992";

/**
 * «Восстановление пароля через WhatsApp/Telegram» (см. решение в чате)
 * возможно только для аккаунтов, у которых этот способ реально привязан —
 * а привязка требует ДОКАЗАТЕЛЬСТВА владения номером. Supabase умеет это
 * только для телефона (`updateUser({phone})` + `verifyOtp(type:'phone_change')`);
 * отдельного WhatsApp-канала для этой проверки нет — поэтому подтверждённый
 * телефон можно дополнительно пометить как WhatsApp (тот же номер), не делая
 * второй OTP-цикл.
 *
 * Telegram НЕ реализован: для него нужен свой бот (токен, вебхук,
 * deep-link) — этой инфраструктуры в проекте ещё нет.
 */
export function LinkedAccountsSettings() {
  const t = useTranslations("settings");

  const [accounts, setAccounts] = useState<LinkedAccount[] | null>(null);
  const [linkStep, setLinkStep] = useState<LinkStep>("idle");
  const [phoneValue, setPhoneValue] = useState("");
  const [alsoWhatsapp, setAlsoWhatsapp] = useState(false);
  const [pendingPhone, setPendingPhone] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const phoneId = useId();
  const codeId = useId();

  async function loadAccounts() {
    const { linkedAccounts } = await fetchApi("/me");
    setAccounts(linkedAccounts);
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { linkedAccounts } = await fetchApi("/me");
        if (!cancelled) setAccounts(linkedAccounts);
      } catch {
        if (!cancelled) setAccounts([]);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  function errorMessage(err: unknown): string {
    return err instanceof Error && err.message ? err.message : t("errors.generic");
  }

  async function handleUnlink(id: string) {
    setError(null);
    try {
      await fetchApi(`/auth/accounts/${id}`, { method: "DELETE" });
      await loadAccounts();
    } catch (err: unknown) {
      setError(errorMessage(err));
    }
  }

  function startLinkPhone() {
    setLinkStep("enterPhone");
    setPhoneValue("");
    setAlsoWhatsapp(false);
    setError(null);
    setNotice(null);
  }

  function cancelLink() {
    setLinkStep("idle");
    setError(null);
    setNotice(null);
  }

  async function handleSendCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const digits = phoneDigits(phoneValue);
    if (digits.length === 0) {
      setError(t("errors.phoneRequired"));
      return;
    }

    setSubmitting(true);
    try {
      const fullPhone = `${COUNTRY_CODE}${digits}`;
      const { error: updateError } = await supabase.auth.updateUser({ phone: fullPhone });
      if (updateError) throw updateError;
      setPendingPhone(fullPhone);
      setCode("");
      setLinkStep("enterCode");
    } catch (err: unknown) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!code.trim()) {
      setError(t("errors.codeRequired"));
      return;
    }

    setSubmitting(true);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        phone: pendingPhone,
        token: code.trim(),
        type: "phone_change",
      });
      if (verifyError) throw verifyError;

      await fetchApi("/auth/link-account", {
        method: "POST",
        body: JSON.stringify({ provider: "PHONE", providerId: pendingPhone }),
      });

      if (alsoWhatsapp) {
        await fetchApi("/auth/link-account", {
          method: "POST",
          body: JSON.stringify({ provider: "WHATSAPP", providerId: pendingPhone }),
        }).catch(() => {
          // Телефон уже привязан — это самое важное; если WhatsApp-запись
          // не встала (например дубликат), не рушим весь флоу из-за этого.
        });
      }

      setLinkStep("idle");
      setNotice(t("linkPhone.success"));
      await loadAccounts();
    } catch (err: unknown) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const hasProvider = (provider: AuthProvider) =>
    accounts?.some((a) => a.provider === provider) ?? false;

  return (
    <main className="min-h-screen bg-surface px-5 py-10">
      <div className="mx-auto max-w-[560px]">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-subtle transition-colors hover:text-brand-ink"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t("back")}
        </Link>

        <div className="rounded-[20px] border border-line bg-card p-8 shadow-[0_1px_3px_rgba(0,0,0,0.08)] tablet:p-10">
          <h1 className="text-[24px] font-extrabold tracking-[-0.5px] text-balance">
            {t("heading")}
          </h1>
          <p className="mt-2.5 text-body leading-normal text-pretty text-subtle">{t("lead")}</p>

          {accounts === null ? (
            <p className="mt-7 text-subtle">{t("loading")}</p>
          ) : (
            <ul className="mt-7 flex flex-col gap-3">
              {accounts.map((account) => (
                <li
                  key={account.id}
                  className="flex items-center gap-3 rounded-card border border-line bg-surface px-4.5 py-3.5"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-extrabold text-ink">
                      {t(`providers.${account.provider}`)}
                    </span>
                    <span className="block truncate text-sm text-subtle">
                      {account.providerId}
                    </span>
                  </span>
                  {account.isPrimary ? (
                    <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-bold text-brand-ink">
                      {t("primary")}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleUnlink(account.id)}
                      aria-label={t("unlink")}
                      className="shrink-0 text-subtle transition-colors hover:text-danger"
                    >
                      <Trash2 className="size-[18px]" aria-hidden />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {notice ? <p className="mt-4 text-sm text-success">{notice}</p> : null}

          <div className="mt-6 border-t border-line pt-6">
            {linkStep === "idle" ? (
              <div className="flex flex-col gap-3">
                {!hasProvider("PHONE") ? (
                  <button
                    type="button"
                    onClick={startLinkPhone}
                    className="h-13 rounded-card border-[1.5px] border-field-border bg-card text-sm font-bold text-ink transition-colors hover:border-brand-600"
                  >
                    {t("linkPhone.cta")}
                  </button>
                ) : null}

                <div className="rounded-card border border-line bg-surface px-4.5 py-3.5 text-sm text-subtle">
                  {t("telegram.comingSoon")}
                </div>
              </div>
            ) : linkStep === "enterPhone" ? (
              <form onSubmit={handleSendCode} noValidate className="flex flex-col gap-4">
                <div>
                  <label htmlFor={phoneId} className="mb-2 block text-[13px] font-bold text-muted">
                    {t("linkPhone.label")}
                  </label>
                  <div className="flex items-stretch gap-2.5">
                    <span className="flex h-15 items-center rounded-card border-[1.5px] border-field-border bg-surface px-4 text-base font-bold whitespace-nowrap">
                      {COUNTRY_CODE}
                    </span>
                    <input
                      id={phoneId}
                      type="tel"
                      inputMode="numeric"
                      autoFocus
                      value={phoneValue}
                      onChange={(event) => {
                        setPhoneValue(event.target.value);
                        if (error) setError(null);
                      }}
                      placeholder={t("linkPhone.placeholder")}
                      className="h-15 min-w-0 flex-1 rounded-card border-[1.5px] border-field-border bg-field px-4.5 text-xl font-bold tracking-[1px] outline-none focus:border-brand-600 focus:shadow-[0_0_0_4px_rgb(15_82_186/0.10)]"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-3 rounded-card border-[1.5px] border-field-border bg-field px-4 py-3.5">
                  <input
                    type="checkbox"
                    checked={alsoWhatsapp}
                    onChange={(event) => setAlsoWhatsapp(event.target.checked)}
                    className="size-5 shrink-0 rounded border-field-border text-brand-600 focus:ring-brand-600"
                  />
                  <span className="text-sm font-semibold text-ink">
                    {t("linkPhone.alsoWhatsapp")}
                  </span>
                </label>

                {error ? (
                  <p role="alert" className="text-sm text-danger">
                    {error}
                  </p>
                ) : null}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={cancelLink}
                    className="h-13 rounded-card border-[1.5px] border-field-border px-5 text-sm font-bold text-ink"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="h-13 flex-1 rounded-card bg-accent-500 text-sm font-extrabold text-on-accent disabled:pointer-events-none disabled:opacity-70"
                  >
                    {submitting ? t("linkPhone.ctaLoading") : t("linkPhone.sendCode")}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode} noValidate className="flex flex-col gap-4">
                <div>
                  <label htmlFor={codeId} className="mb-2 block text-[13px] font-bold text-muted">
                    {t("linkPhone.codeLabel")}
                  </label>
                  <input
                    id={codeId}
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    value={code}
                    onChange={(event) => {
                      setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
                      if (error) setError(null);
                    }}
                    placeholder="000000"
                    className="h-15 w-full rounded-card border-[1.5px] border-field-border bg-field px-4.5 text-xl font-bold tracking-[4px] outline-none focus:border-brand-600 focus:shadow-[0_0_0_4px_rgb(15_82_186/0.10)]"
                  />
                </div>

                {error ? (
                  <p role="alert" className="text-sm text-danger">
                    {error}
                  </p>
                ) : null}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={cancelLink}
                    className="h-13 rounded-card border-[1.5px] border-field-border px-5 text-sm font-bold text-ink"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="h-13 flex-1 rounded-card bg-accent-500 text-sm font-extrabold text-on-accent disabled:pointer-events-none disabled:opacity-70"
                  >
                    {submitting ? t("linkPhone.ctaLoading") : t("linkPhone.verifyCta")}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
