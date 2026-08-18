import { cn } from "@/lib/cn";
import { motion } from "motion/react";

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
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(
        "flex flex-col items-center rounded-[32px] border border-app-line bg-app-card/60 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]",
        "px-6 py-12 text-center tablet:px-10 tablet:py-16 relative overflow-hidden",
        className,
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-app-sapphire/5 to-transparent pointer-events-none" />
      <div className="relative z-10 flex flex-col items-center">
        <motion.div 
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5, type: "spring" }}
          className="drop-shadow-sm"
        >
          <Illustration art={art} />
        </motion.div>
        <motion.h2 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="mt-8 text-[24px] font-extrabold tracking-[-0.02em] text-balance text-app-ink drop-shadow-sm"
        >
          {title}
        </motion.h2>
        {lead ? (
          <motion.p 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="mt-3 max-w-[42ch] text-[15px] font-medium leading-relaxed text-pretty text-app-dim"
          >
            {lead}
          </motion.p>
        ) : null}
        {action ? (
          <motion.div 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="mt-8"
          >
            {action}
          </motion.div>
        ) : null}
        {children ? <div className="mt-10 w-full relative z-10">{children}</div> : null}
      </div>
    </motion.div>
  );
}
