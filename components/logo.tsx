import { cn } from "@/lib/cn";

/**
 * Знак TIM: синий квадрат 38×38 с буквой T + словесная часть.
 * tone="dark" — для футера на тёмном фоне (белый текст).
 */
export function Logo({
  tone = "light",
  className,
}: {
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span
        aria-hidden
        className="inline-flex size-[38px] items-center justify-center rounded-[10px] bg-brand-600 text-[18px] font-extrabold tracking-[0.5px] text-white"
      >
        T
      </span>
      <span
        className={cn(
          "text-[22px] font-extrabold tracking-[-0.5px]",
          tone === "dark" ? "text-white" : "text-brand-600",
        )}
      >
        TIM
      </span>
    </span>
  );
}
