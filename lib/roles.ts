/**
 * Роли интерфейса.
 *
 * Бэкенд знает только две (`prisma/schema.prisma`, `enum Role`):
 * `OWNER` и `STAFF`. Интерфейсу этого мало — продавцу за кассой в час пик
 * нечего делать в отчётах, а кладовщику незачем видеть выручку.
 *
 * Поэтому уточнение роли живёт на стороне клиента, в
 * `user_metadata.appRole` пользователя Supabase. Это **не** защита:
 * метаданные пользователь при желании поменяет. Права по-настоящему
 * проверяет бэкенд; здесь мы только убираем с глаз то, что человеку
 * не нужно. Когда в бэкенде появятся настоящие роли, эта функция
 * начнёт читать их — остальной код менять не придётся.
 */

export type BackendRole = "OWNER" | "STAFF";

export type AppRole = "OWNER" | "MANAGER" | "CASHIER" | "WAREHOUSE" | "WAITER" | "KITCHEN" | "SALES" | "SPECIALIST";

const APP_ROLES: AppRole[] = [
  "OWNER",
  "MANAGER",
  "CASHIER",
  "WAREHOUSE",
  "WAITER",
  "KITCHEN",
  "SALES",
  "SPECIALIST",
];

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === "string" && (APP_ROLES as string[]).includes(value);
}

/**
 * `OWNER` с бэкенда — всегда владелец, уточнять нечего.
 *
 * `STAFF` без уточнения становится `MANAGER`, а не `CASHIER`: до этого
 * этапа любой сотрудник видел всё приложение целиком, и молча запереть
 * его в кассе значило бы сломать работу магазинам, которые уже завели
 * продавцов. Узкие роли включаются явно.
 */
export function resolveAppRole(
  backendRole: BackendRole | string | null | undefined,
  metaRole: unknown,
): AppRole {
  if (backendRole === "OWNER") return "OWNER";
  return isAppRole(metaRole) && metaRole !== "OWNER" ? metaRole : "MANAGER";
}

export type NavKey =
  | "dashboard"
  | "pos"
  | "customers"
  | "floor"
  | "warehouse"
  | "reports"
  | "staff"
  | "kitchen"
  | "tables"
  | "booking";

/**
 * Какие разделы показываем по умолчанию для каждой роли.
 */
const NAV_BY_ROLE: Record<AppRole, NavKey[]> = {
  OWNER: [
    "dashboard",
    "pos",
    "customers",
    "floor",
    "warehouse",
    "reports",
    "staff",
  ],
  MANAGER: ["dashboard", "pos", "customers", "floor", "warehouse", "reports"],
  CASHIER: ["pos", "customers"],
  WAREHOUSE: ["floor", "warehouse"],
  WAITER: ["tables", "floor"],
  KITCHEN: ["kitchen"],
  SALES: ["booking", "customers"],
  SPECIALIST: ["booking", "customers"],
};

export function navFor(role: AppRole, sphere: string, activeModules: string[] = []): NavKey[] {
  const base = NAV_BY_ROLE[role] || [];
  
  let filtered = base;

  // Если это Ресторан, заменяем POS/Склад на Столы/Кухню для владельцев
  if (sphere === "RESTAURANT") {
    if (role === "OWNER" || role === "MANAGER") {
      filtered = ["dashboard", "tables", "kitchen", "customers", "reports", "staff"];
    }
  }
  
  // Если это Услуги/Компании
  if (sphere === "COMPANY") {
    if (role === "OWNER" || role === "MANAGER") {
      filtered = ["dashboard", "booking", "customers", "reports", "staff"];
    }
  }

  // Скрываем модули, если они не куплены
  if (!activeModules.includes("REPORTS") && !activeModules.includes("reports")) {
    filtered = filtered.filter(k => k !== "reports");
  }
  if (!activeModules.includes("KITCHEN") && !activeModules.includes("kitchen")) {
    filtered = filtered.filter(k => k !== "kitchen");
  }
  if (!activeModules.includes("TABLES") && !activeModules.includes("tables")) {
    filtered = filtered.filter(k => k !== "tables");
  }
  if (!activeModules.includes("BOOKING") && !activeModules.includes("booking")) {
    filtered = filtered.filter(k => k !== "booking");
  }

  return filtered;
}

/**
 * Что попадает в нижние вкладки телефона.
 *
 * У владельца разделов семь, и семь вкладок плюс профиль — это восемь
 * целей шириной по 40px: промахнуться легче, чем попасть. В полосе
 * остаются четыре ежедневных раздела, остальные доступны из профиля,
 * куда за ними и идут — отчёты смотрят сидя, а не стоя у прилавка.
 *
 * На широком экране столб показывает всё: там места хватает.
 */
export function tabsFor(role: AppRole, sphere: string, activeModules: string[] = []): NavKey[] {
  return navFor(role, sphere, activeModules).slice(0, 4);
}

/** Разделы, которые на телефоне живут только в профиле. */
export function extraFor(role: AppRole, sphere: string, activeModules: string[] = []): NavKey[] {
  return navFor(role, sphere, activeModules).slice(4);
}

/** Куда вести человека после входа: первый доступный ему раздел. */
const HOME_BY_KEY: Record<NavKey, string> = {
  dashboard: "/dashboard",
  pos: "/pos",
  customers: "/customers",
  floor: "/floor",
  warehouse: "/warehouse",
  reports: "/reports",
  staff: "/staff",
  kitchen: "/kitchen",
  tables: "/tables",
  booking: "/booking",
};

export function homeFor(role: AppRole, sphere: string = "CLOTHING", activeModules: string[] = []): string {
  const nav = navFor(role, sphere, activeModules);
  return nav.length > 0 ? HOME_BY_KEY[nav[0]] : "/dashboard";
}

/**
 * Разделы Этапа 20 — экраны из макетов Stitch.
 *
 * Их двадцать два, и в один список с ежедневными разделами они не лезут:
 * столб превратился бы в стену из тридцати ссылок, в которой не найти
 * кассу. Поэтому они собраны в группы по смыслу и живут ниже основного
 * списка, под тихими заголовками.
 *
 * Часть экранов сюда намеренно **не** попала: акт списания открывают из
 * архива документов, согласование — из уведомления, мастер акции — из
 * лояльности, а этикетку — из карточки товара и приёмки. Дублировать их
 * в меню значит предлагать вход туда, где нечего делать без контекста.
 */
export type SectionKey =
  | "purchases"
  | "stocktake"
  | "transfer"
  | "labels"
  | "printQueue"
  | "shiftClose"
  | "expenses"
  | "suppliers"
  | "returns"
  | "shiftAnalytics"
  | "losses"
  | "loyalty"
  | "giftCards"
  | "documents"
  | "notifications"
  | "scanner"
  | "alerts";

export type SectionGroup = "goods" | "money" | "analytics" | "clients" | "docs";

type Section = {
  key: SectionKey;
  group: SectionGroup;
  href: string;
  roles: readonly AppRole[];
};

/**
 * Номера в адресах приёмки и инвентаризации — временные: списков закупок
 * и инвентаризаций ещё нет (модули 3 и 4 в `BACKEND-REQUESTS.md`).
 * Когда появятся, пункт меню будет вести на список, а не на документ.
 */
const SECTIONS: readonly Section[] = [
  {
    key: "purchases",
    group: "goods",
    href: "/purchases/842",
    roles: ["OWNER", "MANAGER", "WAREHOUSE"],
  },
  {
    key: "stocktake",
    group: "goods",
    href: "/stocktake/12",
    roles: ["OWNER", "MANAGER", "WAREHOUSE"],
  },
  {
    key: "transfer",
    group: "goods",
    href: "/transfer",
    roles: ["OWNER", "MANAGER", "WAREHOUSE"],
  },
  {
    key: "labels",
    group: "goods",
    href: "/labels",
    roles: ["OWNER", "MANAGER", "WAREHOUSE"],
  },
  {
    key: "printQueue",
    group: "goods",
    href: "/labels/queue",
    roles: ["OWNER", "MANAGER", "WAREHOUSE"],
  },

  {
    key: "shiftClose",
    group: "money",
    href: "/shifts/close",
    roles: ["OWNER", "MANAGER", "CASHIER"],
  },
  {
    key: "returns",
    group: "money",
    href: "/pos/returns",
    roles: ["OWNER", "MANAGER", "CASHIER"],
  },
  {
    key: "expenses",
    group: "money",
    href: "/expenses",
    roles: ["OWNER", "MANAGER"],
  },
  {
    key: "suppliers",
    group: "money",
    href: "/suppliers",
    roles: ["OWNER", "MANAGER"],
  },

  {
    key: "shiftAnalytics",
    group: "analytics",
    href: "/reports/shifts",
    roles: ["OWNER", "MANAGER"],
  },
  {
    key: "losses",
    group: "analytics",
    href: "/reports/losses",
    roles: ["OWNER", "MANAGER"],
  },

  {
    key: "loyalty",
    group: "clients",
    href: "/loyalty",
    roles: ["OWNER", "MANAGER"],
  },
  {
    key: "giftCards",
    group: "clients",
    href: "/gift-cards/new",
    roles: ["OWNER", "MANAGER", "CASHIER"],
  },

  {
    key: "documents",
    group: "docs",
    href: "/documents",
    roles: ["OWNER", "MANAGER"],
  },
  {
    key: "notifications",
    group: "docs",
    href: "/notifications",
    roles: ["OWNER", "MANAGER", "CASHIER", "WAREHOUSE", "WAITER", "KITCHEN", "SALES", "SPECIALIST"],
  },
  {
    key: "scanner",
    group: "docs",
    href: "/settings/scanner",
    roles: ["OWNER", "MANAGER", "CASHIER", "WAREHOUSE", "WAITER", "SALES"],
  },
  {
    key: "alerts",
    group: "docs",
    href: "/settings/alerts",
    roles: ["OWNER", "MANAGER"],
  },
];

export const SECTION_GROUPS: readonly SectionGroup[] = [
  "goods",
  "money",
  "analytics",
  "clients",
  "docs",
];

/**
 * Пункты одной группы, доступные этой роли. Пустая группа не рисуется.
 *
 * Сфера и купленные модули здесь **намеренно не учитываются**: приёмка,
 * инвентаризация, расходы и документы нужны и магазину одежды, и ресторану,
 * и салону — это общая хозяйственная часть, а не отраслевая. Разводит по
 * сферам только основное меню, `navFor`. Раньше эти два аргумента функция
 * принимала и молча игнорировала — читающий код вправе был решить, что
 * фильтрация есть.
 */
export function sectionsFor(
  role: AppRole,
  group: SectionGroup,
): { key: SectionKey; href: string }[] {
  return SECTIONS.filter(
    (section) => section.group === group && section.roles.includes(role),
  ).map(({ key, href }) => ({ key, href }));
}

/** Определяет группу на основе текущего пути для Two-Tier Sidebar */
export function groupForPath(pathname: string): "main" | SectionGroup {
  const currentSection = SECTIONS.find((s) => pathname === s.href || pathname.startsWith(`${s.href}/`));
  return currentSection ? currentSection.group : "main";
}

/**
 * Деньги, которые видит не каждый.
 *
 * `money` — выручка и чеки: их видит и управляющий, иначе он не сможет
 * работать. `profit` — чистая прибыль, закуп, маржа и зарплаты: это
 * только владельцу (требование заказчика к роли MANAGER).
 */
export function canSeeMoney(role: AppRole): boolean {
  return role === "OWNER" || role === "MANAGER";
}

export function canSeeProfit(role: AppRole): boolean {
  return role === "OWNER";
}

export function canManageStock(role: AppRole): boolean {
  return role !== "CASHIER";
}
