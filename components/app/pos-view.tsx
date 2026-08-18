"use client";

import { ChevronDown, Minus, Plus, Search, Trash2, ShoppingCart, CreditCard, Banknote, HandCoins } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

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
  available: number;
}

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
    <AppShell session={session}>
      <div className="mx-auto w-full max-w-[1320px] desktop:grid desktop:grid-cols-[minmax(0,1fr)_420px] desktop:items-start desktop:gap-8 pt-4 desktop:pt-0">
        {/* ── Catalog ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-6">
          <div className="relative group">
            <label htmlFor={searchId} className="sr-only">
              {t("searchLabel")}
            </label>
            <div className="absolute inset-0 bg-gradient-to-r from-app-sapphire/20 to-purple-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
            <Search
              className="pointer-events-none absolute top-1/2 left-6 size-6 -translate-y-1/2 text-slate-400 group-focus-within:text-app-sapphire transition-colors"
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
                "relative h-18 w-full rounded-2xl border border-slate-200/60 bg-white/80 pr-6 pl-16",
                "text-[18px] font-semibold text-slate-900 outline-none backdrop-blur-md shadow-sm",
                "transition-all duration-300",
                "placeholder:font-medium placeholder:text-slate-400",
                "focus:border-app-sapphire/50 focus:bg-white focus:shadow-[0_8px_30px_rgb(0,0,0,0.08)]",
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
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
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* ── Checkout Desktop ──────────────────────────────── */}
        <div className="sticky top-6 hidden desktop:block">{checkout}</div>
      </div>

      {/* ── Checkout Mobile ────────────────────────────────────── */}
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
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col rounded-[24px] border border-app-line bg-app-card p-5 shadow-sm transition-all hover:shadow-md hover:border-app-sapphire/50 group"
    >
      <div className="flex items-start gap-4">
        <span
          aria-hidden
          className={cn(
            "flex size-16 shrink-0 items-center justify-center rounded-2xl text-[24px] font-extrabold shadow-inner transition-transform group-hover:scale-105",
            toneOf(product.name),
          )}
        >
          {initial(product.name)}
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5 pt-1">
          <b className="truncate text-[17px] leading-tight font-extrabold tracking-tight text-app-ink group-hover:text-app-sapphire transition-colors">
            {product.name}
          </b>
          <span className="truncate font-mono text-[12px] tracking-wider text-app-dim uppercase">
            {[product.variants[0]?.sku, active].filter(Boolean).join(" · ") ||
              "—"}
          </span>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2 pt-1">
          <span className="font-mono text-[20px] leading-none font-bold text-app-ink num">
            {money(price)}
            <small className="ml-1 text-[0.6em] font-bold text-app-dim">
              {t("currency")}
            </small>
          </span>
          <Badge tone={stockTone(onFloor)}>
            {onFloor > 0 ? t("onFloor", { count: onFloor }) : t("outOfStock")}
          </Badge>
        </div>
      </div>

      {colors.length > 1 ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {colors.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onColor(c)}
              aria-pressed={c === active}
              className={cn(
                "rounded-full border px-4 py-1.5 text-[13px] font-bold",
                "transition-all duration-200 active:scale-95",
                c === active
                  ? "border-app-sapphire bg-app-sapphire text-white shadow-md shadow-app-sapphire/20"
                  : "border-app-line text-app-dim hover:border-app-line-strong hover:bg-app-panel",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-5 border-t border-app-line pt-5">
        <SizeCurve bars={bars} onPick={onPick} />
      </div>
    </motion.div>
  );
}

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
    <div className="flex flex-col rounded-[32px] bg-app-panel/80 backdrop-blur-xl border border-app-line shadow-lg p-6 relative overflow-hidden">
      {/* Decorative gradient corner */}
      <div className="absolute -top-32 -right-32 size-64 rounded-full bg-app-sapphire/10 blur-[60px] pointer-events-none" />

      <div className="relative z-10 flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <div className="flex size-10 items-center justify-center rounded-xl bg-app-card text-app-dim">
            <ShoppingCart className="size-5" />
          </div>
          <span className="text-[14px] font-extrabold tracking-[0.15em] text-app-dim-2 uppercase">
            {t("cart")}
          </span>
        </div>
        {items > 0 && (
          <div className="flex h-8 items-center rounded-full bg-app-ink px-3 text-[13px] font-bold text-white shadow-sm">
            {items}
          </div>
        )}
      </div>

      {cart.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 opacity-50">
          <ShoppingCart className="size-16 text-app-dim-2 mb-4" />
          <p className="text-center text-[15px] font-medium text-app-dim">
            {t("cartEmpty")}
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2 mb-6 max-h-[40vh] desktop:max-h-[50vh]">
          <ul className="flex flex-col gap-3">
            <AnimatePresence>
              {cart.map((line) => (
                <motion.li
                  key={line.variant.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-3 rounded-[20px] bg-app-card border border-app-line p-4 shadow-sm hover:border-app-line-strong transition-colors group"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-bold text-app-ink">
                      {line.productName}
                    </span>
                    <span className="mt-1 block font-mono text-[11px] tracking-wider text-app-dim uppercase">
                      {[line.color, line.size].filter(Boolean).join(" · ")}
                    </span>
                  </span>

                  <span className="flex items-center gap-1.5 rounded-[14px] border border-app-line bg-app-panel/50 p-1">
                    <StepButton
                      label={t("less")}
                      onClick={() => onStep(line.variant.id, -1)}
                    >
                      <Minus className="size-3.5" />
                    </StepButton>
                    <span className="w-6 text-center font-mono text-[14px] font-bold text-app-ink">
                      {line.quantity}
                    </span>
                    <StepButton
                      label={t("more")}
                      disabled={line.quantity >= line.available}
                      onClick={() => onStep(line.variant.id, 1)}
                    >
                      <Plus className="size-3.5" />
                    </StepButton>
                  </span>

                  <span className="w-16 shrink-0 text-right font-mono text-[14px] font-bold text-app-ink">
                    {money(line.price * line.quantity)}
                  </span>

                  <button
                    type="button"
                    onClick={() => onRemove(line.variant.id)}
                    className="shrink-0 flex size-8 items-center justify-center rounded-lg text-app-dim-2 opacity-0 group-hover:opacity-100 transition-all hover:bg-app-out-soft hover:text-app-out"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>
      )}

      <div className="relative z-10 flex flex-col gap-5 border-t border-app-line pt-6">
        <div className="flex items-center justify-between gap-4">
          <label htmlFor={discountId} className="text-[13px] font-bold text-app-dim">
            {t("discount")}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-app-dim-2 text-sm font-bold">-</span>
            <input
              id={discountId}
              type="text"
              inputMode="numeric"
              value={discount}
              onChange={(event) => onDiscount(event.target.value.replace(/\D/g, ""))}
              placeholder="0"
              className="h-12 w-32 rounded-xl border border-transparent bg-app-card px-3 text-right font-mono text-[16px] font-bold text-app-ink transition-all outline-none focus:border-app-sapphire focus:shadow-[0_0_0_4px_rgba(37,99,235,0.1)]"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 bg-app-card p-2 rounded-[20px] border border-app-line">
          {PAYMENTS.map((method) => {
            const Icon = method === "CARD" ? CreditCard : method === "CASH" ? Banknote : HandCoins;
            return (
              <button
                key={method}
                type="button"
                onClick={() => onPayment(method)}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1.5 h-16 rounded-xl text-[12px] font-bold transition-all duration-200",
                  method === payment
                    ? "bg-app-panel text-app-sapphire shadow-sm"
                    : "text-app-dim hover:bg-app-panel/50 hover:text-app-ink",
                )}
              >
                {method === payment && (
                  <motion.div layoutId="payment_indicator" className="absolute inset-0 rounded-xl border-2 border-app-sapphire" transition={{ type: "spring", bounce: 0.2, duration: 0.4 }} />
                )}
                <Icon className="size-4 relative z-10" />
                <span className="relative z-10">{t(`payment.${method}`)}</span>
              </button>
            )
          })}
        </div>

        <div className="flex flex-col gap-1 pt-2">
          <span className="text-[12px] font-extrabold tracking-[0.1em] text-app-dim-2 uppercase">
            {t("toPay")}
          </span>
          <span className="font-mono text-[clamp(40px,5vw,52px)] leading-none font-extrabold tracking-tight text-app-ink">
            {money(total)}
            <small className="ml-2 text-[0.4em] font-bold text-app-dim-2">
              {t("currency")}
            </small>
          </span>
        </div>

        {error ? (
          <p className="rounded-[16px] border border-app-out/20 bg-app-out-soft px-4 py-3 text-[13.5px] font-semibold text-app-out">
            {error}
          </p>
        ) : null}
        {done ? (
          <p className="rounded-[16px] border border-app-ok/20 bg-app-ok-soft px-4 py-3 text-[13.5px] font-semibold text-app-ok">
            {done}
          </p>
        ) : null}

        <Button
          onClick={onSell}
          disabled={cart.length === 0 || saving}
          className="h-16 w-full rounded-2xl text-[18px] font-bold shadow-xl shadow-app-sapphire/20 transition-all hover:scale-[1.02] active:scale-95 disabled:scale-100 disabled:shadow-none"
        >
          {saving ? t("selling") : t("sell")}
        </Button>
      </div>
    </div>
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
      className="flex size-7 items-center justify-center rounded-[10px] bg-app-card text-app-ink shadow-sm transition-colors hover:bg-app-line hover:text-app-ink active:scale-95 disabled:pointer-events-none disabled:opacity-45"
    >
      {children}
    </button>
  );
}

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
      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="fixed inset-0 z-40 flex flex-col bg-slate-50/90 backdrop-blur-md"
          >
            <div className="flex items-center justify-between gap-4 border-b border-slate-200/50 bg-white/80 px-6 py-4 backdrop-blur-sm">
              <span className="text-[14px] font-bold text-slate-500">
                {items > 0 ? summaryLabel : emptyLabel}
              </span>
              <button
                type="button"
                onClick={onToggle}
                className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900"
              >
                <ChevronDown className="size-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 pb-24">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "fixed inset-x-4 bottom-[84px] z-30 flex items-center justify-between gap-4 rounded-2xl shadow-2xl shadow-slate-900/10",
          "border border-slate-200/50 bg-white/95 backdrop-blur-md px-6 py-4",
          "transition-all duration-300",
          open && "translate-y-24 opacity-0 pointer-events-none",
        )}
      >
        <span className="text-[14px] font-bold text-slate-500">
          {items > 0 ? summaryLabel : emptyLabel}
        </span>
        <span className="font-mono text-[24px] leading-none font-extrabold text-slate-900">
          {money(total)}
          <small className="ml-1.5 text-[0.45em] font-bold text-slate-400">
            {currency}
          </small>
        </span>
      </button>
    </div>
  );
}
