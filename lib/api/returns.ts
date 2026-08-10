import { mock } from "@/lib/api/mock";

/**
 * Возвраты и обмен (Э-21).
 *
 * Бекенда нет — модуль 7 в `design/BACKEND-REQUESTS.md`.
 *
 * Отдельная проблема: кассир вводит **номер чека с бумажки**, а у
 * `Sale` есть только UUID. Значит нужен человекочитаемый
 * `receiptNumber` и поиск `GET /sales/lookup?receipt=…` — иначе
 * возврат оформить физически нечем.
 */

export type ReturnReason = "wrongSize" | "defect" | "changedMind" | "other";

export type ReceiptLine = {
  id: string;
  name: string;
  size: string;
  color: string;
  price: number;
  discountPercent: number;
};

export type Receipt = {
  id: string;
  number: string;
  date: string;
  cashier: string;
  lines: ReceiptLine[];
};

// MOCK: GET /sales/lookup?receipt= | ?phone=
export function lookupReceipt(query: string): Promise<Receipt | null> {
  if (query.trim().length < 3) return mock(null);

  return mock({
    id: "sale-1",
    number: query.trim().toUpperCase(),
    date: "2026-08-08",
    cashier: "Иван Петров",
    lines: [
      {
        id: "l1",
        name: "Футболка хлопковая",
        size: "M",
        color: "Белый",
        price: 150,
        discountPercent: 10,
      },
      {
        id: "l2",
        name: "Джинсы прямые",
        size: "32",
        color: "Синий",
        price: 350,
        discountPercent: 0,
      },
      {
        id: "l3",
        name: "Куртка демисезонная",
        size: "L",
        color: "Чёрный",
        price: 600,
        discountPercent: 0,
      },
    ],
  });
}

// MOCK: POST /returns
export function createReturn(input: {
  saleId: string;
  items: { lineId: string; reason: ReturnReason }[];
  amount: number;
}): Promise<{ refunded: number }> {
  return mock({ refunded: input.amount });
}
