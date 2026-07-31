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

/** Шапка секции: eyebrow + H2 + лид, по центру, max-width 640px. */
export function SectionHeader({
  eyebrow,
  title,
  lead,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
}) {
  return (
    <div className="reveal mx-auto max-w-[640px] text-center">
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
