import { cn } from "@/lib/cn";

/**
 * Фрагменты настоящего интерфейса TIM для лендинга.
 *
 * Это не иконки и не серые прямоугольники, а те же элементы, что стоят в
 * приложении: размерная кривая, чек кассы, сводка выручки, смены продавцов.
 * Посетитель видит именно то, что получит после регистрации.
 *
 * Все мокапы статические (никакого `"use client"`) — секции лендинга
 * рендерятся на этапе сборки, и мокап не должен тянуть за собой JS.
 * Цифры иллюстративные, поэтому для скринридера блоки скрыты: смысл несёт
 * текст рядом, а не подпись к декоративной картинке.
 *
 * Цвета берутся из токенов `--color-app-*` — тех же, что в приложении. Они
 * не переопределяются тёмной темой лендинга, и мокап остаётся «снимком
 * продукта», а не куском страницы, который едет вместе с темой.
 */

function Frame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "overflow-hidden rounded-frame border border-white/8 bg-app-navy select-none",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Полоска-заголовок окна приложения. */
function Chrome({ title, tab }: { title: string; tab?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/8 px-5 py-3.5">
      <span className="text-[11px] font-extrabold tracking-[0.13em] text-white uppercase">
        TIM
      </span>
      <span className="font-mono text-[10.5px] tracking-[0.14em] text-app-dim-2 uppercase">
        {tab ?? title}
      </span>
    </div>
  );
}

interface Bar {
  size: string;
  /** Высота сплошной части — сколько в зале, в процентах от ряда. */
  store: number;
  /** Высота штриховки — запас на складе. */
  back?: number;
  /** Ходовой размер, которого нет в зале. Единственный повод для золота. */
  alert?: boolean;
}

/** Размерная кривая — подпись всего продукта. */
export function CurveMockup({
  bars,
  caption,
  compact,
}: {
  bars: Bar[];
  caption?: string;
  compact?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end gap-1.5">
        {bars.map((bar) => (
          <div key={bar.size} className="flex flex-col items-center gap-1.5">
            <span
              className={cn(
                "font-mono text-[11px] font-bold tabular-nums",
                bar.alert
                  ? "text-app-gold"
                  : bar.store === 0
                    ? "text-app-dim-2"
                    : "text-white",
              )}
            >
              {bar.store === 0 && !bar.back ? "—" : Math.round(bar.store / 8)}
            </span>

            <span
              className={cn(
                "relative overflow-hidden rounded-[5px] bg-white/5",
                compact ? "h-12 w-6" : "h-16 w-8",
                bar.alert && "ring-[1.5px] ring-app-gold/55",
              )}
            >
              {bar.back ? (
                <span
                  className="absolute inset-x-0 bottom-0 bg-[repeating-linear-gradient(-45deg,rgb(255_255_255/0.09)_0_3px,transparent_3px_6px)]"
                  style={{ height: `${bar.back}%` }}
                />
              ) : null}
              {bar.store > 0 ? (
                <span
                  className={cn(
                    "absolute inset-x-0 bottom-0 rounded-t-[5px]",
                    bar.alert
                      ? "bg-linear-to-b from-app-gold-lift to-app-gold"
                      : "bg-linear-to-b from-app-sapphire-lift to-app-sapphire",
                  )}
                  style={{ height: `${bar.store}%` }}
                />
              ) : null}
            </span>

            <span
              className={cn(
                "font-mono text-[10.5px]",
                bar.alert ? "text-app-gold" : "text-app-dim",
              )}
            >
              {bar.size}
            </span>
          </div>
        ))}
      </div>
      {caption ? (
        <span className="font-mono text-[10.5px] tracking-[0.1em] text-app-dim-2 uppercase">
          {caption}
        </span>
      ) : null}
    </div>
  );
}

const HERO_BARS: Bar[] = [
  { size: "S", store: 30, back: 62 },
  { size: "M", store: 0, back: 38, alert: true },
  { size: "L", store: 12, back: 54, alert: true },
  { size: "XL", store: 74 },
  { size: "2XL", store: 92 },
];

/** Крупный мокап для Hero: касса с кривой и чеком. */
export function HeroMockup({ labels }: { labels: Record<string, string> }) {
  return (
    <Frame className="shadow-mockup">
      <Chrome title="TIM" tab={labels.tab} />

      {/* На телефоне мокап складывается в одну колонку: при ~320px чек в
          боковой колонке ужимался бы примерно до 130px и переставал читаться. */}
      <div className="grid grid-cols-[minmax(0,1fr)] tablet:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-5 border-b border-white/8 p-5 tablet:border-r tablet:border-b-0">
          <div className="border-b-[1.5px] border-white/12 pb-2.5 text-[12.5px] text-app-dim-2">
            {labels.search}
          </div>

          <div className="flex flex-col gap-3.5">
            <div className="flex items-end justify-between gap-4">
              <span className="flex flex-col gap-0.5">
                <b className="text-[14px] font-bold tracking-[-0.014em] text-white">
                  {labels.product}
                </b>
                <span className="font-mono text-[10px] tracking-[0.08em] text-app-dim-2 uppercase">
                  KRT-24 · {labels.color}
                </span>
              </span>
              <span className="font-mono text-[15px] font-bold text-white tabular-nums">
                450
              </span>
            </div>

            <CurveMockup bars={HERO_BARS} caption={labels.curveCaption} />
          </div>
        </div>

        <div className="flex flex-col gap-3 p-5">
          <span className="font-mono text-[9.5px] tracking-[0.2em] text-app-dim-2 uppercase">
            {labels.receipt}
          </span>

          <div className="flex flex-col">
            {[
              {
                name: labels.product,
                meta: `${labels.color} · XL`,
                sum: "900",
              },
              {
                name: labels.product2,
                meta: `${labels.color2} · 42`,
                sum: "220",
              },
            ].map((line) => (
              <div
                key={line.meta}
                className="flex items-center justify-between gap-3 border-b border-white/7 py-2"
              >
                <span className="min-w-0 text-[11.5px] leading-tight text-white">
                  <span className="block truncate">{line.name}</span>
                  <span className="mt-0.5 block font-mono text-[9.5px] tracking-[0.06em] text-app-dim-2 uppercase">
                    {line.meta}
                  </span>
                </span>
                <span className="font-mono text-[11.5px] text-white tabular-nums">
                  {line.sum}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-1 flex flex-col gap-0.5">
            <span className="font-mono text-[9.5px] tracking-[0.2em] text-app-dim-2 uppercase">
              {labels.total}
            </span>
            <span className="font-mono text-[26px] leading-none font-bold tracking-[-0.04em] text-white tabular-nums">
              1 050
            </span>
          </div>

          <span className="mt-1 rounded-[9px] bg-app-gold px-4 py-2.5 text-center text-[11px] font-extrabold tracking-[0.1em] text-on-accent uppercase">
            {labels.sell}
          </span>
        </div>
      </div>
    </Frame>
  );
}

/** Склад: та же кривая, но главное число — коробки. */
export function StockMockup({ labels }: { labels: Record<string, string> }) {
  return (
    <Frame>
      <Chrome title="TIM" tab={labels.tab} />
      <div className="flex flex-col gap-5 p-5">
        {[
          {
            name: labels.product,
            bars: [
              { size: "S", store: 34, back: 20 },
              { size: "M", store: 0, back: 44, alert: true },
              { size: "L", store: 16, back: 60, alert: true },
              { size: "XL", store: 70 },
            ] as Bar[],
          },
          {
            name: labels.product2,
            bars: [
              { size: "40", store: 48 },
              { size: "42", store: 82, back: 26 },
              { size: "44", store: 60 },
              { size: "46", store: 0, back: 30, alert: true },
            ] as Bar[],
          },
        ].map((row) => (
          <div
            key={row.name}
            className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-white/7 pb-5 last:border-b-0 last:pb-0"
          >
            <span className="min-w-[120px] text-[13px] font-bold text-white">
              {row.name}
            </span>
            <CurveMockup bars={row.bars} compact />
          </div>
        ))}
      </div>
    </Frame>
  );
}

/** Касса: чек и итог. */
export function CheckoutMockup({ labels }: { labels: Record<string, string> }) {
  return (
    <Frame>
      <Chrome title="TIM" tab={labels.tab} />
      <div className="flex flex-col gap-3.5 p-5">
        {[
          {
            name: labels.product,
            meta: `${labels.color} · M`,
            q: "×2",
            sum: "900",
          },
          {
            name: labels.product2,
            meta: `${labels.color2} · 42`,
            q: "×1",
            sum: "220",
          },
        ].map((line) => (
          <div
            key={line.meta}
            className="flex items-center justify-between gap-4 border-b border-white/7 pb-3.5"
          >
            <span className="min-w-0 text-[12.5px] leading-tight text-white">
              <span className="block truncate">{line.name}</span>
              <span className="mt-0.5 block font-mono text-[10px] tracking-[0.06em] text-app-dim-2 uppercase">
                {line.meta}
              </span>
            </span>
            <span className="font-mono text-[11px] text-app-dim">{line.q}</span>
            <span className="font-mono text-[12.5px] text-white tabular-nums">
              {line.sum}
            </span>
          </div>
        ))}

        <div className="flex items-end justify-between gap-4">
          <span className="flex flex-col gap-0.5">
            <span className="font-mono text-[9.5px] tracking-[0.2em] text-app-dim-2 uppercase">
              {labels.total}
            </span>
            <span className="font-mono text-[30px] leading-none font-bold tracking-[-0.04em] text-white tabular-nums">
              1 050
            </span>
          </span>
          <span className="rounded-[9px] bg-app-gold px-5 py-2.5 text-[11px] font-extrabold tracking-[0.1em] text-on-accent uppercase">
            {labels.sell}
          </span>
        </div>
      </div>
    </Frame>
  );
}

/** Бухгалтерия: крупные числа, как их видит владелец. */
export function MoneyMockup({ labels }: { labels: Record<string, string> }) {
  return (
    <Frame>
      <Chrome title="TIM" tab={labels.tab} />
      <div className="grid grid-cols-2 gap-px bg-white/8">
        {[
          { label: labels.revenue, value: "48 200", accent: false },
          { label: labels.profit, value: "12 940", accent: true },
          { label: labels.sales, value: "317", accent: false },
          { label: labels.debt, value: "2 100", accent: false },
        ].map((tile) => (
          <div
            key={tile.label}
            className="flex flex-col gap-1.5 bg-app-navy px-5 py-5"
          >
            <span className="font-mono text-[9.5px] tracking-[0.16em] text-app-dim-2 uppercase">
              {tile.label}
            </span>
            <span
              className={cn(
                "font-mono text-[22px] leading-none font-bold tracking-[-0.03em] tabular-nums",
                tile.accent ? "text-app-sapphire-lift" : "text-white",
              )}
            >
              {tile.value}
            </span>
          </div>
        ))}
      </div>
    </Frame>
  );
}

/** Сотрудники: кто на смене и сколько продал. */
export function StaffMockup({ labels }: { labels: Record<string, string> }) {
  return (
    <Frame>
      <Chrome title="TIM" tab={labels.tab} />
      <div className="flex flex-col p-5">
        {[
          { name: "Фируза", role: labels.roleSeller, sum: "18 400", on: true },
          { name: "Далер", role: labels.roleSeller, sum: "12 060", on: true },
          { name: "Нигина", role: labels.roleOwner, sum: "—", on: false },
        ].map((person) => (
          <div
            key={person.name}
            className="flex items-center gap-3.5 border-b border-white/7 py-3.5 last:border-b-0"
          >
            <span
              className={cn(
                "size-1.5 shrink-0 rounded-full",
                person.on ? "bg-app-sapphire-lift" : "bg-white/20",
              )}
            />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <b className="text-[13px] font-semibold text-white">
                {person.name}
              </b>
              <span className="font-mono text-[10px] tracking-[0.1em] text-app-dim-2 uppercase">
                {person.role}
              </span>
            </span>
            <span className="font-mono text-[13px] text-white tabular-nums">
              {person.sum}
            </span>
          </div>
        ))}
      </div>
    </Frame>
  );
}
