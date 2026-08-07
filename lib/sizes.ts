/**
 * Порядок размеров.
 *
 * Бэкенд хранит `size` строкой, и сортировка по алфавиту рассыпает ряд:
 * `10` встаёт перед `2`, `XL` перед `S`. А весь смысл кривой в том, что
 * размеры идут по возрастанию — иначе провал посередине не увидеть.
 *
 * Две шкалы, потому что магазин одежды пользуется обеими: куртки в
 * `S / M / L`, джинсы в `40 / 42 / 44`.
 */

/** Буквенная шкала. Индекс — позиция в ряду. */
const LETTER_SCALE = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"] as const;

/** `2XL` и `XXL` — один и тот же размер, написанный по-разному. */
const LETTER_ALIASES: Record<string, string> = {
  "2XS": "XXS",
  "2XL": "XXL",
  "3XL": "XXXL",
};

function normalizeLetter(size: string): string {
  const upper = size.trim().toUpperCase();
  return LETTER_ALIASES[upper] ?? upper;
}

/**
 * Вес размера для сортировки. Числовые размеры идут после буквенных —
 * смешивать шкалы в одном ряду всё равно нельзя, но если это случилось,
 * пусть хотя бы каждая группа останется упорядоченной внутри себя.
 */
function weight(size: string): number {
  const letterIndex = LETTER_SCALE.indexOf(
    normalizeLetter(size) as (typeof LETTER_SCALE)[number],
  );
  if (letterIndex !== -1) return letterIndex;

  const numeric = Number.parseFloat(size.replace(",", "."));
  if (Number.isFinite(numeric)) return 1000 + numeric;

  // Незнакомая запись — в конец ряда, но не теряем её.
  return 100000;
}

/** Сравнение для `Array.prototype.sort`. Незнакомые размеры сортируются между собой по алфавиту. */
export function compareSizes(a: string, b: string): number {
  const diff = weight(a) - weight(b);
  if (diff !== 0) return diff;
  return a.localeCompare(b);
}

/** Уникальные размеры в правильном порядке. `null` (у товара без размеров) отбрасывается. */
export function orderSizes(sizes: (string | null)[]): string[] {
  const unique = new Set<string>();
  for (const size of sizes) {
    if (size && size.trim()) unique.add(size.trim());
  }
  return [...unique].sort(compareSizes);
}
