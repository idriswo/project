/**
 * Форматирование чисел приложения.
 *
 * Локаль зафиксирована как `ru-RU` намеренно: разделитель разрядов —
 * неразрывный пробел, а не запятая, и это одинаково читается на всех
 * трёх языках сайта. Тратить на деньги локаль интерфейса нельзя —
 * владелец, переключивший язык на английский, увидел бы `1,250,000`
 * и прочитал бы это как другое число.
 */

/** Прочерк вместо `NaN`: пропущенное число — «неизвестно», а не «ноль». */
export const NO_VALUE = "—";

const groups = new Intl.NumberFormat("ru-RU");

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** Деньги: без копеек. В сомони копейки в рознице никто не считает. */
export function money(value: number | null | undefined): string {
  if (!isNumber(value)) return NO_VALUE;
  return groups.format(Math.round(value));
}

/** Штуки, чеки, позиции. */
export function count(value: number | null | undefined): string {
  if (!isNumber(value)) return NO_VALUE;
  return groups.format(Math.round(value));
}

/** Проценты маржи и роста: один знак, потому что второй ничего не решает. */
export function percent(value: number | null | undefined): string {
  if (!isNumber(value)) return NO_VALUE;
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

/**
 * Короткая подпись оси графика: `12 500` в подпись не влезает, а `12.5к`
 * влезает и читается. Ниже тысячи сокращать нечего.
 *
 * До десяти тысяч показываем десятые. Округление до целых давало на оси
 * две одинаковые подписи: 1500 и 2000 обе превращались в «2к», и шкала
 * выглядела сломанной. Дальше десяти тысяч шаг оси и так крупный, дробь
 * там только удлиняет подпись.
 */
export function moneyShort(value: number | null | undefined): string {
  if (!isNumber(value)) return NO_VALUE;
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${trim(value / 1_000_000)}м`;
  if (abs >= 1_000) {
    const k = value / 1_000;
    return `${Math.abs(k) < 10 ? trim(k) : Math.round(k)}к`;
  }
  return String(Math.round(value));
}

/** `2.0` → `2`, `1.5` → `1.5`: нулевая десятая ничего не сообщает. */
function trim(value: number): string {
  return value.toFixed(1).replace(/\.0$/, "");
}

/**
 * Дата из `/reports/sales-by-day` (`YYYY-MM-DD`) в подпись оси.
 * `new Date(...)` здесь не нужен: строка уже разобрана, а разбор дал бы
 * сдвиг на часовой пояс и подписал бы столбец соседним днём.
 */
export function dayLabel(iso: string): string {
  const parts = String(iso).split("-");
  return parts.length === 3 ? `${parts[2]}.${parts[1]}` : String(iso);
}

/**
 * Инициал для плитки товара без фотографии.
 * Пустое имя дало бы пустой квадрат — тогда лучше знак вопроса.
 */
export function initial(name: string | null | undefined): string {
  const trimmed = (name ?? "").trim();
  return trimmed ? trimmed[0].toUpperCase() : "?";
}

/**
 * Цвет плитки-заглушки выбирается из имени товара, а не случайно:
 * при перезагрузке страницы куртка обязана остаться того же цвета,
 * иначе список каждый раз выглядит как новый.
 */
const TILE_TONES = [
  "bg-[#e8effb] text-[#0f52ba]",
  "bg-[#fdf3e1] text-[#a8700c]",
  "bg-[#e6f4ee] text-[#1a7f5a]",
  "bg-[#f0ebfa] text-[#5b3fb0]",
  "bg-[#fbecea] text-[#c2341d]",
  "bg-[#e7f2f6] text-[#0f6d84]",
] as const;

export function toneOf(seed: string | null | undefined): string {
  const text = (seed ?? "").trim();
  let sum = 0;
  for (let i = 0; i < text.length; i += 1) sum = (sum + text.charCodeAt(i)) % 997;
  return TILE_TONES[sum % TILE_TONES.length];
}
