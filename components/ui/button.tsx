import type { ComponentProps } from "react";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

/*
 * primary   — янтарная кнопка, основной CTA макета (#F2A623)
 * secondary — белая с рамкой, «Смотреть демо»
 * ghost     — текстовая ссылка, «Войти» в хедере
 */
const variants: Record<Variant, string> = {
  primary:
    "bg-accent-500 text-ink hover:bg-accent-600 focus-visible:outline-accent-600",
  secondary:
    "bg-white text-ink border border-line-strong hover:border-brand-600 hover:text-brand-600 focus-visible:outline-brand-600",
  ghost: "text-ink hover:text-brand-600 focus-visible:outline-brand-600",
};

const sizes: Record<Size, string> = {
  md: "px-[22px] py-[11px] text-[15px]",
  lg: "px-[30px] py-[15px] text-base",
};

const base =
  "inline-flex items-center justify-center gap-[9px] rounded-btn font-bold transition-colors " +
  "focus-visible:outline-2 focus-visible:outline-offset-2";

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
