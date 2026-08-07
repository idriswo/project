"use client";

import { useId } from "react";

import { cn } from "@/lib/cn";

/**
 * Поля и секции форм.
 *
 * Длинная форма в одну колонку — это список, который нельзя окинуть
 * взглядом: человек не понимает, сколько ещё осталось. Поэтому любая
 * форма приложения собирается из `FormSection` — пронумерованных
 * блоков с заголовком и одной мыслью внутри.
 */

export function FormSection({
  step,
  title,
  hint,
  children,
  className,
}: {
  /** Номер блока. Показывает, что форма конечна, и сколько уже позади. */
  step: number;
  title: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-frame border border-app-line bg-app-card p-5 tablet:p-7",
        className,
      )}
    >
      <div className="flex items-start gap-3.5">
        <span
          aria-hidden
          className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-app-sapphire-soft font-mono text-[13px] font-bold text-app-sapphire tabular-nums"
        >
          {step}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[17px] leading-tight font-extrabold tracking-[-0.015em] text-app-ink">
            {title}
          </h2>
          {hint ? (
            <p className="mt-1 text-[13.5px] leading-normal text-pretty text-app-dim">
              {hint}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-5">{children}</div>
    </section>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  /** Получает id — чтобы `label` был привязан к настоящему полю. */
  children: (props: {
    id: string;
    "aria-invalid": true | undefined;
    "aria-describedby": string | undefined;
  }) => React.ReactNode;
  className?: string;
}) {
  const id = useId();
  const noteId = `${id}-note`;
  const note = error ?? hint;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label
        htmlFor={id}
        className="text-[13px] font-bold tracking-[0.01em] text-app-dim"
      >
        {label}
      </label>
      {children({
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": note ? noteId : undefined,
      })}
      {note ? (
        <p
          id={noteId}
          role={error ? "alert" : undefined}
          className={cn(
            "text-[12.5px] leading-snug",
            error ? "text-app-out" : "text-app-dim-2",
          )}
        >
          {note}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Единственный вид поля ввода в приложении. 56px высоты — палец, а не
 * курсор: половину форм заполняют с телефона, стоя у прилавка.
 */
export function TextInput({
  className,
  ...rest
}: React.ComponentProps<"input">) {
  return (
    <input
      {...rest}
      className={cn(
        "h-14 w-full rounded-card border-[1.5px] border-app-line-strong bg-app-card px-4",
        "font-semibold text-app-ink outline-none",
        "transition-[border-color,box-shadow] duration-150",
        "placeholder:font-medium placeholder:text-app-dim-2",
        "focus:border-app-sapphire focus:shadow-[0_0_0_4px_rgb(15_82_186/0.10)]",
        "aria-invalid:border-app-out aria-invalid:focus:shadow-[0_0_0_4px_rgb(194_52_29/0.10)]",
        "disabled:opacity-60",
        className,
      )}
    />
  );
}

/**
 * Крупный выбор одного варианта: карточка, а не радиокнопка.
 * По радиоточке диаметром 16px на телефоне не попадают.
 */
export function ChoiceCard({
  selected,
  title,
  description,
  right,
  onClick,
  className,
}: {
  selected: boolean;
  title: string;
  description?: string;
  right?: React.ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-center gap-4 rounded-card border-[1.5px] px-5 py-4 text-left",
        "transition-[border-color,background-color,box-shadow] duration-150",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-sapphire",
        selected
          ? "border-app-sapphire bg-app-sapphire-soft shadow-[0_10px_22px_-16px_rgb(15_82_186/0.6)]"
          : "border-app-line-strong bg-app-card hover:border-app-sapphire",
        className,
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="block font-extrabold text-app-ink">{title}</span>
        {description ? (
          <span className="mt-0.5 block text-[13.5px] leading-snug text-app-dim">
            {description}
          </span>
        ) : null}
      </span>
      {right}
    </button>
  );
}
