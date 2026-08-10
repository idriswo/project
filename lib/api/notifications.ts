import { mock } from "@/lib/api/mock";

/**
 * Уведомления (Э-15, Э-22) и пороги критических остатков (Э-16).
 *
 * Бекенда нет — модули 8 и 9 в `design/BACKEND-REQUESTS.md`. Эти два
 * модуля связаны: пороги — источник большей части уведомлений, поэтому
 * они и живут в одном файле.
 */

export type NotificationKind = "critical" | "order" | "system" | "stock";

export type AppNotification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  /** Куда ведёт действие в карточке. Без него уведомление — тупик. */
  actionHref?: string;
  actionLabel?: string;
  time: string;
  read: boolean;
};

let items: AppNotification[] = [
  {
    id: "n1",
    kind: "critical",
    title: "Списание на крупную сумму",
    body: "Списание №102 на 1 250 TJS ждёт вашего решения.",
    actionHref: "/approvals/write-off/102",
    actionLabel: "Открыть согласование",
    time: "10:30",
    read: false,
  },
  {
    id: "n2",
    kind: "stock",
    title: "Заканчивается «Джинсы Slim Fit»",
    body: "Осталось 5 штук по всем размерам. Пора заказывать.",
    actionHref: "/warehouse",
    actionLabel: "Пополнить",
    time: "09:15",
    read: false,
  },
  {
    id: "n3",
    kind: "order",
    title: "Новая крупная продажа",
    body: "Чек на 4 500 TJS, клиент Олег П.",
    actionHref: "/reports",
    actionLabel: "Посмотреть",
    time: "Вчера",
    read: true,
  },
  {
    id: "n4",
    kind: "system",
    title: "Резервная копия создана",
    body: "Ежедневная копия данных прошла без ошибок в 03:00.",
    time: "03:00",
    read: true,
  },
];

// MOCK: GET /notifications
export function fetchNotifications(): Promise<AppNotification[]> {
  return mock(items);
}

// MOCK: GET /notifications/unread-count
export function fetchUnreadCount(): Promise<number> {
  return mock(items.filter((item) => !item.read).length);
}

// MOCK: POST /notifications/:id/read
export function markRead(id: string): Promise<void> {
  items = items.map((item) =>
    item.id === id ? { ...item, read: true } : item,
  );
  return mock(undefined);
}

// MOCK: POST /notifications/read-all
export function markAllRead(): Promise<void> {
  items = items.map((item) => ({ ...item, read: true }));
  return mock(undefined);
}

// MOCK: DELETE /notifications/:id
export function dismissNotification(id: string): Promise<void> {
  items = items.filter((item) => item.id !== id);
  return mock(undefined);
}

/* ── Пороги критических остатков (Э-16) ──────────────────────────── */

export type AlertRule = {
  categoryId: string;
  categoryName: string;
  threshold: number;
};

export type AlertSettings = {
  enabled: boolean;
  channelInApp: boolean;
  channelTelegram: boolean;
  channelEmail: boolean;
  rules: AlertRule[];
  /**
   * Рекомендация по одной категории на основе продаж за месяц.
   * Считать её должен бекенд: у него есть история, у экрана — нет.
   */
  suggestion: {
    categoryName: string;
    threshold: number;
    soldLastMonth: number;
  } | null;
};

let settings: AlertSettings = {
  enabled: true,
  channelInApp: true,
  channelTelegram: true,
  channelEmail: false,
  rules: [
    { categoryId: "c1", categoryName: "Джинсы", threshold: 15 },
    { categoryId: "c2", categoryName: "Футболки", threshold: 20 },
    { categoryId: "c3", categoryName: "Платья", threshold: 10 },
    { categoryId: "c4", categoryName: "Куртки", threshold: 8 },
    { categoryId: "c5", categoryName: "Аксессуары", threshold: 30 },
  ],
  suggestion: { categoryName: "Платья", threshold: 12, soldLastMonth: 95 },
};

// MOCK: GET /alerts/settings + GET /alerts/suggestions
export function fetchAlertSettings(): Promise<AlertSettings> {
  return mock(settings);
}

// MOCK: PUT /alerts/settings
export function saveAlertSettings(next: AlertSettings): Promise<AlertSettings> {
  settings = next;
  return mock(settings);
}
