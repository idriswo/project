"use client";

import { ArrowLeft, Mail, Phone } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useId, useState } from "react";

import { Flag } from "@/components/flags";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import {
  PROVIDER_FIELDS,
  usesSmsCode,
  type Provider,
} from "@/lib/auth-providers";
import { formatPhone, phoneDigits } from "@/lib/phone";
import { supabase } from "@/lib/supabase";

type Mode = "login" | "signup";
type Step = "form" | "code";
type LoadingPhase = "checkingAccount" | "checkingPassword";

/** Таджикистан — единственная поддерживаемая страна (см. Б-10 в ROADMAP). */
const COUNTRY_CODE = "+992";

/**
 * Правая панель авторизации.
 *
 * АРХИТЕКТУРА (решение в чате, 2026-08-06):
 * - LOGIN — только email + пароль (`signInWithPassword`). Ежедневный вход.
 * - SIGNUP — Телефон (SMS OTP) и Почта (WhatsApp и Telegram из регистрации
 *   убраны).
 *
 * Внутри способ «по почте» всё ещё зовётся `google` — и в `Provider`, и в
 * ключах переводов `auth.google.*`. Так вышло исторически: сначала кнопка
 * была подписана «Google», хотя никакого OAuth за ней не было. Надписи
 * исправлены 2026-08-07 (ROADMAP 16.24), идентификатор переименуем вместе
 * с задачей 16.23, где будем решать судьбу настоящего OAuth.
 *
 * Здесь именно `signUp()` — email + пароль. Реальный Google-аккаунт никто
 * не проверяет, подтверждение почты в Supabase сейчас выключено.
 */
export function AuthForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const locale = useLocale();

  const [mode, setMode] = useState<Mode>("login");
  const [provider, setProvider] = useState<Provider>("phone");
  const [step, setStep] = useState<Step>("form");
  const [value, setValue] = useState("");
  const [code, setCode] = useState("");
  const [pendingDigits, setPendingDigits] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const inputId = useId();
  const errorId = useId();
  const noticeId = useId();
  const codeInputId = useId();
  const emailId = useId();
  const passwordId = useId();
  const gEmailId = useId();
  const gPasswordId = useId();

  const copy = mode === "login" ? "login" : "signup";
  const field = PROVIDER_FIELDS[provider];

  function clearMessages() {
    setError(null);
    setNotice(null);
  }

  function errorMessage(err: unknown): string {
    return err instanceof Error && err.message ? err.message : t("errors.generic");
  }

  // ── LOGIN: email + пароль ──────────────────────────────────────

  async function handleEmailLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessages();

    if (!email.trim()) {
      setError(t("errors.emailRequired"));
      return;
    }
    if (!password) {
      setError(t("errors.passwordRequired"));
      return;
    }

    setSubmitting(true);
    setLoadingPhase("checkingAccount");
    // Чисто UX: один запрос signInWithPassword, но две фазы текста дают
    // ощущение "сначала проверили аккаунт, потом пароль".
    const phaseTimer = setTimeout(() => setLoadingPhase("checkingPassword"), 350);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) throw signInError;
      // Именно /stores, а не /dashboard: у входящего может быть два магазина,
      // и он должен выбрать сам. На /dashboard AuthGuard пропустил бы выбор,
      // если в localStorage остался валидный магазин с прошлого раза.
      // Если магазинов ещё нет, AuthGuard со /stores уведёт на /onboarding.
      router.push("/stores");
    } catch (err: unknown) {
      setError(errorMessage(err));
    } finally {
      clearTimeout(phaseTimer);
      setSubmitting(false);
      setLoadingPhase(null);
    }
  }

  // ── SIGNUP: по почте — email + пароль (внутренний ключ способа: `google`) ──

  async function handleGoogleSignup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessages();

    if (!email.trim()) {
      setError(t("errors.emailRequired"));
      return;
    }
    if (password.length < 8) {
      setError(t("errors.passwordShort"));
      return;
    }

    setSubmitting(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/${locale}/auth/callback`,
        },
      });
      if (signUpError) throw signUpError;

      if (data.session) {
        router.push("/onboarding");
      } else {
        // Supabase требует подтверждения почты — сессии ещё нет.
        setNotice(t("google.confirmEmail"));
      }
    } catch (err: unknown) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  // ── SIGNUP: телефон (SMS OTP) ───────────────────────────────────

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessages();

    const problem = field.validate(value);
    if (problem) {
      setError(t(`errors.${problem}`));
      return;
    }

    handleAuth();
  }

  /** Отправляет SMS-код на полный номер `+992XXXXXXXXX`. */
  async function sendOtp(digits: string) {
    const { error: authError } = await supabase.auth.signInWithOtp({
      phone: `${COUNTRY_CODE}${digits}`,
      options: { channel: "sms" },
    });
    if (authError) throw authError;
  }

  async function handleAuth() {
    setSubmitting(true);
    try {
      const digits = phoneDigits(value);
      await sendOtp(digits);
      setPendingDigits(digits);
      setCode("");
      setStep("code");
    } catch (err: unknown) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessages();

    if (code.trim().length === 0) {
      setError(t("errors.codeRequired"));
      return;
    }

    setSubmitting(true);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        phone: `${COUNTRY_CODE}${pendingDigits}`,
        token: code.trim(),
        type: "sms",
      });
      if (verifyError) throw verifyError;
      // Один и тот же поток для входа и регистрации по телефону — не решаем
      // здесь, есть ли у пользователя магазины. AuthGuard сам разведёт:
      // 0 магазинов → /onboarding, 1-2 → выбор на /stores.
      router.push("/stores");
    } catch (err: unknown) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    clearMessages();
    setSubmitting(true);
    try {
      await sendOtp(pendingDigits);
      setNotice(t("codeStep.resent"));
    } catch (err: unknown) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  function handleChangeNumber() {
    setStep("form");
    setCode("");
    clearMessages();
  }

  /** Повторный клик по способу возвращает вход по телефону. */
  function selectProvider(next: Provider) {
    setProvider((current) => (current === next ? "phone" : next));
    setValue("");
    setEmail("");
    setPassword("");
    clearMessages();
  }

  function switchMode() {
    setMode((current) => (current === "login" ? "signup" : "login"));
    setValue("");
    setEmail("");
    setPassword("");
    setProvider("phone");
    clearMessages();
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-col overflow-y-auto p-6 tablet:p-14">
      {/* Возврат на лендинг. Нужен именно здесь: на ≤900px левая панель
          с логотипом скрыта, и без этой ссылки уйти со страницы было бы
          нечем. */}
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-subtle transition-colors hover:text-brand-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("backToSite")}
      </Link>

      <div className="flex flex-1 flex-col justify-center">
        {mode === "login" ? (
          <>
            <div className="text-center">
              <h1 className="text-[30px] font-extrabold tracking-[-0.8px] text-balance">
                {t("login.heading")}
              </h1>
              <p className="mt-2.5 text-body leading-normal text-pretty text-subtle">
                {t("login.subheading")}
              </p>
            </div>

            <form onSubmit={handleEmailLogin} noValidate className="mt-8.5 flex flex-col gap-5">
              <div>
                <label
                  htmlFor={emailId}
                  className="mb-2.5 block text-[13px] font-bold tracking-[0.2px] text-muted"
                >
                  {t("emailLogin.emailLabel")}
                </label>
                <input
                  id={emailId}
                  type="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (error) setError(null);
                  }}
                  placeholder={t("emailLogin.emailPlaceholder")}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? errorId : undefined}
                  className="h-15 w-full rounded-card border-[1.5px] border-field-border bg-field px-4.5 font-bold transition-[border-color,box-shadow] duration-150 outline-none placeholder:font-medium placeholder:text-field-placeholder focus:border-brand-600 focus:shadow-[0_0_0_4px_rgb(15_82_186/0.10)]"
                />
              </div>

              <div>
                <label
                  htmlFor={passwordId}
                  className="mb-2.5 block text-[13px] font-bold tracking-[0.2px] text-muted"
                >
                  {t("emailLogin.passwordLabel")}
                </label>
                <input
                  id={passwordId}
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (error) setError(null);
                  }}
                  placeholder={t("emailLogin.passwordPlaceholder")}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? errorId : undefined}
                  className="h-15 w-full rounded-card border-[1.5px] border-field-border bg-field px-4.5 font-bold transition-[border-color,box-shadow] duration-150 outline-none placeholder:font-medium placeholder:text-field-placeholder focus:border-brand-600 focus:shadow-[0_0_0_4px_rgb(15_82_186/0.10)]"
                />
              </div>

              {error ? (
                <p id={errorId} role="alert" className="text-sm text-danger">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 h-14.5 w-full rounded-card bg-accent-500 text-[17px] font-extrabold text-on-accent shadow-[0_12px_24px_-12px_rgb(242_166_35/0.7)] transition-[background,transform] duration-150 hover:-translate-y-0.5 hover:bg-accent-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 active:translate-y-0 motion-reduce:hover:translate-y-0 disabled:pointer-events-none disabled:opacity-70"
              >
                {submitting && loadingPhase
                  ? t(`emailLogin.${loadingPhase}`)
                  : t("emailLogin.cta")}
              </button>
            </form>

            <div className="mt-4 text-center">
              <Link
                href="/auth/forgot-password"
                className="text-sm font-semibold text-subtle transition-colors hover:text-brand-ink"
              >
                {t("forgotPassword")}
              </Link>
            </div>

            <div className="mt-7.5 text-center">
              <p className="text-[14.5px] text-subtle">
                {t("login.switchPrompt")}
                <button
                  type="button"
                  onClick={switchMode}
                  className="ml-1.5 text-[14.5px] font-extrabold text-brand-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                >
                  {t("login.switchAction")}
                </button>
              </p>
            </div>
          </>
        ) : step === "code" ? (
          <>
            <div className="text-center">
              <h1 className="text-[30px] font-extrabold tracking-[-0.8px] text-balance">
                {t("codeStep.heading")}
              </h1>
              <p className="mt-2.5 text-body leading-normal text-pretty text-subtle">
                {t("codeStep.subheading", {
                  phone: `${COUNTRY_CODE} ${formatPhone(pendingDigits)}`,
                })}
              </p>
            </div>

            <form onSubmit={handleVerifyCode} noValidate className="mt-8.5">
              <label
                htmlFor={codeInputId}
                className="mb-2.5 block text-[13px] font-bold tracking-[0.2px] text-muted"
              >
                {t("codeStep.label")}
              </label>

              <input
                id={codeInputId}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(event) => {
                  setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
                  if (error) setError(null);
                  if (notice) setNotice(null);
                }}
                placeholder={t("codeStep.placeholder")}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : notice ? noticeId : undefined}
                className="h-15 w-full rounded-card border-[1.5px] border-field-border bg-field px-4.5 text-xl font-bold tracking-[4px] transition-[border-color,box-shadow] duration-150 outline-none placeholder:font-medium placeholder:tracking-normal placeholder:text-field-placeholder focus:border-brand-600 focus:shadow-[0_0_0_4px_rgb(15_82_186/0.10)]"
              />

              {error ? (
                <p id={errorId} role="alert" className="mt-2.5 text-sm text-danger">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="mt-5 h-14.5 w-full rounded-card bg-accent-500 text-[17px] font-extrabold text-on-accent shadow-[0_12px_24px_-12px_rgb(242_166_35/0.7)] transition-[background,transform] duration-150 hover:-translate-y-0.5 hover:bg-accent-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 active:translate-y-0 motion-reduce:hover:translate-y-0 disabled:pointer-events-none disabled:opacity-70"
              >
                {t("codeStep.submitCta")}
              </button>

              {notice ? (
                <p
                  id={noticeId}
                  role="status"
                  className="mt-3 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-700"
                >
                  {notice}
                </p>
              ) : null}
            </form>

            <div className="mt-7.5 flex items-center justify-center gap-4 text-center">
              <button
                type="button"
                onClick={handleResend}
                disabled={submitting}
                className="text-sm font-semibold text-subtle transition-colors hover:text-brand-ink disabled:pointer-events-none disabled:opacity-70"
              >
                {t("codeStep.resendCta")}
              </button>
              <span className="h-4 w-px bg-divider" aria-hidden />
              <button
                type="button"
                onClick={handleChangeNumber}
                className="text-sm font-semibold text-subtle transition-colors hover:text-brand-ink"
              >
                {t("codeStep.changeNumber")}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="text-center">
              <h1 className="text-[30px] font-extrabold tracking-[-0.8px] text-balance">
                {provider === "google" ? t("google.heading") : t(`${copy}.heading`)}
              </h1>
              <p className="mt-2.5 text-body leading-normal text-pretty text-subtle">
                {provider === "google" ? t("google.lead") : t(`${copy}.subheading`)}
              </p>
            </div>

            {provider === "google" ? (
              <form onSubmit={handleGoogleSignup} noValidate className="mt-8.5 flex flex-col gap-5">
                <div>
                  <label
                    htmlFor={gEmailId}
                    className="mb-2.5 block text-[13px] font-bold tracking-[0.2px] text-muted"
                  >
                    {t("google.emailLabel")}
                  </label>
                  <input
                    id={gEmailId}
                    type="email"
                    autoComplete="email"
                    autoFocus
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      if (error) setError(null);
                      if (notice) setNotice(null);
                    }}
                    placeholder={t("google.emailPlaceholder")}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? errorId : notice ? noticeId : undefined}
                    className="h-15 w-full rounded-card border-[1.5px] border-field-border bg-field px-4.5 font-bold transition-[border-color,box-shadow] duration-150 outline-none placeholder:font-medium placeholder:text-field-placeholder focus:border-brand-600 focus:shadow-[0_0_0_4px_rgb(15_82_186/0.10)]"
                  />
                </div>

                <div>
                  <label
                    htmlFor={gPasswordId}
                    className="mb-2.5 block text-[13px] font-bold tracking-[0.2px] text-muted"
                  >
                    {t("google.passwordLabel")}
                  </label>
                  <input
                    id={gPasswordId}
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      if (error) setError(null);
                      if (notice) setNotice(null);
                    }}
                    placeholder={t("google.passwordPlaceholder")}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? errorId : notice ? noticeId : undefined}
                    className="h-15 w-full rounded-card border-[1.5px] border-field-border bg-field px-4.5 font-bold transition-[border-color,box-shadow] duration-150 outline-none placeholder:font-medium placeholder:text-field-placeholder focus:border-brand-600 focus:shadow-[0_0_0_4px_rgb(15_82_186/0.10)]"
                  />
                </div>

                {error ? (
                  <p id={errorId} role="alert" className="text-sm text-danger">
                    {error}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-2 h-14.5 w-full rounded-card bg-accent-500 text-[17px] font-extrabold text-on-accent shadow-[0_12px_24px_-12px_rgb(242_166_35/0.7)] transition-[background,transform] duration-150 hover:-translate-y-0.5 hover:bg-accent-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 active:translate-y-0 motion-reduce:hover:translate-y-0 disabled:pointer-events-none disabled:opacity-70"
                >
                  {submitting ? t("google.ctaLoading") : t("google.cta")}
                </button>

                {notice ? (
                  <p
                    id={noticeId}
                    role="status"
                    className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-700"
                  >
                    {notice}
                  </p>
                ) : null}
              </form>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="mt-8.5">
                <label
                  htmlFor={inputId}
                  className="mb-2.5 block text-[13px] font-bold tracking-[0.2px] text-muted"
                >
                  {t(`providers.${provider}.label`)}
                </label>

                <div className="flex items-stretch gap-2.5">
                  <span
                    aria-label={t("countryLabel")}
                    className="flex h-15 items-center gap-2 rounded-card border-[1.5px] border-field-border bg-surface px-4 text-base font-bold whitespace-nowrap"
                  >
                    <Flag locale="tg" className="size-5" />
                    +992
                  </span>

                  <input
                    id={inputId}
                    type={field.inputType}
                    inputMode={field.inputMode}
                    autoComplete={field.autoComplete}
                    name={provider}
                    value={value}
                    onChange={(event) => {
                      setValue(field.format(event.target.value));
                      if (error) setError(null);
                      if (notice) setNotice(null);
                    }}
                    placeholder={t(`providers.${provider}.placeholder`)}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? errorId : notice ? noticeId : undefined}
                    className={cn(
                      "h-15 min-w-0 flex-1 rounded-card border-[1.5px] border-field-border bg-field px-4.5 font-bold transition-[border-color,box-shadow] duration-150 outline-none",
                      "placeholder:font-medium placeholder:text-field-placeholder",
                      "focus:border-brand-600 focus:shadow-[0_0_0_4px_rgb(15_82_186/0.10)]",
                      "text-xl tracking-[1px] placeholder:tracking-normal",
                    )}
                  />
                </div>

                {error ? (
                  <p id={errorId} role="alert" className="mt-2.5 text-sm text-danger">
                    {error}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-5 h-14.5 w-full rounded-card bg-accent-500 text-[17px] font-extrabold text-on-accent shadow-[0_12px_24px_-12px_rgb(242_166_35/0.7)] transition-[background,transform] duration-150 hover:-translate-y-0.5 hover:bg-accent-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 active:translate-y-0 motion-reduce:hover:translate-y-0 disabled:pointer-events-none disabled:opacity-70"
                >
                  {submitting ? t("sending") : usesSmsCode(provider) ? t("ctaCode") : t("ctaContinue")}
                </button>

                {notice ? (
                  <p
                    id={noticeId}
                    role="status"
                    className="mt-3 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-700"
                  >
                    {notice}
                  </p>
                ) : null}
              </form>
            )}

            <div className="my-6.5 flex items-center gap-3.5">
              <span className="h-px flex-1 bg-divider" />
              <span className="text-[13px] font-semibold whitespace-nowrap text-divider-text">
                {t("dividerSocial")}
              </span>
              <span className="h-px flex-1 bg-divider" />
            </div>

            <button
              type="button"
              onClick={() => selectProvider(provider === "google" ? "phone" : "google")}
              aria-label={
                provider === "google"
                  ? t("resetProvider")
                  : t("providerHint", { name: t("google.buttonLabel") })
              }
              className={cn(
                "flex h-13 w-full items-center justify-center gap-2 rounded-[13px] border-[1.5px] text-sm font-bold text-ink transition-[border-color,transform,box-shadow,background] duration-150",
                "border-field-border bg-card",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
                "hover:-translate-y-0.5 hover:border-brand-600 hover:shadow-[0_10px_22px_-14px_rgb(15_82_186/0.5)] motion-reduce:hover:translate-y-0",
              )}
            >
              {provider === "google" ? (
                <>
                  <Phone className="size-[18px]" />
                  {t("providers.phone.label")}
                </>
              ) : (
                <>
                  <Mail className="size-[18px]" />
                  {t("google.buttonLabel")}
                </>
              )}
            </button>

            <div className="mt-7.5 text-center">
              <p className="text-[14.5px] text-subtle">
                {t(`${copy}.switchPrompt`)}
                <button
                  type="button"
                  onClick={switchMode}
                  className="ml-1.5 text-[14.5px] font-extrabold text-brand-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                >
                  {t(`${copy}.switchAction`)}
                </button>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
