/** Номер без кода страны: 9 цифр (формат Таджикистана, +992). */
export const PHONE_DIGITS = 9;

/** Оставляет только цифры, максимум PHONE_DIGITS штук. */
export function phoneDigits(value: string) {
  return (value || "").replace(/\D/g, "").slice(0, PHONE_DIGITS);
}

/**
 * Приводит ввод к виду «00 000 00 00» — группы 2-3-2-2, как в макете.
 * Форматирование по ходу набора, поэтому неполные номера тоже корректны.
 */
export function formatPhone(value: string) {
  const digits = phoneDigits(value);
  const groups: string[] = [];

  if (digits.length > 0) groups.push(digits.slice(0, 2));
  if (digits.length > 2) groups.push(digits.slice(2, 5));
  if (digits.length > 5) groups.push(digits.slice(5, 7));
  if (digits.length > 7) groups.push(digits.slice(7, 9));

  return groups.join(" ");
}
