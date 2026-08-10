"use client";

import { ChevronDown, Minus, Plus, Search, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useId, useMemo, useState } from "react";

import { AppShell } from "@/components/app/app-shell";
import {
  buildBars,
  type CurveBar,
  SizeCurve,
} from "@/components/app/size-curve";
import { Badge, stockTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyBlock } from "@/components/ui/empty";
import { ListSkeleton } from "@/components/ui/skeleton";
import { DataCard, Eyebrow } from "@/components/ui/stat";
import {
  colorsOf,
  popularSizes,
  type Product,
  type ProductPage,
  type SizeDemand,
  type Variant,
} from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { fetchApi } from "@/lib/apiClient";
import { initial, money, toneOf } from "@/lib/format";
import { useAppSession } from "@/lib/session";

type Payment = "CASH" | "CARD" | "TRANSFER";

const PAYMENTS: Payment[] = ["CASH", "CARD", "TRANSFER"];

interface CartLine {
  variant: Variant;
  productName: string;
  color: string | null;
  size: string;
  price: number;
  quantity: number;
  /** Сколько всего лежит в зале — дальше этого продавать нечего. */
  available: number;
}

/**
 * Касса (Этап 19).
 *
 * Экран, которым пользуются стоя, в очереди и не глядя. Отсюда всё
 * остальное:
 *
 * - поиск — самое крупное поле экрана и получает фокус сразу; аппаратный
 *   сканер печатает как клавиатура, и его ввод попадает туда же;
 * - товар — карточка с плиткой, а не строка таблицы: в очереди ищут
 *   глазами форму и цвет, а не читают колонку;
 * - чек виден всегда: на широком экране сбоку, на телефоне — полосой
 *   над нижними вкладками, которая разворачивается в полный чек;
 * - «Оплатить» — самый крупный элемент экрана и единственный янтарный.
 *   Промахнуться по нему нельзя, искать его не нужно.
 *
 * Продажа идёт по варианту (размер + цвет), потому что так устроен
 * `POST /sales`: в магазине одежды продаётся конкретная вещь конкретного
 * размера, а не «товар вообще».
 */
export function PosView() {
  const t = useTranslations("app.pos");
  const session = useAppSession();

  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[] | null>(null);
  const [popular, setPopular] = useState<Set<string>>(new Set());
  const [pickedColor, setPickedColor] = useState<Record<string, string>>({});

  const [cart, setCart] = useState<CartLine[]>([]);
  const [discount, setDiscount] = useState("");
  const [payment, setPayment] = useState<Payment>("CASH");
  const [sheetOpen, setSheetOpen] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const searchId = useId();

  useEffect(() => {
    // Ходовые размеры решают, где кривой загораться золотом. Если отчёт
    // не пришёл, золота просто не будет — подсветка без данных врала бы.
    fetchApi("/reports/size-analysis?period=month")
      .then((rows: SizeDemand[]) =>
        setPopular(popularSizes(Array.isArray(rows) ? rows : [])),
      )
      .catch(() => {});
  }, []);

  const loadProducts = useCallback(async (search: string) => {
    const page: ProductPage = await fetchApi(
      `/inventory/products?limit=20${search ? `&search=${encodeURIComponent(search)}` : ""}`,
    );
    return Array.isArray(page?.items) ? page.items : [];
  }, []);

  useEffect(() => {
    let cancelled = false;
    // 250 мс задержки на набор: без неё каждый символ — запрос, и список
    // прыгает под пальцами. Пустой запрос грузим сразу, ждать нечего.
    const timer = setTimeout(
      () => {
        loadProducts(query.trim())
          .then((items) => {
            if (!cancelled) setProducts(items);
          })
          .catch(() => {
            if (!cancelled) setProducts([]);
          });
      },
      query ? 250 : 0,
    );

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, loadProducts]);

  const addToCart = useCallback((product: Product, bar: CurveBar) => {
    setDone(null);
    setError(null);
    setCart((prev) => {
      const existing = prev.find((line) => line.variant.id === bar.variant.id);
      if (existing) {
        if (existing.quantity >= existing.available) return prev;
        return prev.map((line) =>
          line.variant.id === bar.variant.id
            ? { ...line, quantity: line.quantity + 1 }
            : line,
        );
      }
      return [
        ...prev,
        {
          variant: bar.variant,
          productName: product.name,
          color: bar.variant.color,
          size: bar.size,
          price: bar.variant.price,
          quantity: 1,
          available: bar.store,
        },
      ];
    });
  }, []);

  function step(variantId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((line) =>
          line.variant.id === variantId
            ? {
                ...line,
                quantity: Math.min(line.available, line.quantity + delta),
              }
            : line,
        )
        .filter((line) => line.quantity > 0),
    );
  }

  function removeLine(variantId: string) {
    setCart((prev) => prev.filter((line) => line.variant.id !== variantId));
  }

  const subtotal = useMemo(
    () => cart.reduce((sum, line) => sum + line.price * line.quantity, 0),
    [cart],
  );
  const items = useMemo(
    () => cart.reduce((sum, line) => sum + line.quantity, 0),
    [cart],
  );
  const discountValue = Math.max(0, Math.min(subtotal, Number(discount) || 0));
  const total = subtotal - discountValue;

  async function handleSell() {
    if (cart.length === 0) return;
    setSaving(true);
    setError(null);
    setDone(null);

    try {
      await fetchApi("/sales", {
        method: "POST",
        body: JSON.stringify({
          paymentMethod: payment,
          discount: discountValue,
          items: cart.map((line) => ({
            variantId: line.variant.id,
            quantity: line.quantity,
          })),
        }),
      });

      setDone(t("sold", { total: money(total) }));
      setCart([]);
      setDiscount("");
      setSheetOpen(false);

      // Остатки изменились — перечитываем, иначе кривая покажет проданное.
      setProducts(await loadProducts(query.trim()));
    } catch (err: unknown) {
      setError(
        err instanceof Error && err.message ? err.message : t("saveFailed"),
      );
    } finally {
      setSaving(false);
    }
  }

  const checkout = (
    <Checkout
      cart={cart}
      items={items}
      total={total}
      discount={discount}
      payment={payment}
      saving={saving}
      error={error}
      done={done}
      onDiscount={setDiscount}
      onPayment={setPayment}
      onStep={step}
      onRemove={removeLine}
      onSell={handleSell}
    />
  );

  return (
    <AppShell storeName={session.storeName} role={session.role}>
      <div className="mx-auto w-full max-w-[1180px] desktop:grid desktop:grid-cols-[minmax(0,1fr)_360px] desktop:items-start desktop:gap-6">
        {/* ── Каталог ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-5">
          <div className="relative">
            <label htmlFor={searchId} className="sr-only">
              {t("searchLabel")}
            </label>
            <Search
              className="pointer-events-none absolute top-1/2 left-5 size-5 -translate-y-1/2 text-app-dim-2"
              aria-hidden
            />
            <input
              id={searchId}
              type="search"
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("searchPlaceholder")}
              className={cn(
                "h-16 w-full rounded-frame border-[1.5px] border-app-line-strong bg-app-card pr-5 pl-13",
                "text-[17px] font-semibold text-app-ink outline-none",
                "transition-[border-color,box-shadow] duration-150",
                "placeholder:font-medium placeholder:text-app-dim-2",
                "focus:border-app-sapphire focus:shadow-[0_0_0_4px_rgb(15_82_186/0.10)]",
              )}
            />
          </div>

          {products === null ? (
            <ListSkeleton rows={4} />
          ) : products.length === 0 ? (
            <EmptyBlock
              art={query ? "search" : "box"}
              title={query ? t("nothingFoundHeading") : t("noProductsHeading")}
              lead={query ? t("nothingFound") : t("noProducts")}
              action={
                query ? (
                  <Button
                    variant="quiet"
                    size="lg"
                    onClick={() => setQuery("")}
                  >
                    {t("clearSearch")}
                  </Button>
                ) : (
                  <Button href="/inventory/new" size="xl">
                    {t("addProduct")}
                  </Button>
                )
              }
            />
          ) : (
            <div className="flex flex-col gap-3">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  popular={popular}
                  color={pickedColor[product.id]}
                  onColor={(c) =>
                    setPickedColor((prev) => ({ ...prev, [product.id]: c }))
                  }
                  onPick={(bar) => addToCart(product, bar)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Чек: широкий экран ──────────────────────────────── */}
        <div className="sticky top-8 hidden desktop:block">{checkout}</div>
      </div>

      {/* ── Чек: телефон ────────────────────────────────────── */}
      <MobileCheckout
        items={items}
        total={total}
        open={sheetOpen}
        onToggle={() => setSheetOpen((v) => !v)}
        currency={t("currency")}
        summaryLabel={t("itemsInCart", { count: items })}
        emptyLabel={t("cartEmpty")}
      >
        {checkout}
      </MobileCheckout>
    </AppShell>
  );
}

/* ══ Карточка товара ═══════════════════════════════════════════ */

function ProductCard({
  product,
  popular,
  color,
  onColor,
  onPick,
}: {
  product: Product;
  popular: Set<string>;
  color: string | undefined;
  onColor: (color: string) => void;
  onPick: (bar: CurveBar) => void;
}) {
  const t = useTranslations("app.pos");

  const colors = colorsOf(product);
  const active = color ?? colors[0] ?? null;
  const variants = active
    ? product.variants.filter((v) => v.color === active)
    : product.variants;
  const bars = buildBars(variants, popular);
  const price = variants[0]?.price ?? product.variants[0]?.price ?? 0;
  const onFloor = bars.reduce((sum, bar) => sum + bar.store, 0);

  return (
    <DataCard className="p-4 tablet:p-5">
      <div className="flex items-start gap-4">
        {/* Фотографий товара бэкенд пока не отдаёт, поэтому плитка —
         * буква на фирменном фоне. Цвет считается из названия, чтобы
         * при перезагрузке куртка осталась той же куртки. */}
        <span
          aria-hidden
          className={cn(
            "flex size-13 shrink-0 items-center justify-center rounded-xl text-[20px] font-extrabold",
            toneOf(product.name),
          )}
        >
          {initial(product.name)}
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <b className="truncate text-[16px] leading-tight font-extrabold tracking-[-0.015em] text-app-ink">
            {product.name}
          </b>
          <span className="truncate font-mono text-[11.5px] tracking-[0.05em] text-app-dim-2 uppercase">
            {[product.variants[0]?.sku, active].filter(Boolean).join(" · ") ||
              "—"}
          </span>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className="font-mono text-[18px] leading-none font-bold text-app-ink num">
            {money(price)}
            <small className="ml-1 text-[0.6em] font-semibold text-app-dim-2">
              {t("currency")}
            </small>
          </span>
          <Badge tone={stockTone(onFloor)}>
            {onFloor > 0 ? t("onFloor", { count: onFloor }) : t("outOfStock")}
          </Badge>
        </div>
      </div>

      {colors.length > 1 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {colors.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onColor(c)}
              aria-pressed={c === active}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold",
                "transition-[background-color,border-color,color] duration-150",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-sapphire",
                c === active
                  ? "border-app-sapphire bg-app-sapphire-soft text-app-sapphire"
                  : "border-app-line-strong text-app-dim hover:border-app-sapphire hover:text-app-sapphire",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-4 border-t border-app-line pt-4">
        <SizeCurve bars={bars} onPick={onPick} />
      </div>
    </DataCard>
  );
}

/* ══ Чек ═══════════════════════════════════════════════════════ */

function Checkout({
  cart,
  items,
  total,
  discount,
  payment,
  saving,
  error,
  done,
  onDiscount,
  onPayment,
  onStep,
  onRemove,
  onSell,
}: {
  cart: CartLine[];
  items: number;
  total: number;
  discount: string;
  payment: Payment;
  saving: boolean;
  error: string | null;
  done: string | null;
  onDiscount: (value: string) => void;
  onPayment: (value: Payment) => void;
  onStep: (variantId: string, delta: number) => void;
  onRemove: (variantId: string) => void;
  onSell: () => void;
}) {
  const t = useTranslations("app.pos");
  const discountId = useId();

  return (
    <DataCard className="flex flex-col gap-5 p-5">
      <div className="flex items-center justify-between gap-3">
        <Eyebrow>{t("cart")}</Eyebrow>
        {items > 0 ? (
          <Badge tone="info">{t("itemsInCart", { count: items })}</Badge>
        ) : null}
      </div>

      {cart.length === 0 ? (
        <p className="py-6 text-center text-[13.5px] leading-snug text-pretty text-app-dim">
          {t("cartEmpty")}
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {cart.map((line) => (
            <li
              key={line.variant.id}
              className="flex items-center gap-3 rounded-card bg-app-panel px-3.5 py-3"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-bold text-app-ink">
                  {line.productName}
                </span>
                <span className="mt-0.5 block font-mono text-[11px] tracking-[0.05em] text-app-dim-2 uppercase">
                  {[line.color, line.size].filter(Boolean).join(" · ")}
                </span>
              </span>

              <span className="flex shrink-0 items-center gap-1.5">
                <StepButton
                  label={t("less")}
                  onClick={() => onStep(line.variant.id, -1)}
                >
                  <Minus className="size-3.5" aria-hidden />
                </StepButton>
                <span className="w-5 text-center font-mono text-[14px] font-bold text-app-ink tabular-nums">
                  {line.quantity}
                </span>
                <StepButton
                  label={t("more")}
                  disabled={line.quantity >= line.available}
                  onClick={() => onStep(line.variant.id, 1)}
                >
                  <Plus className="size-3.5" aria-hidden />
                </StepButton>
              </span>

              <span className="w-16 shrink-0 text-right font-mono text-[13.5px] font-bold text-app-ink num">
                {money(line.price * line.quantity)}
              </span>

              <button
                type="button"
                onClick={() => onRemove(line.variant.id)}
                aria-label={t("removeLine")}
                className="shrink-0 rounded-md p-1 text-app-dim-2 transition-colors duration-150 hover:text-app-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-sapphire"
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-between gap-4">
        <label
          htmlFor={discountId}
          className="text-[13px] font-bold text-app-dim"
        >
          {t("discount")}
        </label>
        <input
          id={discountId}
          type="text"
          inputMode="numeric"
          value={discount}
          onChange={(event) =>
            onDiscount(event.target.value.replace(/\D/g, ""))
          }
          placeholder="0"
          className="h-11 w-28 rounded-card border-[1.5px] border-app-line-strong bg-app-card px-3 text-right font-mono text-[15px] font-bold text-app-ink tabular-nums transition-[border-color,box-shadow] duration-150 outline-none placeholder:font-medium placeholder:text-app-dim-2 focus:border-app-sapphire focus:shadow-[0_0_0_4px_rgb(15_82_186/0.10)]"
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {PAYMENTS.map((method) => (
          <button
            key={method}
            type="button"
            onClick={() => onPayment(method)}
            aria-pressed={method === payment}
            className={cn(
              "h-11 rounded-card border-[1.5px] text-[13px] font-bold",
              "transition-[background-color,border-color,color] duration-150",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-sapphire",
              method === payment
                ? "border-app-sapphire bg-app-sapphire-soft text-app-sapphire"
                : "border-app-line-strong text-app-dim hover:border-app-sapphire",
            )}
          >
            {t(`payment.${method}`)}
          </button>
        ))}
      </div>

      {/* Сумма — второе по величине число экрана после самой кнопки. */}
      <div className="flex flex-col gap-1 border-t border-app-line pt-4">
        <Eyebrow>{t("toPay")}</Eyebrow>
        <span className="font-mono text-[clamp(32px,6vw,42px)] leading-none font-extrabold tracking-[-0.04em] text-app-ink num">
          {money(total)}
          <small className="ml-1.5 text-[0.36em] font-bold tracking-[0.06em] text-app-dim">
            {t("currency")}
          </small>
        </span>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-card bg-app-out-soft px-4 py-3 text-[13.5px] leading-snug font-semibold text-app-out"
        >
          {error}
        </p>
      ) : null}
      {done ? (
        <p
          role="status"
          className="rounded-card bg-app-ok-soft px-4 py-3 text-[13.5px] font-semibold text-app-ok"
        >
          {done}
        </p>
      ) : null}

      <Button
        onClick={onSell}
        disabled={cart.length === 0 || saving}
        className="h-16 w-full text-[18px]"
      >
        {saving ? t("selling") : t("sell")}
      </Button>
    </DataCard>
  );
}

function StepButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex size-8 items-center justify-center rounded-lg border border-app-line-strong bg-app-card text-app-dim transition-colors duration-150 hover:border-app-sapphire hover:text-app-sapphire focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-sapphire disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  );
}

/**
 * Чек на телефоне.
 *
 * Свернуть его совсем нельзя: продавец должен видеть сумму, не думая,
 * где она. Поэтому внизу всегда висит полоса с итогом, а полный чек
 * открывается по нажатию на неё. Полоса стоит над нижними вкладками,
 * а не поверх — иначе она накрыла бы навигацию.
 */
function MobileCheckout({
  items,
  total,
  open,
  onToggle,
  currency,
  summaryLabel,
  emptyLabel,
  children,
}: {
  items: number;
  total: number;
  open: boolean;
  onToggle: () => void;
  currency: string;
  summaryLabel: string;
  emptyLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="desktop:hidden">
      {open ? (
        <div className="fixed inset-0 z-40 flex flex-col bg-app-bg">
          <div className="flex items-center justify-between gap-4 border-b border-app-line bg-app-card px-5 py-3.5">
            <span className="text-[13px] font-bold text-app-dim">
              {items > 0 ? summaryLabel : emptyLabel}
            </span>
            <button
              type="button"
              onClick={onToggle}
              className="flex size-9 items-center justify-center rounded-full bg-app-panel text-app-dim transition-colors duration-150 hover:text-app-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-sapphire"
            >
              <ChevronDown className="size-5" aria-hidden />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">{children}</div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "fixed inset-x-0 bottom-[68px] z-30 flex items-center justify-between gap-4",
          "border-t border-app-line bg-app-card px-5 py-3",
          "transition-[opacity] duration-150",
          "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-app-sapphire",
          open && "opacity-0",
        )}
        aria-hidden={open}
        tabIndex={open ? -1 : 0}
      >
        <span className="text-[13px] font-bold text-app-dim">
          {items > 0 ? summaryLabel : emptyLabel}
        </span>
        <span className="font-mono text-[22px] leading-none font-extrabold text-app-ink num">
          {money(total)}
          <small className="ml-1 text-[0.45em] font-bold text-app-dim">
            {currency}
          </small>
        </span>
      </button>
    </div>
  );
}
