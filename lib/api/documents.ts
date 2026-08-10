import { mock } from "@/lib/api/mock";

/**
 * Списания и архив документов (Э-12, Э-13, Э-14).
 *
 * Бекенда нет — модули 6 и 13 в `design/BACKEND-REQUESTS.md`.
 *
 * Сейчас в базе есть только `StockReason.WRITE_OFF` — движение остатка
 * без документа. То есть видно, что десять вещей исчезли, но не видно,
 * кто их списал, по какой причине и кто это утвердил. Акт списания —
 * как раз про это.
 */

export type WriteOffStatus = "draft" | "pending" | "approved" | "rejected";

export type WriteOffReason =
  | "defect"
  | "damageTransport"
  | "expired"
  | "customerReturn"
  | "shortage"
  | "markdown"
  | "other";

export type WriteOffItem = {
  id: string;
  sku: string;
  name: string;
  size: string;
  quantity: number;
  unitCost: number;
  reason: WriteOffReason;
  /** Кто списывает — в акте это отдельная строка ответственности. */
  employee: string;
};

export type WriteOff = {
  id: string;
  number: number;
  status: WriteOffStatus;
  date: string;
  location: string;
  responsible: string;
  storeName: string;
  storeAddress: string;
  taxId: string;
  items: WriteOffItem[];
};

const ACT: WriteOff = {
  id: "102",
  number: 102,
  status: "pending",
  date: "2026-08-09",
  location: "Основной склад",
  responsible: "Аниса И.",
  storeName: 'Магазин "Модный стиль"',
  storeAddress: "г. Душанбе, ул. Рудаки 45",
  taxId: "7701234567",
  items: [
    {
      id: "w1",
      sku: "4607000001234",
      name: "Футболка базовая, белая",
      size: "M",
      quantity: 5,
      unitCost: 50,
      reason: "defect",
      employee: "Аниса",
    },
    {
      id: "w2",
      sku: "4607000005678",
      name: "Джинсы прямые, синие",
      size: "L",
      quantity: 2,
      unitCost: 180,
      reason: "damageTransport",
      employee: "Саид",
    },
    {
      id: "w3",
      sku: "4607000009012",
      name: "Куртка демисезонная",
      size: "S",
      quantity: 1,
      unitCost: 450,
      reason: "customerReturn",
      employee: "Аниса",
    },
    {
      id: "w4",
      sku: "4607000002345",
      name: "Носки спортивные, комплект 3 пары",
      size: "One Size",
      quantity: 10,
      unitCost: 25,
      reason: "expired",
      employee: "Саид",
    },
  ],
};

// MOCK: GET /write-offs/:id
export function fetchWriteOff(id: string): Promise<WriteOff> {
  return mock({ ...ACT, id, number: Number(id) || ACT.number });
}

// MOCK: POST /write-offs/:id/approve
export function approveWriteOff(input: {
  id: string;
  managerNote?: string;
}): Promise<{ status: WriteOffStatus }> {
  void input;
  return mock({ status: "approved" as const });
}

// MOCK: POST /write-offs/:id/reject
export function rejectWriteOff(input: {
  id: string;
  managerNote: string;
}): Promise<{ status: WriteOffStatus }> {
  void input;
  return mock({ status: "rejected" as const });
}

/* ── Архив документов (Э-14) ─────────────────────────────────────── */

export type DocumentType =
  "writeOff" | "purchase" | "zReport" | "transfer" | "return";

export type ArchiveRow = {
  id: string;
  type: DocumentType;
  number: number;
  createdAt: string;
  responsible: string;
  /** Минус — деньги ушли, плюс — пришли. */
  amount: number;
  status: "approved" | "pending" | "rejected";
};

// MOCK: GET /documents
export function fetchDocuments(): Promise<ArchiveRow[]> {
  return mock([
    {
      id: "102",
      type: "writeOff",
      number: 102,
      createdAt: "2026-08-09 14:30",
      responsible: "Аниса И.",
      amount: -1250,
      status: "approved",
    },
    {
      id: "103",
      type: "purchase",
      number: 103,
      createdAt: "2026-08-08 10:15",
      responsible: "Сергей К.",
      amount: 4500,
      status: "pending",
    },
    {
      id: "104",
      type: "zReport",
      number: 104,
      createdAt: "2026-08-07 23:55",
      responsible: "Аниса И.",
      amount: 12500,
      status: "approved",
    },
    {
      id: "105",
      type: "transfer",
      number: 105,
      createdAt: "2026-08-06 11:00",
      responsible: "Елена М.",
      amount: -320,
      status: "approved",
    },
    {
      id: "106",
      type: "return",
      number: 106,
      createdAt: "2026-08-05 17:40",
      responsible: "Иван П.",
      amount: -480,
      status: "approved",
    },
    {
      id: "107",
      type: "writeOff",
      number: 107,
      createdAt: "2026-08-04 09:20",
      responsible: "Саид Р.",
      amount: -900,
      status: "rejected",
    },
  ]);
}
