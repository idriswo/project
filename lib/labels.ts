/**
 * Печать этикеток.
 *
 * Термопринтер печатает не «страницу», а ленту известной ширины, поэтому
 * размер этикетки — это физические миллиметры, а не пиксели. Всё, что
 * ниже, задано в мм и попадает в CSS `@page` при печати: браузер сам
 * посчитает разрешение под конкретный принтер.
 */

export type PrinterModel = "zebra" | "xprinter";

export type LabelSizeKey = "58x40" | "58x30" | "40x30" | "30x20";

export type LabelType = "standard" | "discount";

export const PRINTERS: Record<PrinterModel, { name: string; dpi: number }> = {
  // 203 dpi — базовое разрешение обеих массовых моделей. Оно нужно не для
  // экрана, а чтобы предупредить: при 58мм ширине в строку влезает
  // ограниченное число точек, и слишком мелкий шрифт превратится в кашу.
  zebra: { name: "Zebra", dpi: 203 },
  xprinter: { name: "Xprinter", dpi: 203 },
};

export const LABEL_SIZES: Record<LabelSizeKey, { w: number; h: number }> = {
  "58x40": { w: 58, h: 40 },
  "58x30": { w: 58, h: 30 },
  "40x30": { w: 40, h: 30 },
  "30x20": { w: 30, h: 20 },
};

export type LabelConfig = {
  printer: PrinterModel;
  size: LabelSizeKey;
  quantity: number;
  showBarcode: boolean;
  showQr: boolean;
  type: LabelType;
};

export const DEFAULT_LABEL: LabelConfig = {
  printer: "zebra",
  size: "58x40",
  quantity: 10,
  showBarcode: true,
  showQr: false,
  type: "standard",
};

/** Что печатаем: конкретный вариант товара. */
export type LabelData = {
  productName: string;
  size?: string | null;
  /** Штрихкод варианта. Без него печатать нечего, кроме цены. */
  barcode?: string | null;
  price: number;
  /** Старая цена — только в режиме скидки. */
  oldPrice?: number | null;
  storeName?: string | null;
};

/**
 * Ограничение количества.
 *
 * Верхняя граница не придирка: при опечатке «1000» вместо «10» лента
 * уезжает целиком, и остановить термопринтер посреди задания нечем.
 */
export const MAX_LABELS = 300;

export function clampQuantity(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(MAX_LABELS, Math.max(1, Math.round(value)));
}

/**
 * Настройки сканера.
 *
 * Бекенду они не нужны: сканер подключён к конкретному компьютеру и
 * прикидывается клавиатурой. Держим в `localStorage` этого рабочего
 * места — на другом прилавке будет свой сканер и свои префиксы.
 */
export type ScannerConfig = {
  enterAfterScan: boolean;
  allowQr: boolean;
  sound: boolean;
  prefix: string;
  suffix: string;
};

export const DEFAULT_SCANNER: ScannerConfig = {
  enterAfterScan: true,
  allowQr: true,
  sound: true,
  prefix: "",
  suffix: "\\n",
};

const SCANNER_KEY = "tim.scanner";

export function readScannerConfig(): ScannerConfig {
  if (typeof window === "undefined") return DEFAULT_SCANNER;
  try {
    const raw = window.localStorage.getItem(SCANNER_KEY);
    if (!raw) return DEFAULT_SCANNER;
    // Настройки могли быть записаны старой версией — недостающие поля
    // добираем из умолчаний, а не роняем экран настроек.
    return { ...DEFAULT_SCANNER, ...(JSON.parse(raw) as object) };
  } catch {
    return DEFAULT_SCANNER;
  }
}

export function writeScannerConfig(config: ScannerConfig): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SCANNER_KEY, JSON.stringify(config));
  } catch {
    // Приватный режим Safari запрещает запись. Настройки просто не
    // переживут перезагрузку — это не повод показывать ошибку.
  }
}
