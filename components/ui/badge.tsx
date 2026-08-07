import { cn } from "@/lib/cn";

/**
 * Значок состояния.
 *
 * Цвет здесь — не украшение, а сам смысл: зелёный «хватает», жёлтый
 * «мало», красный «кончилось». Поэтому у каждого значка есть ещё и
 * текст: дальтоник и чёрно-белый чек читают одно и то же.
 */

export type Tone = "ok" | "low" | "out" | "info" | "neutral" | "gold";

const tones: Record<Tone, string> = {
  ok: "bg-app-ok-soft text-app-ok",
  low: "bg-app-low-soft text-app-low",
  out: "bg-app-out-soft text-app-out",
  info: "bg-app-sapphire-soft text-app-sapphire",
  gold: "bg-app-gold-soft text-[#a8700c]",
  neutral: "bg-app-panel text-app-dim",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1",
        "text-[11.5px] font-bold tracking-[0.02em] whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * Порог «мало» — три штуки, как в `/reports/low-stock` по умолчанию.
 * Держать его здесь, а не в каждом экране, чтобы витрина и склад не
 * начали считать «мало» по-разному.
 */
export const LOW_STOCK = 3;

export function stockTone(quantity: number): Tone {
  if (quantity <= 0) return "out";
  if (quantity <= LOW_STOCK) return "low";
  return "ok";
}
