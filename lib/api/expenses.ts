import { mock } from "@/lib/api/mock";

/**
 * Расходы из кассы (Э-07).
 *
 * Бекенда нет — модуль 2 в `design/BACKEND-REQUESTS.md`. Пока расходов
 * нет в базе, чистая прибыль на дашборде считается без них: об этом
 * стоит помнить, глядя на её величину.
 */

export const EXPENSE_CATEGORIES = [
  "supplies",
  "rent",
  "food",
  "transport",
  "salary",
  "other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export type Expense = {
  id: string;
  date: string;
  category: ExpenseCategory;
  amount: number;
  comment: string;
  /** Тип вложенного чека — по нему рисуется иконка. */
  receipt: "image" | "pdf" | null;
};

export type ExpensesSummary = {
  cashBalance: number;
  todayTotal: number;
  pendingReceipts: number;
};

let items: Expense[] = [
  {
    id: "1",
    date: "2026-08-09",
    category: "supplies",
    amount: 200,
    comment: "Офисная бумага",
    receipt: "image",
  },
  {
    id: "2",
    date: "2026-08-08",
    category: "rent",
    amount: 10000,
    comment: "Оплата за август",
    receipt: "pdf",
  },
  {
    id: "3",
    date: "2026-08-07",
    category: "food",
    amount: 500,
    comment: "Обед для сотрудников",
    receipt: "image",
  },
  {
    id: "4",
    date: "2026-08-06",
    category: "transport",
    amount: 100,
    comment: "Доставка товара",
    receipt: null,
  },
  {
    id: "5",
    date: "2026-08-05",
    category: "supplies",
    amount: 200,
    comment: "Пакеты и бирки",
    receipt: "pdf",
  },
  {
    id: "6",
    date: "2026-08-04",
    category: "salary",
    amount: 1500,
    comment: "Аванс, Елена П.",
    receipt: null,
  },
];

// MOCK: GET /expenses
export function fetchExpenses(): Promise<Expense[]> {
  return mock(items);
}

// MOCK: GET /expenses/summary
export function fetchExpensesSummary(): Promise<ExpensesSummary> {
  const today = items
    .filter((item) => item.date === "2026-08-09")
    .reduce((sum, item) => sum + item.amount, 0);

  return mock({
    cashBalance: 35450,
    todayTotal: today,
    pendingReceipts: items.filter((item) => item.receipt === null).length,
  });
}

// MOCK: POST /expenses
export function createExpense(input: {
  category: ExpenseCategory;
  amount: number;
  comment: string;
  receipt: "image" | "pdf" | null;
}): Promise<Expense> {
  const expense: Expense = {
    id: String(Date.now()),
    date: new Date().toISOString().slice(0, 10),
    ...input,
  };
  items = [expense, ...items];
  return mock(expense);
}
