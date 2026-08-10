import { mock } from "@/lib/api/mock";

/**
 * Поставщики и взаиморасчёты (Э-08), приёмка закупки (Э-09).
 *
 * Бекенда нет — модуль 3 в `design/BACKEND-REQUESTS.md`. В схеме Prisma
 * поставщика нет вообще: приход товара сейчас пишется движением
 * `StockReason.PURCHASE` без указания, у кого куплено и сколько должны.
 */

export type Supplier = {
  id: string;
  name: string;
  /** Минус — мы должны, плюс — переплатили. */
  balance: number;
  lastShipment: string;
};

export type SuppliersSummary = {
  totalDebt: number;
  dueThisWeek: number;
  lastPayment: { date: string; amount: number } | null;
};

export type SupplierInvoice = {
  id: string;
  number: number;
  date: string;
  amount: number;
};

let suppliers: Supplier[] = [
  { id: "s1", name: "Moda Optom", balance: -5000, lastShipment: "2026-08-01" },
  { id: "s2", name: "Tex-Style", balance: 1500, lastShipment: "2026-08-04" },
  { id: "s3", name: "Trendline", balance: -2000, lastShipment: "2026-08-06" },
];

// MOCK: GET /suppliers
export function fetchSuppliers(): Promise<Supplier[]> {
  return mock(suppliers);
}

// MOCK: GET /suppliers/summary
export function fetchSuppliersSummary(): Promise<SuppliersSummary> {
  const totalDebt = suppliers
    .filter((item) => item.balance < 0)
    .reduce((sum, item) => sum + Math.abs(item.balance), 0);

  return mock({
    totalDebt,
    dueThisWeek: 4500,
    lastPayment: { date: "2026-08-07", amount: 3000 },
  });
}

// MOCK: GET /suppliers/:id/purchases
export function fetchSupplierInvoices(id: string): Promise<SupplierInvoice[]> {
  const all: Record<string, SupplierInvoice[]> = {
    s1: [
      { id: "p105", number: 105, date: "2026-08-01", amount: 5000 },
      { id: "p102", number: 102, date: "2026-07-28", amount: 2000 },
      { id: "p103", number: 103, date: "2026-07-30", amount: 2000 },
    ],
    s2: [{ id: "p110", number: 110, date: "2026-08-04", amount: 1500 }],
    s3: [{ id: "p112", number: 112, date: "2026-08-06", amount: 2000 }],
  };
  return mock(all[id] ?? []);
}

// MOCK: POST /suppliers/:id/payments
export function paySupplier(input: {
  supplierId: string;
  amount: number;
  method: "transfer" | "cash";
  invoiceIds: string[];
}): Promise<Supplier | null> {
  suppliers = suppliers.map((item) =>
    item.id === input.supplierId
      ? { ...item, balance: item.balance + input.amount }
      : item,
  );
  return mock(suppliers.find((item) => item.id === input.supplierId) ?? null);
}

/* ── Приёмка (Э-09) ──────────────────────────────────────────────── */

export type PurchaseItem = {
  id: string;
  name: string;
  size: string;
  expectedQty: number;
  receivedQty: number;
  unitCost: number;
};

export type PurchaseOrder = {
  id: string;
  number: number;
  supplierName: string;
  date: string;
  items: PurchaseItem[];
};

// MOCK: GET /purchases/:id
export function fetchPurchase(id: string): Promise<PurchaseOrder> {
  return mock({
    id,
    number: 842,
    supplierName: "Moda Optom",
    date: "2026-08-09",
    items: [
      {
        id: "i1",
        name: 'Футболка базовая "Classic Cotton"',
        size: "S",
        expectedQty: 50,
        receivedQty: 50,
        unitCost: 50,
      },
      {
        id: "i2",
        name: 'Джинсы прямые "Urban Denim"',
        size: "M",
        expectedQty: 30,
        receivedQty: 30,
        unitCost: 220,
      },
      {
        id: "i3",
        name: 'Платье летнее "Floral Breeze"',
        size: "L",
        expectedQty: 20,
        receivedQty: 18,
        unitCost: 180,
      },
      {
        id: "i4",
        name: 'Куртка кожаная "Biker Style"',
        size: "XL",
        expectedQty: 10,
        receivedQty: 10,
        unitCost: 550,
      },
      {
        id: "i5",
        name: 'Рубашка оверсайз "Linen Touch"',
        size: "S",
        expectedQty: 40,
        receivedQty: 42,
        unitCost: 120,
      },
      {
        id: "i6",
        name: 'Брюки карго "Utility Wear"',
        size: "M",
        expectedQty: 60,
        receivedQty: 60,
        unitCost: 150,
      },
      {
        id: "i7",
        name: 'Свитшот "Comfort Zone"',
        size: "L",
        expectedQty: 25,
        receivedQty: 25,
        unitCost: 160,
      },
      {
        id: "i8",
        name: 'Шорты джинсовые "Summer Vibes"',
        size: "S",
        expectedQty: 15,
        receivedQty: 15,
        unitCost: 110,
      },
    ],
  });
}

// MOCK: POST /purchases/:id/receive
export function receivePurchase(input: {
  id: string;
  items: { id: string; receivedQty: number }[];
}): Promise<{ receivedUnits: number }> {
  // Настоящий эндпоинт в одной транзакции запишет фактические количества,
  // создаст движения `StockReason.PURCHASE` и закроет закупку. Здесь
  // возвращаем то же, что вернёт он, — сколько единиц приняли.
  return mock({
    receivedUnits: input.items.reduce((sum, item) => sum + item.receivedQty, 0),
  });
}
