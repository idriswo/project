"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";
import { inStore, inWarehouse, type Variant } from "@/lib/catalog";
import { compareSizes } from "@/lib/sizes";

/**
 * Ряд размеров, нарисованный формой, — подпись всего дизайна приложения.
 *
 * Этап 19: те же столбцы на светлой карточке. Форма ряда не изменилась,
 * поменялась только подложка — пустая часть столбца стала серой
 * (`app-track`) вместо белой полупрозрачной, иначе на белой карточке
 * столбца просто не было бы видно.
 *
 * В одежде первыми заканчиваются средние размеры, и с этого момента вещь
 * перестаёт продаваться. В таблице чисел этот провал приходится вычислять,
 * в форме ряда он виден сразу.
 *
 * Что означает столбец:
 * - сплошной сапфир — сколько лежит в зале;
 * - штриховка позади — запас на складе;
 * - золото — размер ходовой, а в зале его нет: иди в подсобку.
 *
 * Высоты считаются от максимума внутри ряда, а не от абсолютного числа:
 * сравнивать нужно размеры между собой, а не магазин с магазином.
 */

export interface CurveBar {
  variant: Variant;
  size: string;
  store: number;
  warehouse: number;
  /** Размер ходовой, но в зале пусто — единственный повод для золота. */
  alert: boolean;
  /** Нет ни в зале, ни на складе. */
  gone: boolean;
}

export function buildBars(
  variants: Variant[],
  popular: Set<string>,
): CurveBar[] {
  return (variants ?? [])
    .filter((variant) => variant?.size)
    .sort((a, b) => compareSizes(a.size!, b.size!))
    .map((variant) => {
      const store = inStore(variant);
      const warehouse = inWarehouse(variant);
      return {
        variant,
        size: variant.size!,
        store,
        warehouse,
        alert:
          store === 0 && warehouse > 0 && popular.has(variant.size!.trim()),
        gone: store === 0 && warehouse === 0,
      };
    });
}

/** Доля высоты в процентах от самого высокого столбца ряда. */
function share(value: number, peak: number): number {
  if (peak <= 0 || value <= 0) return 0;
  return Math.max(6, Math.round((value / peak) * 100));
}

/**
 * Что считать главным числом столбца.
 *
 * `store` — зал: сплошной столбец это витрина, штриховка позади — запас.
 * `warehouse` — склад: ровно наоборот. Экраны зала и склада — один и тот же
 * ряд, показанный с разной стороны, поэтому компонент один.
 */
export type CurveMode = "store" | "warehouse";

export function SizeCurve({
  bars,
  onPick,
  compact,
  mode = "store",
}: {
  bars: CurveBar[];
  /** Если передан — столбцы становятся кнопками. Иначе ряд только читают. */
  onPick?: (bar: CurveBar) => void;
  compact?: boolean;
  mode?: CurveMode;
}) {
  const t = useTranslations("app.curve");

  if (bars.length === 0) {
    return <p className="text-sm text-app-dim">{t("noSizes")}</p>;
  }

  const peak = Math.max(
    ...bars.map((bar) => Math.max(bar.store, bar.warehouse)),
    1,
  );

  return (
    <div
      className="flex items-end gap-1.5"
      role="group"
      aria-label={t("groupLabel")}
    >
      {bars.map((bar, index) => {
        // Главное число рисуется сплошным, второе уходит в штриховку.
        const lead = mode === "warehouse" ? bar.warehouse : bar.store;
        const behind = mode === "warehouse" ? bar.store : bar.warehouse;
        const leadHeight = share(lead, peak);
        const behindHeight = share(behind, peak);
        const disabled = lead === 0;

        const label = t("barLabel", {
          size: bar.size,
          store: bar.store,
          warehouse: bar.warehouse,
        });

        const body = (
          <>
            <span
              className={cn(
                "font-mono text-[12.5px] font-bold tabular-nums",
                bar.gone
                  ? "text-app-dim-2"
                  : bar.alert
                    ? "text-[#a8700c]"
                    : "text-app-ink",
              )}
            >
              {bar.gone ? "—" : lead}
            </span>

            <span
              className={cn(
                "relative overflow-hidden rounded-[5px] bg-app-track",
                compact ? "h-14 w-7" : "h-[76px] w-[34px]",
                bar.alert && "ring-[1.5px] ring-app-gold",
              )}
            >
              {behindHeight > 0 ? (
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 bg-[repeating-linear-gradient(-45deg,rgb(15_82_186/0.16)_0_3px,transparent_3px_6px)]"
                  style={{ height: `${behindHeight}%` }}
                />
              ) : null}

              {leadHeight > 0 ? (
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-x-0 bottom-0 origin-bottom rounded-t-[5px] motion-safe:animate-curve-rise",
                    bar.alert
                      ? "bg-linear-to-b from-app-gold-lift to-app-gold"
                      : "bg-linear-to-b from-app-sapphire-lift to-app-sapphire",
                  )}
                  style={{
                    height: `${leadHeight}%`,
                    animationDelay: `${index * 70}ms`,
                  }}
                />
              ) : null}
            </span>

            <span
              className={cn(
                "font-mono text-[11.5px] tracking-[0.04em] tabular-nums",
                bar.alert ? "font-bold text-[#a8700c]" : "text-app-dim",
              )}
            >
              {bar.size}
            </span>
          </>
        );

        if (!onPick) {
          return (
            <span
              key={bar.variant.id}
              className="flex flex-col items-center gap-1.5"
              title={label}
            >
              {body}
            </span>
          );
        }

        return (
          <button
            key={bar.variant.id}
            type="button"
            disabled={disabled}
            onClick={() => onPick(bar)}
            aria-label={label}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-[5px] transition-opacity duration-150",
              "focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-app-sapphire-lift",
              disabled ? "cursor-default opacity-60" : "hover:opacity-80",
            )}
          >
            {body}
          </button>
        );
      })}
    </div>
  );
}
