import { mock } from "@/lib/api/mock";

/**
 * Смены кассы (Э-05, Э-06).
 *
 * Бекенда нет — модуль 1 и модуль 15 в `design/BACKEND-REQUESTS.md`.
 * Без смен нельзя посчитать ни выручку за смену, ни сверку кассы: у
 * `Sale` нет привязки к смене, поэтому «за смену» пока неоткуда взять.
 */

export type ShiftCategoryRow = {
  name: string;
  sales: number;
  /** Ставки НДС в схеме нет. `null` = колонку не показываем. */
  vat: number | null;
  total: number;
};

export type ShiftSummary = {
  id: string;
  number: number;
  status: "open" | "closed";
  openedBy: string;
  revenue: number;
  cash: number;
  card: number;
  transfer: number;
  returns: number;
  expenses: number;
  openingCash: number;
  /** Сколько должно лежать в ящике по данным системы. */
  expectedCash: number;
  salesCount: number;
  byCategory: ShiftCategoryRow[];
};

// MOCK: GET /shifts/current + GET /shifts/:id/summary
export function fetchCurrentShift(): Promise<ShiftSummary> {
  return mock({
    id: "shift-842",
    number: 842,
    status: "open",
    openedBy: "Иван Петров",
    revenue: 12456,
    cash: 5432,
    card: 7024,
    transfer: 0,
    returns: -123,
    expenses: 200,
    openingCash: 500,
    expectedCash: 5609,
    salesCount: 45,
    byCategory: [
      { name: "Одежда", sales: 8500, vat: null, total: 8500 },
      { name: "Обувь", sales: 3956, vat: null, total: 3956 },
      { name: "Аксессуары", sales: 123, vat: null, total: 123 },
    ],
  });
}

// MOCK: POST /shifts/:id/close
export function closeShift(input: {
  id: string;
  countedCash: number;
  note?: string;
}): Promise<{ difference: number }> {
  return mock({ difference: input.countedCash - 5609 });
}

export type ShiftDay = {
  date: string;
  revenue: number;
  avgCheck: number;
};

export type StaffRankRow = {
  name: string;
  shift: string;
  revenue: number;
  avgCheck: number;
};

export type ShiftAnalytics = {
  bestShift: { label: string; revenue: number; deltaPercent: number };
  revenuePerHour: { value: number; deltaPercent: number };
  returns: { count: number; deltaPercent: number };
  days: ShiftDay[];
  ranking: StaffRankRow[];
};

// MOCK: GET /reports/shifts + /reports/shifts-by-day + /reports/staff-ranking
export function fetchShiftAnalytics(days: 7 | 30): Promise<ShiftAnalytics> {
  const base: ShiftDay[] = [
    { date: "2026-08-03", revenue: 9800, avgCheck: 330 },
    { date: "2026-08-04", revenue: 7600, avgCheck: 318 },
    { date: "2026-08-05", revenue: 11200, avgCheck: 301 },
    { date: "2026-08-06", revenue: 9400, avgCheck: 340 },
    { date: "2026-08-07", revenue: 14520, avgCheck: 363 },
    { date: "2026-08-08", revenue: 8900, avgCheck: 260 },
    { date: "2026-08-09", revenue: 7300, avgCheck: 272 },
  ];

  return mock({
    bestShift: {
      label: "Смена №5, 7 августа",
      revenue: 14520,
      deltaPercent: 12,
    },
    revenuePerHour: { value: 1815, deltaPercent: 5 },
    returns: { count: 24, deltaPercent: -8 },
    // На 30 днях повторяем неделю: форма графика важнее выдуманных чисел.
    days: days === 7 ? base : [...base, ...base, ...base, ...base].slice(0, 30),
    ranking: [
      {
        name: "Алексей Иванов",
        shift: "Смена №5 (вечер)",
        revenue: 8712,
        avgCheck: 363,
      },
      {
        name: "Елена Петрова",
        shift: "Смена №4 (день)",
        revenue: 7650,
        avgCheck: 318,
      },
      {
        name: "Дмитрий Смирнов",
        shift: "Смена №3 (вечер)",
        revenue: 7230,
        avgCheck: 301,
      },
      {
        name: "Ольга Сидорова",
        shift: "Смена №2 (день)",
        revenue: 6890,
        avgCheck: 287,
      },
      {
        name: "Сергей Васильев",
        shift: "Смена №1 (вечер)",
        revenue: 6545,
        avgCheck: 272,
      },
    ],
  });
}
