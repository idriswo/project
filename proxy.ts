import createMiddleware from "next-intl/middleware";

import { routing } from "./i18n/routing";

/**
 * Начиная с Next.js 16 middleware называется proxy — файл обязан
 * лежать в корне и называться proxy.ts. Функциональность прежняя.
 * Здесь определяется локаль запроса и ставится редирект на /<locale>/...
 */
export default createMiddleware(routing);

export const config = {
  // Пропускаем статику, служебные пути Next и любые файлы с расширением.
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
