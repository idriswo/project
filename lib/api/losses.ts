import { mock } from "@/lib/api/mock";

/**
 * Отчёт о потерях (Э-17).
 *
 * Бекенда нет — модуль 14 в `design/BACKEND-REQUESTS.md`. Считать
 * потери сейчас не из чего: причина списания нигде не хранится, а без
 * неё «недостача» и «брак» неразличимы, хотя решения по ним разные —
 * одна про людей, другой про поставщика.
 */

export type LossTrend = "up" | "down" | "flat";

export type LossReasonRow = {
  reason: string;
  amount: number;
  share: number;
  trend: LossTrend;
};

export type LossItemRow = {
  name: string;
  sku: string;
  diffQty: number;
  diffAmount: number;
};

export type LossesReport = {
  totalAmount: number;
  percentOfRevenue: number;
  deltaPercent: number;
  topCategory: { name: string; units: number };
  byDay: { date: string; amount: number; spike: boolean }[];
  reasons: LossReasonRow[];
  items: LossItemRow[];
};

// MOCK: GET /reports/losses + /losses-by-day + /loss-reasons + /loss-items
export function fetchLosses(): Promise<LossesReport> {
  const byDay = [
    { date: "2026-08-01", amount: 1200, spike: false },
    { date: "2026-08-02", amount: 800, spike: false },
    { date: "2026-08-03", amount: 4300, spike: true },
    { date: "2026-08-04", amount: 900, spike: false },
    { date: "2026-08-05", amount: 1500, spike: false },
    { date: "2026-08-06", amount: 2600, spike: true },
    { date: "2026-08-07", amount: 700, spike: false },
    { date: "2026-08-08", amount: 6100, spike: true },
    { date: "2026-08-09", amount: 1100, spike: false },
  ];

  return mock({
    totalAmount: 12500,
    percentOfRevenue: 1.8,
    deltaPercent: 0.3,
    topCategory: { name: "Джинсы", units: 154 },
    byDay,
    reasons: [
      { reason: "shortage", amount: 8500, share: 68, trend: "up" },
      { reason: "defect", amount: 2500, share: 20, trend: "down" },
      { reason: "markdown", amount: 1500, share: 12, trend: "flat" },
    ],
    items: [
      {
        name: "Джинсы Slim Fit, синие",
        sku: "SKU-12345",
        diffQty: -45,
        diffAmount: -2250,
      },
      {
        name: "Футболка базовая, белая",
        sku: "SKU-67890",
        diffQty: -30,
        diffAmount: -360,
      },
      {
        name: "Куртка кожаная, чёрная",
        sku: "SKU-54321",
        diffQty: -12,
        diffAmount: -1200,
      },
    ],
  });
}
