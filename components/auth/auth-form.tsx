"use client";

import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";

import {
  GoogleIcon,
  TelegramIcon,
  WhatsAppIcon,
} from "@/components/auth/social-icons";
import { Flag } from "@/components/flags";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import {
  PROVIDER_FIELDS,
  usesSmsCode,
  type Provider,
} from "@/lib/auth-providers";

type Mode = "login" | "signup";

/** Названия брендов не переводятся, поэтому живут в коде. */
const PROVIDER_NAMES: Record<Provider, string> = {
  phone: "",
  google: "Google",
  telegram: "Telegram",
  whatsapp: "WhatsApp",
};

const SOCIALS = [
  { key: "google", name: "Google", Icon: GoogleIcon },
  { key: "telegram", name: "Telegram", Icon: TelegramIcon },
  { key: "whatsapp", name: "WhatsApp", Icon: WhatsAppIcon },
] as const satisfies ReadonlyArray<{
  key: Provider;
  name: string;
  Icon: (props: { className?: string }) => React.ReactElement;
}>;

/**
 * Правая панель: ввод контакта и переключение вход ↔ регистрация.
 *
 * Способ входа меняет само поле: телефон и WhatsApp просят номер,
 * Google — адрес почты, Telegram — имя пользователя. Правила полей
 * вынесены в lib/auth-providers.ts.
 *
 * ⚠️ Ничего из этого пока не отправляется: нужен backend (задача 10.7).
 * В настоящем OAuth-потоке Google и Telegram увели бы на свою страницу
 * входа, а не спрашивали адрес здесь (задача 10.8).
 */
export function AuthForm() {
  const t = useTranslations("auth");

  const [mode, setMode] = useState<Mode>("login");
  const [provider, setProvider] = useState<Provider>("phone");
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const inputId = useId();
  const errorId = useId();
  const noticeId = useId();

  const copy = mode === "login" ? "login" : "signup";
  const field = PROVIDER_FIELDS[provider];

  function clearMessages() {
    setError(null);
    setNotice(null);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessages();

    const problem = field.validate(value);

    if (problem) {
      setError(t(`errors.${problem}`));
      return;
    }

    // Здесь будет server action: отправка SMS либо редирект в OAuth.
    setNotice(t("notImplemented"));
  }

  /** Повторный клик по выбранному способу возвращает вход по телефону. */
  function selectProvider(next: Provider) {
    setProvider((current) => (current === next ? "phone" : next));
    setValue("");
    clearMessages();
  }

  function switchMode() {
    setMode((current) => (current === "login" ? "signup" : "login"));
    setValue("");
    clearMessages();
  }

  return (
    <div className="flex flex-col p-8 tablet:p-14">
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
        <div className="text-center">
          <h1 className="text-[30px] font-extrabold tracking-[-0.8px] text-balance">
            {t(`${copy}.heading`)}
          </h1>
          <p className="mt-2.5 text-body leading-normal text-pretty text-subtle">
            {/* Подзаголовок по умолчанию говорит про код на телефон —
                при выборе соцсети он был бы неверным. */}
            {provider === "phone"
              ? t(`${copy}.subheading`)
              : t("providerHint", { name: PROVIDER_NAMES[provider] })}
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-8.5">
          <label
            htmlFor={inputId}
            className="mb-2.5 block text-[13px] font-bold tracking-[0.2px] text-muted"
          >
            {t(`providers.${provider}.label`)}
          </label>

          <div className="flex items-stretch gap-2.5">
            {field.prefix === "country" ? (
              <span
                aria-label={t("countryLabel")}
                className="flex h-15 items-center gap-2 rounded-card border-[1.5px] border-field-border bg-surface px-4 text-base font-bold whitespace-nowrap"
              >
                <Flag locale="tg" className="size-5" />
                +992
              </span>
            ) : null}

            {field.prefix === "at" ? (
              <span
                aria-hidden
                className="flex h-15 items-center rounded-card border-[1.5px] border-field-border bg-surface px-4 text-xl font-bold"
              >
                @
              </span>
            ) : null}

            <input
              id={inputId}
              // key сбрасывает состояние поля при смене способа входа:
              // иначе браузер тащит автозаполнение от прошлого типа.
              key={provider}
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
                "h-15 flex-1 rounded-card border-[1.5px] border-field-border bg-field px-4.5 font-bold transition-[border-color,box-shadow] duration-150 outline-none",
                "placeholder:font-medium placeholder:text-field-placeholder",
                "focus:border-brand-600 focus:shadow-[0_0_0_4px_rgb(15_82_186/0.10)]",
                // Крупный моноширинный ритм уместен для номера,
                // но мешает читать почту и ник.
                provider === "phone" || provider === "whatsapp"
                  ? "text-xl tracking-[1px] placeholder:tracking-normal"
                  : "text-base",
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
            className="mt-5 h-14.5 w-full rounded-card bg-accent-500 text-[17px] font-extrabold text-on-accent shadow-[0_12px_24px_-12px_rgb(242_166_35/0.7)] transition-[background,transform] duration-150 hover:-translate-y-0.5 hover:bg-accent-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 active:translate-y-0 motion-reduce:hover:translate-y-0"
          >
            {usesSmsCode(provider) ? t("ctaCode") : t("ctaContinue")}
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
          <span className="h-px flex-1 bg-divider" />
          <span className="text-[13px] font-semibold whitespace-nowrap text-divider-text">
            {t("dividerSocial")}
          </span>
          <span className="h-px flex-1 bg-divider" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          {SOCIALS.map(({ key, name, Icon }) => {
            const isSelected = provider === key;

            return (
              <button
                key={key}
                type="button"
                onClick={() => selectProvider(key)}
                aria-pressed={isSelected}
                aria-label={
                  isSelected ? t("resetProvider") : t("providerHint", { name })
                }
                className={cn(
                  "flex h-13 items-center justify-center gap-2 rounded-[13px] border-[1.5px] text-sm font-bold transition-[border-color,transform,box-shadow,background] duration-150",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
                  "hover:-translate-y-0.5 motion-reduce:hover:translate-y-0",
                  isSelected
                    ? "border-brand-600 bg-brand-50 text-brand-ink shadow-[0_10px_22px_-14px_rgb(15_82_186/0.5)]"
                    : "border-field-border bg-card text-ink hover:border-brand-600 hover:shadow-[0_10px_22px_-14px_rgb(15_82_186/0.5)]",
                )}
              >
                <Icon className="size-[19px]" />
                {name}
              </button>
            );
          })}
        </div>

        <div className="mt-7.5 text-center">
          <a
            href="#"
            className="text-sm font-semibold text-subtle transition-colors hover:text-brand-ink"
          >
            {t("forgotPassword")}
          </a>

          <p className="mt-4 text-[14.5px] text-subtle">
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
      </div>
    </div>
  );
}
