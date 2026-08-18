import type { ComponentProps } from "react";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

type Variant =
  "primary" | "secondary" | "ghost" | "sapphire" | "quiet" | "danger";
type Size = "sm" | "md" | "lg" | "xl";

/*
 * primary   — янтарная кнопка, основной CTA макета (#F2A623)
 * secondary — белая с рамкой, «Смотреть демо»
 * ghost     — текстовая ссылка, «Войти» в хедере
 * sapphire  — синяя заливка: действие внутри приложения, которое не про
 *             деньги (сохранить, вынести в зал). Янтарь бережём для главного
 *             действия экрана, иначе он перестанет выделяться
 * quiet     — на светлой подложке, второстепенное действие в карточке
 * danger    — отмена продажи, удаление
 */
const variants: Record<Variant, string> = {
  primary:
    "bg-accent-500 text-on-accent shadow-[0_12px_24px_-12px_rgb(242_166_35/0.7)] " +
    "hover:bg-accent-600 hover:-translate-y-px active:translate-y-0 " +
    "focus-visible:outline-accent-600 motion-reduce:hover:translate-y-0",
  secondary:
    "bg-card text-ink border border-line-strong hover:border-brand-600 hover:text-brand-ink focus-visible:outline-brand-600",
  ghost: "text-ink hover:text-brand-ink focus-visible:outline-brand-600",
  sapphire:
    "bg-app-sapphire text-white shadow-[0_12px_24px_-14px_rgb(15_82_186/0.75)] " +
    "hover:bg-[#0b3f8f] hover:-translate-y-px active:translate-y-0 " +
    "focus-visible:outline-app-sapphire motion-reduce:hover:translate-y-0",
  quiet:
    "bg-app-panel text-app-ink border border-app-line hover:border-app-sapphire hover:text-app-sapphire focus-visible:outline-app-sapphire",
  danger:
    "bg-app-out-soft text-app-out border border-app-out/25 hover:bg-app-out hover:text-white focus-visible:outline-app-out",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[13px]",
  md: "px-6 py-2.5 text-[14px]",
  lg: "px-8 py-3.5 text-[15px]",
  xl: "h-15 px-8 text-[17px]",
};

const base =
  "inline-flex items-center justify-center gap-[9px] rounded-[14px] font-bold " +
  "transition-all duration-200 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "disabled:pointer-events-none disabled:opacity-50 disabled:grayscale";

type StyleProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
};

type LinkRest = Omit<ComponentProps<typeof Link>, keyof StyleProps>;
type ButtonRest = Omit<ComponentProps<"button">, keyof StyleProps>;

type ButtonProps = StyleProps & (LinkRest | (ButtonRest & { href?: never }));

/**
 * Кнопка-ссылка (если передан href — рендерится локализованный Link)
 * или обычная кнопка. Стили общие.
 */
export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = cn(base, variants[variant], sizes[size], className);

  if (rest.href !== undefined) {
    // Якорь на текущей странице — обычная ссылка: локализованный Link
    // добавил бы к "#pricing" префикс локали и сломал бы переход.
    if (typeof rest.href === "string" && rest.href.startsWith("#")) {
      return (
        <a {...(rest as ComponentProps<"a">)} className={classes}>
          {children}
        </a>
      );
    }

    return (
      <Link {...(rest as LinkRest)} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button {...(rest as ButtonRest)} className={classes}>
      {children}
    </button>
  );
}
