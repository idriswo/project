import { formatPhone, phoneDigits, PHONE_DIGITS } from "@/lib/phone";

export type Provider = "phone" | "google" | "telegram" | "whatsapp";

/** Ключ ошибки в переводах или null, если значение корректно. */
export type ValidationError =
  | "phoneRequired"
  | "phoneIncomplete"
  | "emailRequired"
  | "emailInvalid"
  | "usernameRequired"
  | "usernameInvalid";

/**
 * Правила поля ввода для каждого способа входа.
 *
 * Телефон и WhatsApp работают по номеру, Google — по адресу почты,
 * Telegram — по имени пользователя. Поэтому у поля меняются не только
 * подпись и подсказка, но и тип, клавиатура и проверка.
 */
type ProviderField = {
  /** Как отформатировать введённое перед записью в состояние. */
  format: (raw: string) => string;
  validate: (value: string) => ValidationError | null;
  inputType: "tel" | "email" | "text";
  inputMode: "numeric" | "email" | "text";
  autoComplete: string;
  /** Неизменяемый префикс слева от поля: код страны или «@». */
  prefix: "country" | "at" | null;
};

const phoneField: ProviderField = {
  format: formatPhone,
  validate: (value) => {
    const digits = phoneDigits(value);
    if (digits.length === 0) return "phoneRequired";
    if (digits.length < PHONE_DIGITS) return "phoneIncomplete";
    return null;
  },
  inputType: "tel",
  inputMode: "numeric",
  autoComplete: "tel-national",
  prefix: "country",
};

/* Проверка намеренно мягкая: точную валидность адреса подтвердит только
 * письмо, а слишком строгие регулярки отсекают нормальные адреса. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const USERNAME_PATTERN = /^[a-zA-Z0-9_]{5,32}$/;

export const PROVIDER_FIELDS: Record<Provider, ProviderField> = {
  phone: phoneField,
  whatsapp: phoneField,

  google: {
    format: (raw) => raw.trim().toLowerCase(),
    validate: (value) => {
      if (value.length === 0) return "emailRequired";
      if (!EMAIL_PATTERN.test(value)) return "emailInvalid";
      return null;
    },
    inputType: "email",
    inputMode: "email",
    autoComplete: "email",
    prefix: null,
  },

  telegram: {
    format: (raw) => raw.replace(/^@+/, "").replace(/[^a-zA-Z0-9_]/g, ""),
    validate: (value) => {
      if (value.length === 0) return "usernameRequired";
      if (!USERNAME_PATTERN.test(value)) return "usernameInvalid";
      return null;
    },
    inputType: "text",
    inputMode: "text",
    autoComplete: "username",
    prefix: "at",
  },
};

/** Телефонные способы получают код по SMS, остальные просто продолжают. */
export function usesSmsCode(provider: Provider) {
  return provider === "phone" || provider === "whatsapp";
}
