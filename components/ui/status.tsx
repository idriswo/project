import { cn } from "@/lib/cn";

/**
 * Статусы и суммы со знаком.
 *
 * Цвет здесь несёт смысл, поэтому он всегда идёт вместе с текстом:
 * «Одобрено» зелёным, а не просто зелёная точка. Восемь процентов
 * мужчин не различают красный и зелёный — по одному цвету статус
 * читаться не должен.
 */

export type Tone = "ok" | "low" | "out" | "info" | "neutral";

const TONES: Record<Tone, string> = {
  ok: "bg-app-ok-soft text-app-ok",
  low: "bg-app-low-soft text-app-low",
  out: "bg-app-out-soft text-app-out",
  info: "bg-app-sapphire-soft text-app-sapphire",
  neutral: "bg-app-panel text-app-dim",
};

export function StatusPill({
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
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1",
        "text-[12px] font-bold whitespace-nowrap",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Точка состояния оборудования: принтер, сканер. */
export function StatusDot({ tone = "ok" }: { tone?: Tone }) {
  const color = {
    ok: "bg-app-ok",
    low: "bg-app-low",
    out: "bg-app-out",
    info: "bg-app-sapphire",
    neutral: "bg-app-dim-2",
  }[tone];

  return <span aria-hidden className={cn("size-2.5 rounded-full", color)} />;
}

/**
 * Сумма со знаком: приход зелёным, расход красным.
 * Знак печатается всегда — по одному цвету направление не определить.
 */
export function SignedMoney({
  value,
  formatted,
  unit,
  className,
}: {
  value: number;
  /** Уже отформатированное число без знака (`lib/format.ts`). */
  formatted: string;
  unit?: string;
  className?: string;
}) {
  const negative = value < 0;

  return (
    <span
      className={cn(
        "font-mono font-bold whitespace-nowrap num",
        negative ? "text-app-out" : "text-app-ok",
        className,
      )}
    >
      {negative ? "−" : "+"}
      {formatted}
      {unit ? (
        <small className="ml-1 text-[0.8em] font-semibold opacity-70">
          {unit}
        </small>
      ) : null}
    </span>
  );
}

/**
 * Расхождение при приёмке и инвентаризации: `+2` зелёным, `−3` красным,
 * ноль — тихим прочерком, чтобы совпавшие строки не шумели.
 */
export function Diff({ value }: { value: number }) {
  if (value === 0) {
    return <span className="font-mono text-app-dim-2">0</span>;
  }

  return (
    <span
      className={cn(
        "font-mono font-bold num",
        value > 0 ? "text-app-ok" : "text-app-out",
      )}
    >
      {value > 0 ? "+" : "−"}
      {Math.abs(value)}
    </span>
  );
}
