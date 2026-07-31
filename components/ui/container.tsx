import { cn } from "@/lib/cn";

/** Контейнер макета: max-width 1200px, боковой padding 24px. */
export function Container({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-[1200px] px-6", className)}>
      {children}
    </div>
  );
}
