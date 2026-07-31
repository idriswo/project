/**
 * Склейка классов без зависимостей: отбрасывает falsy-значения.
 * Достаточно для лендинга — конфликтующих утилит мы не генерируем,
 * поэтому tailwind-merge здесь избыточен.
 */
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
