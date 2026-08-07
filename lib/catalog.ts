/**
 * Формы ответов бэкенда по товарам — то, что реально приходит по сети
 * (`serializeProduct` / `serializeVariant` в `inventory.service.ts`).
 *
 * Числовые поля описаны как обязательные, потому что бэкенд их всегда
 * присылает, но обращаться к ним всё равно стоит через хелперы ниже:
 * один сломанный товар не должен ронять весь экран.
 */

export interface Variant {
  id: string;
  productId: string;
  size: string | null;
  color: string | null;
  sku: string | null;
  barcode: string | null;
  price: number;
  costPrice: number;
  /** Зал — то, что покупатель может взять руками прямо сейчас. */
  quantityStore: number;
  /** Склад — запас в подсобке. */
  quantityWarehouse: number;
  totalQuantity: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  isActive: boolean;
  category: { id: string; name: string } | null;
  variants: Variant[];
  totalQuantity: number;
}

/** Ответ `GET /inventory/products` после разворачивания конверта в `apiClient`. */
export interface ProductPage {
  items: Product[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Строка `GET /reports/size-analysis`: какие размеры магазин продаёт чаще. */
export interface SizeDemand {
  size: string;
  soldQuantity: number;
}

function count(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function inStore(variant: Variant): number {
  return count(variant?.quantityStore);
}

export function inWarehouse(variant: Variant): number {
  return count(variant?.quantityWarehouse);
}

/** Цвета товара в порядке появления — они и станут переключателем над кривой. */
export function colorsOf(product: Product): string[] {
  const seen: string[] = [];
  for (const variant of product.variants ?? []) {
    const color = variant.color?.trim();
    if (color && !seen.includes(color)) seen.push(color);
  }
  return seen;
}

/**
 * Размеры, которые магазин продаёт чаще прочих.
 *
 * Золото на кривой обязано загораться не на любом нуле, а там, где размер
 * реально покупают — иначе подсветка превращается в украшение. Порог:
 * размер попадает в «ходовые», если на него приходится хотя бы пятая часть
 * от продаж лидера. Так у магазина с двумя ходовыми размерами их и будет
 * два, а не половина шкалы.
 */
export function popularSizes(demand: SizeDemand[]): Set<string> {
  const rows = (demand ?? []).filter(
    (row) => row?.size && count(row.soldQuantity) > 0,
  );
  if (rows.length === 0) return new Set();

  const top = Math.max(...rows.map((row) => count(row.soldQuantity)));
  const threshold = top * 0.2;

  return new Set(
    rows
      .filter((row) => count(row.soldQuantity) >= threshold)
      .map((row) => row.size.trim()),
  );
}
