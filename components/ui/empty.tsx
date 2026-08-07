import { cn } from "@/lib/cn";

/**
 * Пустое состояние.
 *
 * «Нет данных» — это отчёт о работе программы, а не помощь человеку.
 * Пустой экран обязан сказать три вещи: что здесь бывает, почему сейчас
 * пусто и что нажать. Поэтому у состояния всегда есть рисунок,
 * объясняющий текст и кнопка.
 *
 * Рисунки — инлайновый SVG на два фирменных цвета, без внешних файлов:
 * пустой экран не должен ждать загрузки картинки, чтобы объясниться.
 */

export type Art = "box" | "cart" | "search" | "chart";

const SAPPHIRE = "#0F52BA";
const AMBER = "#F2A623";

function Illustration({ art }: { art: Art }) {
  const common = {
    width: 96,
    height: 96,
    viewBox: "0 0 96 96",
    fill: "none",
    "aria-hidden": true,
  } as const;

  if (art === "cart") {
    return (
      <svg {...common}>
        <circle cx="48" cy="48" r="44" fill="#EAF1FC" />
        <path
          d="M26 32h8l6 28h26l6-20H36"
          stroke={SAPPHIRE}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="43" cy="68" r="4.5" fill={SAPPHIRE} />
        <circle cx="63" cy="68" r="4.5" fill={SAPPHIRE} />
        <path
          d="M56 28v14M49 35h14"
          stroke={AMBER}
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (art === "search") {
    return (
      <svg {...common}>
        <circle cx="48" cy="48" r="44" fill="#EAF1FC" />
        <circle cx="44" cy="43" r="16" stroke={SAPPHIRE} strokeWidth="3.5" />
        <path
          d="M56 55l12 12"
          stroke={SAPPHIRE}
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M38 43h12"
          stroke={AMBER}
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (art === "chart") {
    return (
      <svg {...common}>
        <circle cx="48" cy="48" r="44" fill="#EAF1FC" />
        <path
          d="M28 66h40"
          stroke={SAPPHIRE}
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <rect x="34" y="48" width="9" height="12" rx="2.5" fill={SAPPHIRE} />
        <rect x="49" y="40" width="9" height="20" rx="2.5" fill={SAPPHIRE} />
        <rect x="64" y="30" width="9" height="30" rx="2.5" fill={AMBER} />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <circle cx="48" cy="48" r="44" fill="#EAF1FC" />
      <path
        d="M24 40l24-12 24 12v24L48 76 24 64V40z"
        stroke={SAPPHIRE}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path
        d="M24 40l24 12 24-12M48 52v24"
        stroke={SAPPHIRE}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <circle cx="72" cy="30" r="7" fill={AMBER} />
    </svg>
  );
}

export function EmptyBlock({
  art = "box",
  title,
  lead,
  action,
  children,
  className,
}: {
  art?: Art;
  title: string;
  lead?: string;
  /** Кнопка действия. Без неё пустое состояние всё ещё тупик. */
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-frame border border-app-line bg-app-card",
        "px-6 py-10 text-center tablet:px-10 tablet:py-14",
        "motion-safe:animate-app-in",
        className,
      )}
    >
      <Illustration art={art} />
      <h2 className="mt-6 text-[22px] font-extrabold tracking-[-0.02em] text-balance text-app-ink">
        {title}
      </h2>
      {lead ? (
        <p className="mt-2.5 max-w-[38ch] text-body leading-normal text-pretty text-app-dim">
          {lead}
        </p>
      ) : null}
      {action ? <div className="mt-7">{action}</div> : null}
      {children ? <div className="mt-9 w-full">{children}</div> : null}
    </div>
  );
}
