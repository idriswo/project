import { fetchApi } from "@/lib/apiClient";

/**
 * Операции с остатками.
 *
 * ВАЖНО про перевод склад → зал. В бэкенде нет причины «перемещение»
 * (`StockReason`: PURCHASE, SALE, RETURN, ADJUSTMENT, WRITE_OFF), а
 * `POST /inventory/stock` меняет остаток одной локации за вызов. Значит
 * перевод — это два вызова, и между ними товар может зависнуть: если
 * второй не пройдёт, вещи уже списаны со склада, но в зал не попали.
 *
 * Молча это проглатывать нельзя — расхождение в учёте владелец обнаружит
 * при инвентаризации и не поймёт, откуда оно. Поэтому `moveToFloor`
 * различает три исхода и о среднем сообщает прямым текстом.
 *
 * Правильное решение — атомарный перевод на стороне бэкенда, задача 17.10.
 */

export type MoveOutcome =
  | { status: "done" }
  /** Со склада списали, в зал не добавили — учёт разъехался. */
  | { status: "stuck"; message: string }
  /** Не начали: склад не изменился, повторять безопасно. */
  | { status: "failed"; message: string };

function reason(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

export async function moveToFloor(
  variantId: string,
  quantity: number,
): Promise<MoveOutcome> {
  if (quantity <= 0) return { status: "done" };

  try {
    await fetchApi("/inventory/stock", {
      method: "POST",
      body: JSON.stringify({
        variantId,
        delta: -quantity,
        location: "WAREHOUSE",
        reason: "ADJUSTMENT",
        note: "Перевод в зал",
      }),
    });
  } catch (err: unknown) {
    return { status: "failed", message: reason(err, "") };
  }

  try {
    await fetchApi("/inventory/stock", {
      method: "POST",
      body: JSON.stringify({
        variantId,
        delta: quantity,
        location: "STORE",
        reason: "ADJUSTMENT",
        note: "Перевод со склада",
      }),
    });
  } catch (err: unknown) {
    return { status: "stuck", message: reason(err, "") };
  }

  return { status: "done" };
}

/** Приём поставки — единственная операция, где остаток растёт из ниоткуда. */
export async function receiveStock(
  variantId: string,
  quantity: number,
): Promise<void> {
  await fetchApi("/inventory/stock", {
    method: "POST",
    body: JSON.stringify({
      variantId,
      delta: quantity,
      location: "WAREHOUSE",
      reason: "PURCHASE",
    }),
  });
}
