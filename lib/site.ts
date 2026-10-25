/**
 * Общие данные сайта.
 *
 * ⚠️ Контакты — заглушки из макета. Реальные значения ждём от заказчика
 * (блокер Б-8 в ROADMAP.md). Именно поэтому они НЕ попадают в JSON-LD:
 * опубликовать вымышленный телефон компании в поиске хуже, чем не указать
 * контакты вовсе (ROADMAP 5.11).
 */
export const site = {
  email: "hello@tim.app",
  phone: "+998 00 000 00 00",
  phoneHref: "+998000000000",
  telegram: "#",
} as const;

/**
 * Базовый адрес сайта — основа для canonical, sitemap и Open Graph.
 *
 * Домена пока нет (Б-6), поэтому здесь заглушка из `.env.example`. Пока
 * переменная не заполнена настоящим адресом, ссылки указывают в никуда:
 * для разработки это неважно, до публикации — обязано быть исправлено.
 *
 * Хвостовой слэш срезается, иначе canonical выходит вида `https://x.com//ru`.
 */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://example.com"
).replace(/\/+$/, "");

/** Абсолютный адрес пути. `/` даёт корень без пустого хвоста. */
export function absoluteUrl(path: string): string {
  if (!path || path === "/") return siteUrl;
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Открыт ли вход в приложение. Пока бэкенд не поднят, кнопки входа и
 * регистрации показывают «Скоро», а любой раздел приложения уводит на
 * главную (`proxy.ts`): человек из поиска не должен видеть ошибку сервера.
 *
 * Включается переменной `NEXT_PUBLIC_APP_OPEN=true` на этапе сборки,
 * без правки кода.
 */
export const appOpen = process.env.NEXT_PUBLIC_APP_OPEN === "true";

/**
 * Разделы приложения. Ни один не должен попасть в поиск: это личный
 * кабинет, снаружи он всё равно покажет форму входа.
 *
 * Список нужен в двух местах сразу — в `robots.ts` и в `sitemap.ts`, —
 * поэтому живёт здесь, а не дублируется.
 */
export const privatePaths = [
  "/auth",
  "/onboarding",
  "/stores",
  "/dashboard",
  "/pos",
  "/floor",
  "/warehouse",
  "/inventory",
  "/settings",
] as const;

/** Якоря секций — совпадают с макетом. */
export const anchors = {
  top: "#top",
  features: "#features",
  industries: "#industries",
  pricing: "#pricing",
  footer: "#footer",
} as const;
