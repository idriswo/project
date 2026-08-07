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

export type AppRole = "OWNER" | "MANAGER" | "CASHIER" | "SKLADCHI";

const APP_ROLES: AppRole[] = ["OWNER", "MANAGER", "CASHIER", "SKLADCHI"];

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
  | "staff";

/**
 * Какие разделы показываем. Порядок здесь же: он задаёт и боковое меню
 * на вебе, и нижние вкладки на телефоне — два списка разошлись бы.
 *
 * «Клиенты» стоят сразу после кассы: продавец открывает их в тот же
 * момент работы — записать долг или начислить бонусы по только что
 * пробитому чеку.
 *
 * У кладовщика этого раздела нет: он не работает ни с долгами, ни с
 * бонусами, и чужие телефоны ему видеть незачем.
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
  SKLADCHI: ["floor", "warehouse"],
};

export function navFor(role: AppRole): NavKey[] {
  return NAV_BY_ROLE[role];
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
export function tabsFor(role: AppRole): NavKey[] {
  return navFor(role).slice(0, 4);
}

/** Разделы, которые на телефоне живут только в профиле. */
export function extraFor(role: AppRole): NavKey[] {
  return navFor(role).slice(4);
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
};

export function homeFor(role: AppRole): string {
  return HOME_BY_KEY[navFor(role)[0]];
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
