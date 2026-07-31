"use client";

import { useTranslations } from "next-intl";
import { useId, useState } from "react";

import {
  GoogleIcon,
  TelegramIcon,
  WhatsAppIcon,
} from "@/components/auth/social-icons";
import { formatPhone, phoneDigits, PHONE_DIGITS } from "@/lib/phone";

type Mode = "login" | "signup";

const SOCIALS = [
  { key: "google", name: "Google", Icon: GoogleIcon },
  { key: "telegram", name: "Telegram", Icon: TelegramIcon },
  { key: "whatsapp", name: "WhatsApp", Icon: WhatsAppIcon },
] as const;

/**
 * Правая панель: ввод телефона и переключение вход ↔ регистрация.
 *
 * Режим — состояние на клиенте, как в макете (один экран с переключателем).
 * Отправка кода пока не подключена: нужен backend (задача 10.7 в ROADMAP).
 */
export function AuthForm() {
  const t = useTranslations("auth");

  const [mode, setMode] = useState<Mode>("login");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const inputId = useId();
  const errorId = useId();
  const noticeId = useId();

  const copy = mode === "login" ? "login" : "signup";

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);

    const digits = phoneDigits(phone);

    if (digits.length === 0) {
      setError(t("errors.phoneRequired"));
      return;
    }

    if (digits.length < PHONE_DIGITS) {
      setError(t("errors.phoneIncomplete"));
      return;
    }

    setError(null);
    // Здесь будет вызов server action, отправляющей SMS с кодом.
    setNotice(t("notImplemented"));
  }

  function switchMode() {
    setMode((current) => (current === "login" ? "signup" : "login"));
    setError(null);
    setNotice(null);
  }

  return (
    <div className="flex flex-col justify-center p-8 tablet:p-14">
      <div className="text-center">
        <h1 className="text-[30px] font-extrabold tracking-[-0.8px] text-balance">
          {t(`${copy}.heading`)}
        </h1>
        <p className="mt-2.5 text-body leading-normal text-pretty text-subtle">
          {t(`${copy}.subheading`)}
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="mt-8.5">
        <label
          htmlFor={inputId}
          className="mb-2.5 block text-[13px] font-bold tracking-[0.2px] text-muted"
        >
          {t("phoneLabel")}
        </label>

        <div className="flex items-stretch gap-2.5">
          <span
            aria-label={t("countryLabel")}
            className="flex h-15 items-center gap-2 rounded-card border-[1.5px] border-[#E4E9F1] bg-surface px-4 text-base font-bold whitespace-nowrap"
          >
            <span aria-hidden className="text-xl leading-none">
              🇹🇯
            </span>
            +992
          </span>

          <input
            id={inputId}
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            name="phone"
            value={phone}
            onChange={(event) => {
              setPhone(formatPhone(event.target.value));
              // Снимаем прошлую ошибку сразу, как пользователь начал править
              // номер, — иначе она висит поверх уже исправленного ввода.
              if (error) setError(null);
              if (notice) setNotice(null);
            }}
            placeholder={t("phonePlaceholder")}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : notice ? noticeId : undefined}
            className="h-15 flex-1 rounded-card border-[1.5px] border-[#E4E9F1] bg-white px-4.5 text-xl font-bold tracking-[1px] transition-[border-color,box-shadow] duration-150 outline-none placeholder:font-medium placeholder:tracking-normal placeholder:text-[#AAB2C2] focus:border-brand-600 focus:shadow-[0_0_0_4px_rgb(15_82_186/0.10)]"
          />
        </div>

        {error ? (
          <p
            id={errorId}
            role="alert"
            className="mt-2.5 text-sm text-[#C2341D]"
          >
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          className="mt-5 h-14.5 w-full rounded-card bg-accent-500 text-[17px] font-extrabold text-ink shadow-[0_12px_24px_-12px_rgb(242_166_35/0.7)] transition-[background,transform] duration-150 hover:-translate-y-0.5 hover:bg-accent-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 active:translate-y-0 motion-reduce:hover:translate-y-0"
        >
          {t("cta")}
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

      <div className="my-6.5 flex items-center gap-3.5">
        <span className="h-px flex-1 bg-[#EAEEF4]" />
        <span className="text-[13px] font-semibold whitespace-nowrap text-[#9AA3B3]">
          {t("dividerSocial")}
        </span>
        <span className="h-px flex-1 bg-[#EAEEF4]" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {SOCIALS.map(({ key, name, Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setNotice(t("notImplemented"))}
            className="flex h-13 items-center justify-center gap-2 rounded-[13px] border-[1.5px] border-[#E4E9F1] bg-white text-sm font-bold text-ink transition-[border-color,transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:border-brand-600 hover:shadow-[0_10px_22px_-14px_rgb(15_82_186/0.5)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 motion-reduce:hover:translate-y-0"
          >
            <Icon className="size-[19px]" />
            {name}
          </button>
        ))}
      </div>

      <div className="mt-7.5 text-center">
        <a
          href="#"
          className="text-sm font-semibold text-subtle transition-colors hover:text-brand-600"
        >
          {t("forgotPassword")}
        </a>

        <p className="mt-4 text-[14.5px] text-subtle">
          {t(`${copy}.switchPrompt`)}
          <button
            type="button"
            onClick={switchMode}
            className="ml-1.5 text-[14.5px] font-extrabold text-brand-600 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            {t(`${copy}.switchAction`)}
          </button>
        </p>
      </div>
    </div>
  );
}
