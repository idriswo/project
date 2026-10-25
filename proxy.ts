import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";

import { routing } from "./i18n/routing";
import { appOpen } from "./lib/site";

/**
 * Начиная с Next.js 16 middleware называется proxy — файл обязан
 * лежать в корне и называться proxy.ts. Функциональность прежняя.
 * Здесь определяется локаль запроса и ставится редирект на /<locale>/...
 */
const handleLocale = createMiddleware(routing);

/**
 * Пока приложение закрыто (`appOpen`), открыта только главная и её
 * OG-картинка. Любой раздел приложения ходил бы в неработающий бэкенд,
 * поэтому уводим на главную той же локали. Редирект временный (307):
 * поисковик не должен запомнить его навсегда.
 */
function isPublicWhileClosed(pathname: string): boolean {
  const [first = "", second = "", ...rest] = pathname
    .split("/")
    .filter(Boolean);

  if (!first) return true;
  if (!(routing.locales as readonly string[]).includes(first)) return false;
  if (!second) return true;
  return rest.length === 0 && second.startsWith("opengraph-image");
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!appOpen && !isPublicWhileClosed(pathname)) {
    const first = pathname.split("/").filter(Boolean)[0] ?? "";
    const locale = (routing.locales as readonly string[]).includes(first)
      ? first
      : routing.defaultLocale;

    const url = request.nextUrl.clone();
    url.pathname = `/${locale}`;
    url.search = "";
    return NextResponse.redirect(url, 307);
  }

  return handleLocale(request);
}

export const config = {
  // Пропускаем статику, служебные пути Next и любые файлы с расширением.
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
