"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/cn";

/**
 * Штрихкод и QR-код.
 *
 * Рисуем в SVG, а не в canvas: этикетку печатают, и на 203 dpi растровая
 * картинка со штрихами шириной в полпикселя даёт нечитаемый сканером код.
 * Вектор печатается ровно тем, чем его напечатает принтер.
 *
 * `bwip-js` подключается динамически: библиотека большая, а нужна она
 * только на двух экранах из двадцати — держать её в общем бандле кассы
 * незачем.
 */

type Kind = "code128" | "qrcode";

export function CodeImage({
  value,
  kind,
  className,
  /** Показывать цифры под штрихами. У QR подписи не бывает. */
  showText = true,
}: {
  value: string;
  kind: Kind;
  className?: string;
  showText?: boolean;
}) {
  /**
   * Результат хранится вместе с тем, для чего он посчитан. Иначе при
   * смене товара на экране на мгновение оставался бы штрихкод прошлого —
   * а его успевают отсканировать.
   */
  const [result, setResult] = useState<{
    value: string;
    kind: Kind;
    svg: string | null;
  } | null>(null);

  const empty = !value.trim();
  const current =
    result?.value === value && result.kind === kind ? result : null;
  // Пустое значение — не ошибка загрузки, а отсутствие штрихкода у
  // варианта: считать нечего, показываем прочерк сразу, без похода в
  // библиотеку.
  const failed = empty || (current !== null && current.svg === null);

  useEffect(() => {
    if (empty) return;
    let alive = true;

    import("bwip-js/browser")
      .then((bwip) => {
        if (!alive) return;
        const markup = bwip.toSVG({
          bcid: kind,
          text: value,
          // Высота в мм — bwip считает в тех же единицах, что и принтер.
          height: kind === "qrcode" ? 12 : 10,
          includetext: kind === "code128" && showText,
          textxalign: "center",
          textsize: 8,
          // Поля нужны сканеру: без «тихой зоны» слева и справа код
          // не читается, даже если штрихи напечатаны идеально.
          paddingwidth: 2,
          paddingheight: 1,
        });
        setResult({ value, kind, svg: markup });
      })
      .catch(() => {
        // Нечитаемое значение (буквы в EAN, пустая строка) — не повод
        // ронять экран печати: показываем сам код текстом.
        if (alive) setResult({ value, kind, svg: null });
      });

    return () => {
      alive = false;
    };
  }, [value, kind, showText, empty]);

  if (failed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-md bg-app-panel px-3 py-4",
          "text-[11px] font-semibold text-app-dim-2",
          className,
        )}
      >
        {value.trim() ? value : "—"}
      </div>
    );
  }

  if (!current?.svg) {
    return (
      <div
        aria-hidden
        className={cn(
          "rounded-md bg-app-track motion-safe:animate-app-shimmer",
          kind === "qrcode" ? "aspect-square w-24" : "h-14 w-full",
          className,
        )}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={value}
      className={cn("[&>svg]:h-full [&>svg]:w-full", className)}
      // Разметка приходит из bwip-js: это сгенерированный по нашему же
      // значению SVG, внешних данных в нём нет.
      dangerouslySetInnerHTML={{ __html: current.svg }}
    />
  );
}
