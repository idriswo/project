import { extendTailwindMerge } from "tailwind-merge";

/**
 * Размеры шрифта из `@theme` в `app/globals.css` (`--text-*`).
 *
 * twMerge не читает CSS проекта и без этого списка принимает `text-price`
 * за цвет текста. Тогда `cn("text-price", "text-white")` выбрасывал размер
 * как «конфликтующий цвет», и цена на тарифах выходила 16px вместо 44px.
 * Добавили токен в `@theme` — добавь и сюда.
 */
const FONT_SIZES = ["eyebrow", "body", "lead", "h3", "price", "h2", "h1"];

const twMerge = extendTailwindMerge({
  extend: { theme: { text: FONT_SIZES } },
});

/**
 * Склейка классов Tailwind с разрешением конфликтов.
 *
 * Простого join здесь недостаточно. Порядок классов в атрибуте ни на что
 * не влияет — выигрывает тот, чьё правило идёт позже в сгенерированном CSS.
 * Из-за этого `cn("inline-flex", "hidden")` давал видимый элемент: у Tailwind
 * `inline-flex` объявлен после `hidden`. Так кнопка «Начать» показывалась
 * в шапке на телефонах и ломала вёрстку горизонтальным переполнением.
 *
 * twMerge убирает более ранний класс из той же группы, поэтому побеждает
 * последний переданный — тот, который написал вызывающий код.
 *
 * Кастомные брейкпоинты (tablet, desktop, auth) объявлять не нужно:
 * twMerge разбирает `tablet:inline-flex` как модификатор + класс, а разные
 * модификаторы считает разными группами и друг с другом не смешивает.
 */
export function cn(...classes: Array<string | false | null | undefined>) {
  return twMerge(classes.filter(Boolean).join(" "));
}
