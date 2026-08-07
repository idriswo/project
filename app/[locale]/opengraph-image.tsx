import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";

import { routing, type Locale } from "@/i18n/routing";

/**
 * Картинка для соцсетей — рисуется на лету, файла в репозитории нет.
 *
 * Это тот же продукт, что и на странице: глубокая синь, размерная кривая,
 * золото на пустом ходовом размере. Ссылка в мессенджере разворачивается в
 * то же, что человек увидит, открыв сайт.
 *
 * Ограничения `next/og`: только flexbox, из шрифтов — системные. Поэтому
 * здесь простая раскладка на margin, без grid и без Manrope.
 */

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "TIM";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/** Столбцы кривой: высота в пикселях и признак «ходовой размер пуст». */
const BARS = [
  { h: 74, alert: false },
  { h: 0, alert: true },
  { h: 30, alert: true },
  { h: 150, alert: false },
  { h: 186, alert: false },
];

export default async function Image({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "hero" });

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#000926",
        padding: 72,
        color: "#ffffff",
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 26,
          fontWeight: 800,
          letterSpacing: 6,
          color: "#ffffff",
        }}
      >
        TIM
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            fontSize: 62,
            fontWeight: 800,
            lineHeight: 1.08,
            letterSpacing: -2,
            maxWidth: 820,
          }}
        >
          {t("title")}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 24,
            fontSize: 27,
            lineHeight: 1.4,
            color: "#8290ad",
            maxWidth: 720,
          }}
        >
          {t("trust.fastStart")} · {t("trust.noCard")}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end" }}>
        {BARS.map((bar, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              width: 54,
              height: 200,
              marginRight: 12,
              borderRadius: 8,
              background: "rgba(255,255,255,0.05)",
              alignItems: "flex-end",
            }}
          >
            <div
              style={{
                display: "flex",
                width: "100%",
                height: bar.h,
                borderRadius: 8,
                background: bar.alert ? "#f2a623" : "#0f52ba",
              }}
            />
          </div>
        ))}
      </div>
    </div>,
    size,
  );
}
