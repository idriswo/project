import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  images: {
    // ТЗ п. 4.3 — современные форматы изображений
    formats: ["image/avif", "image/webp"],
  },
};

export default withNextIntl(nextConfig);
