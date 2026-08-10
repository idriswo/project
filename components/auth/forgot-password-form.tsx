"use client";

import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";

import { Link, useRouter } from "@/i18n/navigation";
import { supabase } from "@/lib/supabase";

type Step = "email" | "code" | "newPassword";

const inputClass =
  "h-15 w-full rounded-card border-[1.5px] border-field-border bg-field px-4.5 font-bold transition-[border-color,box-shadow] duration-150 outline-none placeholder:font-medium placeholder:text-field-placeholder focus:border-brand-600 focus:shadow-[0_0_0_4px_rgb(15_82_186/0.10)]";

const buttonClass =
  "mt-2 h-14.5 w-full rounded-card bg-accent-500 text-[17px] font-extrabold text-on-accent shadow-[0_12px_24px_-12px_rgb(242_166_35/0.7)] transition-[background,transform] duration-150 hover:-translate-y-0.5 hover:bg-accent-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 active:translate-y-0 motion-reduce:hover:translate-y-0 disabled:pointer-events-none disabled:opacity-70";

/**
 * Восстановление пароля в 3 шага: почта → код из письма → новый пароль.
 * `verifyOtp({ type: "recovery" })` создаёт временную сессию, которой
 * достаточно для `updateUser({ password })` на последнем шаге.
 */
export function ForgotPasswordForm() {
  const t = useTranslations("auth.passwordReset");
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailId = useId();
  const codeId = useId();
  const passwordId = useId();
  const confirmId = useId();

  function errorMessage(err: unknown): string {
    return err instanceof Error && err.message
      ? err.message
      : t("errors.generic");
  }

  async function handleSendCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError(t("errors.emailRequired"));
      return;
    }

    setSubmitting(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
      );
      if (resetError) throw resetError;
      setStep("code");
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
        email: email.trim(),
        token: code.trim(),
        type: "recovery",
      });
      if (verifyError) throw verifyError;
      setStep("newPassword");
    } catch (err: unknown) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSetNewPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError(t("errors.passwordShort"));
      return;
    }
    if (password !== confirm) {
      setError(t("errors.passwordMismatch"));
      return;
    }

    setSubmitting(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });
      if (updateError) throw updateError;
      router.push("/onboarding");
    } catch (err: unknown) {
      setError(errorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-5 py-10">
      <div className="w-full max-w-[440px] rounded-[20px] border border-line bg-card p-8 shadow-[0_1px_3px_rgba(0,0,0,0.08)] tablet:p-10">
        <Link
          href="/auth"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-subtle transition-colors hover:text-brand-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t("backToLogin")}
        </Link>

        {step === "email" ? (
          <>
            <h1 className="text-[24px] font-extrabold tracking-[-0.5px] text-balance">
              {t("emailStep.heading")}
            </h1>
            <p className="mt-2.5 text-body leading-normal text-pretty text-subtle">
              {t("emailStep.lead")}
            </p>

            <form
              onSubmit={handleSendCode}
              noValidate
              className="mt-7 flex flex-col gap-5"
            >
              <div>
                <label
                  htmlFor={emailId}
                  className="mb-2 block text-[13px] font-bold text-muted"
                >
                  {t("emailStep.label")}
                </label>
                <input
                  id={emailId}
                  type="email"
                  autoFocus
                  autoComplete="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (error) setError(null);
                  }}
                  placeholder={t("emailStep.placeholder")}
                  className={inputClass}
                />
              </div>

              {error ? (
                <p role="alert" className="text-sm text-danger">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className={buttonClass}
              >
                {submitting ? t("emailStep.ctaLoading") : t("emailStep.cta")}
              </button>
            </form>
          </>
        ) : step === "code" ? (
          <>
            <h1 className="text-[24px] font-extrabold tracking-[-0.5px] text-balance">
              {t("codeStep.heading")}
            </h1>
            <p className="mt-2.5 text-body leading-normal text-pretty text-subtle">
              {t("codeStep.lead", { email })}
            </p>

            <form
              onSubmit={handleVerifyCode}
              noValidate
              className="mt-7 flex flex-col gap-5"
            >
              <div>
                <label
                  htmlFor={codeId}
                  className="mb-2 block text-[13px] font-bold text-muted"
                >
                  {t("codeStep.label")}
                </label>
                <input
                  id={codeId}
                  type="text"
                  inputMode="numeric"
                  autoFocus
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(event) => {
                    setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
                    if (error) setError(null);
                  }}
                  placeholder={t("codeStep.placeholder")}
                  className={`${inputClass} text-xl tracking-[4px] placeholder:tracking-normal`}
                />
              </div>

              {error ? (
                <p role="alert" className="text-sm text-danger">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className={buttonClass}
              >
                {submitting ? t("codeStep.ctaLoading") : t("codeStep.cta")}
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="text-[24px] font-extrabold tracking-[-0.5px] text-balance">
              {t("newPasswordStep.heading")}
            </h1>
            <p className="mt-2.5 text-body leading-normal text-pretty text-subtle">
              {t("newPasswordStep.lead")}
            </p>

            <form
              onSubmit={handleSetNewPassword}
              noValidate
              className="mt-7 flex flex-col gap-5"
            >
              <div>
                <label
                  htmlFor={passwordId}
                  className="mb-2 block text-[13px] font-bold text-muted"
                >
                  {t("newPasswordStep.label")}
                </label>
                <input
                  id={passwordId}
                  type="password"
                  autoFocus
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (error) setError(null);
                  }}
                  placeholder={t("newPasswordStep.placeholder")}
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor={confirmId}
                  className="mb-2 block text-[13px] font-bold text-muted"
                >
                  {t("newPasswordStep.confirmLabel")}
                </label>
                <input
                  id={confirmId}
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(event) => {
                    setConfirm(event.target.value);
                    if (error) setError(null);
                  }}
                  placeholder={t("newPasswordStep.confirmPlaceholder")}
                  className={inputClass}
                />
              </div>

              {error ? (
                <p role="alert" className="text-sm text-danger">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className={buttonClass}
              >
                {submitting
                  ? t("newPasswordStep.ctaLoading")
                  : t("newPasswordStep.cta")}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
