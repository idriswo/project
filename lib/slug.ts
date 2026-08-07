/**
 * Транслитерация таджикской/русской кириллицы в латиницу — только для
 * генерации slug дӯкона (POST /tenants требует /^[a-z0-9-]+$/). Не
 * претендует на лингвистическую точность, только на читаемый результат.
 */
const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  ғ: "gh",
  д: "d",
  е: "e",
  ё: "yo",
  ж: "zh",
  з: "z",
  и: "i",
  ӣ: "i",
  й: "y",
  к: "k",
  қ: "q",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ӯ: "u",
  ф: "f",
  х: "h",
  ҳ: "h",
  ч: "ch",
  ҷ: "j",
  ш: "sh",
  щ: "sh",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

function transliterate(value: string): string {
  return value
    .toLowerCase()
    .split("")
    .map((char) => CYRILLIC_TO_LATIN[char] ?? char)
    .join("");
}

/** Случайный хвост из 4 символов — снижает риск коллизии slug. */
function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 6);
}

/**
 * Строит slug из названия магазина: транслитерация → только [a-z0-9-] →
 * случайный суффикс. Суффикс добавляется всегда, а не только при
 * коллизии, — короткие латинские названия (Shop, Tim) иначе конфликтовали
 * бы друг с другом ещё до первой проверки на сервере.
 */
export function slugify(name: string): string {
  const base = transliterate(name.trim())
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  return `${base || "shop"}-${randomSuffix()}`;
}
