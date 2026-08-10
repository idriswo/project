import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  /**
   * Сборка для контейнера: Next кладёт в `.next/standalone` сервер вместе
   * с теми модулями, которые ему реально нужны, — вместо всего
   * `node_modules` на 570 МБ.
   *
   * Без этого образ для Cloud Run весит под гигабайт и собирается минуты.
   * Со standalone — десятки мегабайт.
   */
  output: "standalone",

  images: {
    // ТЗ п. 4.3 — современные форматы изображений
    formats: ["image/avif", "image/webp"],
  },
};

export default withNextIntl(nextConfig);
