import { cn } from "@/lib/cn";

import { Container } from "./container";

/** Секция лендинга: вертикальные отступы 80–104px по макету. */
export function Section({
  id,
  tone = "white",
  className,
  children,
}: {
  id?: string;
  tone?: "white" | "surface";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn(
        "py-20 desktop:py-26",
        tone === "surface" ? "bg-surface" : "bg-page",
        className,
      )}
    >
      <Container>{children}</Container>
    </section>
  );
}

/** Надзаголовок секции: 14px, 700, uppercase, letter-spacing 1px. */
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-eyebrow font-bold tracking-[1px] text-brand-ink uppercase">
      {children}
    </span>
  );
}

/**
 * Шапка секции: eyebrow + H2 + лид.
 *
 * По умолчанию по центру, как в макете. `align="left"` понадобился в FAQ,
 * где шапка стоит сбоку от списка вопросов и держится липкой при прокрутке —
 * центрировать её в узкой колонке было бы нечитаемо.
 */
export function SectionHeader({
  eyebrow,
  title,
  lead,
  align = "center",
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  align?: "center" | "left";
}) {
  const left = align === "left";

  return (
    <div
      className={cn(
        "reveal max-w-[640px]",
        left ? "text-left" : "mx-auto text-center",
      )}
    >
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2 className="mt-3.5 text-[32px] leading-[1.1] font-extrabold tracking-[-1px] text-balance tablet:text-[36px] desktop:text-h2">
        {title}
      </h2>
      {lead ? (
        <p className="mt-[18px] text-lg leading-relaxed text-pretty text-muted">
          {lead}
        </p>
      ) : null}
    </div>
  );
}
