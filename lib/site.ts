/**
 * Общие данные сайта.
 *
 * ⚠️ Контакты — заглушки из макета. Реальные значения ждём от заказчика
 * (блокер Б-8 в ROADMAP.md).
 */
export const site = {
  email: "hello@tim.app",
  phone: "+998 00 000 00 00",
  phoneHref: "+998000000000",
  telegram: "#",
} as const;

/** Якоря секций — совпадают с макетом. */
export const anchors = {
  top: "#top",
  features: "#features",
  industries: "#industries",
  pricing: "#pricing",
  footer: "#footer",
} as const;
