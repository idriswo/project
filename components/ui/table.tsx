import { cn } from "@/lib/cn";

/**
 * Таблица рабочих экранов.
 *
 * На телефоне таблица не помещается никогда, поэтому она всегда лежит в
 * собственном горизонтальном скролле: страница вбок ехать не должна
 * (`overflow-x: clip` на `body`, `globals.css`). Заголовок таблицы
 * прилипает сверху — при длинной приёмке иначе не помнишь, что за колонка.
 */
export function DataTable({
  head,
  children,
  caption,
  className,
}: {
  head: React.ReactNode;
  children: React.ReactNode;
  /** Описание для скринридера, визуально скрыто. */
  caption: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-frame border border-app-line bg-app-card",
        className,
      )}
    >
      <table className="w-full min-w-[640px] border-collapse text-left">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-app-panel">
          <tr>{head}</tr>
        </thead>
        <tbody className="divide-y divide-app-line">{children}</tbody>
      </table>
    </div>
  );
}

export function Th({
  className,
  align = "left",
  children,
  ...rest
}: React.ComponentProps<"th"> & { align?: "left" | "right" | "center" }) {
  return (
    <th
      scope="col"
      {...rest}
      className={cn(
        "px-4 py-3 text-[11.5px] font-bold tracking-[0.08em] whitespace-nowrap text-app-dim uppercase",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  className,
  align = "left",
  numeric,
  children,
  ...rest
}: React.ComponentProps<"td"> & {
  align?: "left" | "right" | "center";
  /** Деньги и количества: моноширинный, цифры колонкой. */
  numeric?: boolean;
}) {
  return (
    <td
      {...rest}
      className={cn(
        "px-4 py-3.5 text-[14px] text-app-ink",
        numeric && "font-mono font-semibold num",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
    >
      {children}
    </td>
  );
}

/** Строка итога: та же таблица, но жирнее и без разделителя сверху. */
export function TotalRow({ children }: { children: React.ReactNode }) {
  return (
    <tr className="border-t-2 border-app-line-strong bg-app-panel font-extrabold">
      {children}
    </tr>
  );
}
