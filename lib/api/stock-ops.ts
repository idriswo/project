import { mock } from "@/lib/api/mock";

/**
 * Инвентаризация (Э-10) и перемещение склад → зал (Э-11).
 *
 * Бекенда нет — модули 4 и 5 в `design/BACKEND-REQUESTS.md`.
 *
 * Отдельно про локации: сейчас у варианта одно поле `quantity` — «сколько
 * всего». Разделения на склад и торговый зал в схеме нет, поэтому цифры
 * «3450 на складе / 1200 в зале» пока неоткуда взять. Предложение —
 * таблица `VariantStock(variantId, location, quantity)`, чтобы старый код
 * продолжал читать сумму, а новые экраны — разрез.
 */

export type StockLocation = "warehouse" | "floor";

/* ── Инвентаризация ──────────────────────────────────────────────── */

export type StocktakeRow = {
  id: string;
  name: string;
  sku: string;
  size: string;
  systemQty: number;
  countedQty: number | null;
};

export type Stocktake = {
  id: string;
  number: number;
  location: StockLocation;
  rows: StocktakeRow[];
};

const ROWS: StocktakeRow[] = [
  {
    id: "r1",
    name: "Куртка мужская зимняя",
    sku: "SKU-458201",
    size: "L",
    systemQty: 45,
    countedQty: 44,
  },
  {
    id: "r2",
    name: "Джинсы женские",
    sku: "SKU-129384",
    size: "M",
    systemQty: 28,
    countedQty: 30,
  },
  {
    id: "r3",
    name: "Футболка базовая",
    sku: "SKU-502918",
    size: "S",
    systemQty: 112,
    countedQty: 112,
  },
  {
    id: "r4",
    name: "Футболка базовая",
    sku: "SKU-502919",
    size: "M",
    systemQty: 96,
    countedQty: null,
  },
  {
    id: "r5",
    name: "Кроссовки беговые",
    sku: "SKU-938271",
    size: "42",
    systemQty: 15,
    countedQty: 12,
  },
  {
    id: "r6",
    name: "Кроссовки беговые",
    sku: "SKU-938272",
    size: "43",
    systemQty: 15,
    countedQty: 15,
  },
  {
    id: "r7",
    name: "Платье вечернее",
    sku: "SKU-771002",
    size: "M",
    systemQty: 8,
    countedQty: null,
  },
  {
    id: "r8",
    name: "Рубашка оверсайз",
    sku: "SKU-330145",
    size: "L",
    systemQty: 22,
    countedQty: 24,
  },
];

// MOCK: GET /stocktakes/:id
export function fetchStocktake(
  id: string,
  location: StockLocation,
): Promise<Stocktake> {
  return mock({ id, number: 12, location, rows: ROWS });
}

// MOCK: PATCH /stocktakes/:id/items
export function saveStocktakeCounts(input: {
  id: string;
  items: { id: string; countedQty: number | null }[];
}): Promise<{ saved: number }> {
  return mock({ saved: input.items.length });
}

// MOCK: POST /stocktakes/:id/complete
export function completeStocktake(
  id: string,
): Promise<{ id: string; adjusted: number }> {
  // Настоящий эндпоинт проведёт `StockReason.ADJUSTMENT` по каждой строке
  // с расхождением и закроет инвентаризацию. Сколько строк он поправил —
  // единственное, что нужно знать экрану.
  return mock({ id, adjusted: 0 });
}

/* ── Перемещение ─────────────────────────────────────────────────── */

export type TransferSize = {
  size: string;
  available: number;
};

export type TransferProduct = {
  id: string;
  name: string;
  sku: string;
  sizes: TransferSize[];
};

export type LocationSummary = {
  warehouse: number;
  floor: number;
};

// MOCK: GET /stock/location-summary
export function fetchLocationSummary(): Promise<LocationSummary> {
  return mock({ warehouse: 3450, floor: 1200 });
}

// MOCK: GET /stock/by-location
export function fetchTransferCatalog(): Promise<TransferProduct[]> {
  return mock([
    {
      id: "p1",
      name: "Футболка хлопковая, синяя",
      sku: "SKU-CTB-001",
      sizes: [
        { size: "S", available: 10 },
        { size: "M", available: 25 },
        { size: "L", available: 18 },
        { size: "XL", available: 5 },
      ],
    },
    {
      id: "p2",
      name: "Джинсы Slim Fit",
      sku: "SKU-DJSF-023",
      sizes: [
        { size: "30W", available: 8 },
        { size: "32W", available: 15 },
        { size: "34W", available: 12 },
        { size: "36W", available: 4 },
      ],
    },
    {
      id: "p3",
      name: "Худи серое",
      sku: "SKU-HSG-110",
      sizes: [
        { size: "S", available: 12 },
        { size: "M", available: 20 },
        { size: "L", available: 15 },
        { size: "XL", available: 8 },
      ],
    },
  ]);
}

// MOCK: POST /transfers
export function createTransfer(input: {
  from: StockLocation;
  to: StockLocation;
  items: { productId: string; size: string; quantity: number }[];
}): Promise<{ movedUnits: number }> {
  return mock({
    movedUnits: input.items.reduce((sum, item) => sum + item.quantity, 0),
  });
}
