import { cn } from "@/lib/cn";

/** Карточка макета: белый фон, рамка #EEF2F7, радиус 14px. */
export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn("rounded-card border border-line bg-white p-8", className)}
    >
      {children}
    </div>
  );
}

/** Квадрат с иконкой в карточке: 52×52, радиус 12px. */
export function IconBox({
  tone = "brand",
  className,
  children,
}: {
  tone?: "brand" | "accent" | "neutral";
  className?: string;
  children: React.ReactNode;
}) {
  const tones = {
    brand: "bg-brand-50 text-brand-600",
    accent: "bg-accent-50 text-accent-500",
    neutral: "bg-surface-alt text-brand-600",
  };

  return (
    <div
      className={cn(
        "flex size-13 items-center justify-center rounded-xl",
        tones[tone],
        className,
      )}
    >
      {children}
    </div>
  );
}
