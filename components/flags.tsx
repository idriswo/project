import { cn } from "@/lib/cn";
import type { Locale } from "@/i18n/routing";

/*
 * Круглые флаги инлайновым SVG.
 *
 * Эмодзи-флаги (🇹🇯) здесь не годятся: Windows не поставляет для них
 * глифы и рисует вместо флага буквы кода страны — на скриншоте заказчика
 * было видно «TJ» вместо флага. SVG выглядит одинаково везде.
 *
 * Холст квадратный, а сам <svg> скруглён в круг через border-radius:
 * содержимое обрезается по рамке элемента, поэтому clipPath с
 * уникальными id не нужен. Полосы флага при этом обрезаются по кругу —
 * так же, как в обычных круглых иконках стран.
 *
 * ⚠️ Рисунки упрощены: герб Таджикистана передан схематично,
 * у британского флага опущено смещение диагоналей (задача 13.5).
 */

const base = "shrink-0 rounded-full ring-1 ring-black/10 dark:ring-white/20";

type FlagProps = { className?: string };

/** Россия: белая, синяя, красная полосы. */
function FlagRu({ className }: FlagProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={cn(base, className)}
      aria-hidden
      focusable="false"
    >
      <rect width="20" height="6.67" fill="#ffffff" />
      <rect y="6.67" width="20" height="6.66" fill="#0039a6" />
      <rect y="13.33" width="20" height="6.67" fill="#d52b1e" />
    </svg>
  );
}

/** Таджикистан: красная, белая (шире), зелёная полосы, золотые корона и звёзды. */
function FlagTg({ className }: FlagProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={cn(base, className)}
      aria-hidden
      focusable="false"
    >
      <rect width="20" height="5.7" fill="#cc0000" />
      <rect y="5.7" width="20" height="8.6" fill="#ffffff" />
      <rect y="14.3" width="20" height="5.7" fill="#006600" />
      <g fill="#f8c300">
        {/* семь звёзд дугой */}
        {[
          [7.6, 8.5],
          [8.8, 8.0],
          [10, 7.8],
          [11.2, 8.0],
          [12.4, 8.5],
          [8.9, 9.1],
          [11.1, 9.1],
        ].map(([cx, cy], index) => (
          <circle key={index} cx={cx} cy={cy} r="0.45" />
        ))}
        {/* схематичная корона */}
        <path d="M7.7 11.9h4.6v0.8H7.7z" />
        <path d="M7.7 11.9l0.95-1.7 1.35 1.05 1.35-1.05 0.95 1.7z" />
      </g>
    </svg>
  );
}

/** Великобритания — флаг для английской версии. */
function FlagEn({ className }: FlagProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={cn(base, className)}
      aria-hidden
      focusable="false"
    >
      <rect width="20" height="20" fill="#012169" />
      <path d="M0 0L20 20M20 0L0 20" stroke="#ffffff" strokeWidth="4" />
      <path d="M0 0L20 20M20 0L0 20" stroke="#c8102e" strokeWidth="2" />
      <path d="M10 0V20M0 10H20" stroke="#ffffff" strokeWidth="6.5" />
      <path d="M10 0V20M0 10H20" stroke="#c8102e" strokeWidth="3.9" />
    </svg>
  );
}

const FLAGS: Record<Locale, (props: FlagProps) => React.ReactElement> = {
  ru: FlagRu,
  tg: FlagTg,
  en: FlagEn,
};

/** Круглый флаг по локали. */
export function Flag({
  locale,
  className,
}: {
  locale: Locale;
  className?: string;
}) {
  const Component = FLAGS[locale];
  return <Component className={className} />;
}
