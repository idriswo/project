import { fetchApi } from "@/lib/apiClient";
import { mock } from "@/lib/api/mock";

/**
 * Программа лояльности (Э-18) и подарочные карты (Э-20).
 *
 * Частично живое: `GET/PATCH /loyalty/settings` в бекенде **есть** и
 * используется по-настоящему. Уровней (Bronze/Silver/Gold), агрегатов и
 * топа клиентов нет — модуль 12 в `design/BACKEND-REQUESTS.md`.
 * Подарочных карт нет совсем — модуль 11.
 */

export type LoyaltySettings = {
  /** Сколько потратить, чтобы получить один балл. */
  pointsPerAmount: number;
  /** Сколько сомони стоит один балл при списании. */
  pointValue: number;
};

// Живой запрос: этот эндпоинт существует.
export async function fetchLoyaltySettings(): Promise<LoyaltySettings | null> {
  try {
    return await fetchApi("/loyalty/settings");
  } catch {
    // Экран лояльности не должен падать целиком из-за одного запроса:
    // остальные блоки на моках и покажутся.
    return null;
  }
}

export function saveLoyaltySettings(
  settings: LoyaltySettings,
): Promise<LoyaltySettings> {
  return fetchApi("/loyalty/settings", {
    method: "PATCH",
    body: JSON.stringify(settings),
  });
}

export type LoyaltyTier = {
  id: string;
  name: string;
  minPoints: number;
  maxPoints: number | null;
  discountPercent: number;
  perks: string;
};

export type LoyaltyOverview = {
  members: number;
  pointsIssued: number;
  pointsRedeemed: number;
  revenueFromLoyal: number;
};

export type TopCustomer = {
  name: string;
  points: number;
  ltv: number;
};

export type RepeatPoint = {
  month: string;
  rate: number;
  /** В этом месяце шла акция — на графике отмечается полосой. */
  promotion: boolean;
};

// MOCK: GET /loyalty/overview
export function fetchLoyaltyOverview(): Promise<LoyaltyOverview> {
  return mock({
    members: 2500,
    pointsIssued: 1250000,
    pointsRedeemed: 850000,
    revenueFromLoyal: 54000,
  });
}

// MOCK: GET /loyalty/tiers
export function fetchLoyaltyTiers(): Promise<LoyaltyTier[]> {
  return mock([
    {
      id: "bronze",
      name: "Bronze",
      minPoints: 0,
      maxPoints: 10000,
      discountPercent: 5,
      perks: "Базовый доступ",
    },
    {
      id: "silver",
      name: "Silver",
      minPoints: 10001,
      maxPoints: 50000,
      discountPercent: 10,
      perks: "Приоритетная поддержка",
    },
    {
      id: "gold",
      name: "Gold",
      minPoints: 50001,
      maxPoints: null,
      discountPercent: 15,
      perks: "Персональный менеджер",
    },
  ]);
}

// MOCK: GET /loyalty/top-customers
export function fetchTopCustomers(): Promise<TopCustomer[]> {
  return mock([
    { name: "Алишер Н.", points: 15000, ltv: 12000 },
    { name: "Зухра Т.", points: 14200, ltv: 11500 },
    { name: "Карим С.", points: 13800, ltv: 10900 },
    { name: "Фарида О.", points: 12500, ltv: 9800 },
  ]);
}

// MOCK: GET /loyalty/repeat-rate
export function fetchRepeatRate(): Promise<RepeatPoint[]> {
  return mock([
    { month: "Янв", rate: 12, promotion: false },
    { month: "Фев", rate: 28, promotion: true },
    { month: "Мар", rate: 41, promotion: false },
    { month: "Апр", rate: 45, promotion: false },
    { month: "Май", rate: 56, promotion: true },
    { month: "Июн", rate: 72, promotion: false },
  ]);
}

/* ── Подарочные карты (Э-20) ─────────────────────────────────────── */

export type GiftCardKind = "physical" | "digital";

export type GiftCard = {
  code: string;
  kind: GiftCardKind;
  amount: number;
  expiresAt: string;
};

/**
 * Код карты.
 *
 * Генерируем на клиенте только для предпросмотра: настоящий код обязан
 * выдавать бекенд, иначе два кассира одновременно выпустят одинаковый.
 */
// MOCK: GET /gift-cards/generate-code
export function generateGiftCardCode(): string {
  const block = () => String(Math.floor(1000 + Math.random() * 8999));
  return `TIM-GC-${block()}-${block()}-${block()}`;
}

// MOCK: POST /gift-cards
export function issueGiftCard(input: {
  kind: GiftCardKind;
  amount: number;
  code: string;
  customerPhone?: string;
  expiresAt: string;
}): Promise<GiftCard> {
  return mock({
    code: input.code,
    kind: input.kind,
    amount: input.amount,
    expiresAt: input.expiresAt,
  });
}
