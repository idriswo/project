"use client";

import { useId } from "react";

import { cn } from "@/lib/cn";

/**
 * Тумблер.
 *
 * В макетах Stitch он встречается на каждом втором экране — печать
 * этикетки, каналы уведомлений, режим скидки. Везде это одно и то же
 * действие «включено / выключено», поэтому вид один на всё приложение.
 *
 * Это настоящий `<button role="switch">`, а не стилизованный чекбокс:
 * скринридер должен объявлять состояние, а не «флажок без подписи».
 */
export function Toggle({
  checked,
  onChange,
  label,
  hint,
  disabled,
  className,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Подпись справа. Тумблер без подписи никто не понимает. */
  label: string;
  hint?: string;
  disabled?: boolean;
  className?: string;
}) {
  const id = useId();

  return (
    <div className={cn("flex items-start gap-3", className)}>
      <button
        type="button"
        role="switch"
        id={id}
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-px h-6 w-11 shrink-0 rounded-full",
          "transition-colors duration-150",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-sapphire",
          "disabled:opacity-45",
          checked ? "bg-app-sapphire" : "bg-app-track",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm",
            "transition-transform duration-150 motion-reduce:transition-none",
            checked && "translate-x-5",
          )}
        />
      </button>
      <label htmlFor={id} className="min-w-0 cursor-pointer select-none">
        <span className="block text-[14.5px] leading-tight font-semibold text-app-ink">
          {label}
        </span>
        {hint ? (
          <span className="mt-0.5 block text-[12.5px] leading-snug text-app-dim">
            {hint}
          </span>
        ) : null}
      </label>
    </div>
  );
}
