"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useId, useMemo, useState } from "react";

import { AppShell } from "@/components/app/app-shell";
import {
  buildBars,
  SizeCurve,
  type CurveBar,
} from "@/components/app/size-curve";
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

function money(value: number): string {
  return new Intl.NumberFormat("ru-RU").format(Math.round(value));
}

/**
 * Касса. Тап по столбцу кривой кладёт размер в чек.
 *
 * Продажа идёт по варианту (размер + цвет), потому что так устроен
 * `POST /sales` — товар целиком продать нельзя, и это правильно: в
 * магазине одежды продаётся конкретная вещь конкретного размера.
 */
export function PosView() {
  const t = useTranslations("app.pos");

  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[] | null>(null);
  const [popular, setPopular] = useState<Set<string>>(new Set());
  const [storeName, setStoreName] = useState("");
  const [pickedColor, setPickedColor] = useState<Record<string, string>>({});

  const [cart, setCart] = useState<CartLine[]>([]);
  const [discount, setDiscount] = useState("");
  const [payment, setPayment] = useState<Payment>("CASH");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const searchId = useId();
  const discountId = useId();

  useEffect(() => {
    fetchApi("/me")
      .then((me) => setStoreName(me?.tenant?.name ?? ""))
      .catch(() => {});

    // Ходовые размеры решают, где кривой загораться золотом. Если отчёт
    // не пришёл, золота просто не будет — подсветка без данных врала бы.
    fetchApi("/reports/size-analysis?period=month")
      .then((rows: SizeDemand[]) =>
        setPopular(popularSizes(Array.isArray(rows) ? rows : [])),
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(
      () => {
        const search = query.trim();
        fetchApi(
          `/inventory/products?limit=20${search ? `&search=${encodeURIComponent(search)}` : ""}`,
        )
          .then((page: ProductPage) => {
            if (!cancelled)
              setProducts(Array.isArray(page?.items) ? page.items : []);
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
  }, [query]);

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

  const subtotal = useMemo(
    () => cart.reduce((sum, line) => sum + line.price * line.quantity, 0),
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

      // Остатки изменились — перечитываем, иначе кривая покажет проданное.
      const search = query.trim();
      const page: ProductPage = await fetchApi(
        `/inventory/products?limit=20${search ? `&search=${encodeURIComponent(search)}` : ""}`,
      );
      setProducts(Array.isArray(page?.items) ? page.items : []);
    } catch (err: unknown) {
      setError(
        err instanceof Error && err.message ? err.message : t("saveFailed"),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell storeName={storeName}>
      <div className="grid grid-cols-[minmax(0,1fr)] desktop:grid-cols-[minmax(0,1.5fr)_minmax(0,0.95fr)]">
        {/* ── Каталог ─────────────────────────────────────── */}
        <div className="flex flex-col gap-5 border-b border-white/8 p-5 tablet:p-6 desktop:border-r desktop:border-b-0">
          <div>
            <label htmlFor={searchId} className="sr-only">
              {t("searchLabel")}
            </label>
            <input
              id={searchId}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full border-b-[1.5px] border-white/14 bg-transparent py-3 text-[15px] text-white transition-colors duration-150 outline-none placeholder:text-app-dim-2 focus:border-app-sapphire-lift"
            />
          </div>

          {products === null ? (
            <p className="text-sm text-app-dim">{t("loading")}</p>
          ) : products.length === 0 ? (
            <p className="text-sm text-app-dim">
              {query ? t("nothingFound") : t("noProducts")}
            </p>
          ) : (
            <div className="flex flex-col gap-6">
              {products.map((product) => {
                const colors = colorsOf(product);
                const color = pickedColor[product.id] ?? colors[0] ?? null;
                const variants = color
                  ? product.variants.filter((v) => v.color === color)
                  : product.variants;
                const bars = buildBars(variants, popular);
                const price =
                  variants[0]?.price ?? product.variants[0]?.price ?? 0;

                return (
                  <div key={product.id} className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-end justify-between gap-x-5 gap-y-2">
                      <div className="flex flex-col gap-1">
                        <b className="text-[17px] font-bold tracking-[-0.016em]">
                          {product.name}
                        </b>
                        <span className="font-mono text-[11.5px] tracking-[0.05em] text-app-dim-2 uppercase">
                          {[product.variants[0]?.sku, color]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </div>
                      <span className="font-mono text-[19px] font-bold tracking-[-0.01em] tabular-nums">
                        {money(price)} {t("currency")}
                      </span>
                    </div>

                    {colors.length > 1 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {colors.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() =>
                              setPickedColor((prev) => ({
                                ...prev,
                                [product.id]: c,
                              }))
                            }
                            aria-pressed={c === color}
                            className={cn(
                              "rounded-full border px-3 py-1.5 text-[12px] transition-colors duration-150",
                              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-sapphire-lift",
                              c === color
                                ? "border-white/50 bg-white/7 text-white"
                                : "border-white/13 text-app-dim hover:text-white",
                            )}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    ) : null}

                    <SizeCurve
                      bars={bars}
                      onPick={(bar) => addToCart(product, bar)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Чек ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 p-5 tablet:p-6">
          <span className="font-mono text-[10.5px] tracking-[0.2em] text-app-dim-2 uppercase">
            {t("cart")}
          </span>

          {cart.length === 0 ? (
            <p className="text-sm text-app-dim">{t("cartEmpty")}</p>
          ) : (
            <div>
              {cart.map((line) => (
                <div
                  key={line.variant.id}
                  className="flex items-center justify-between gap-3.5 border-b border-white/7 py-2.5"
                >
                  <span className="min-w-0 flex-1 text-[13.5px] leading-tight">
                    <span className="block truncate">{line.productName}</span>
                    <span className="mt-0.5 block font-mono text-[11px] tracking-[0.05em] text-app-dim-2 uppercase">
                      {[line.color, line.size].filter(Boolean).join(" · ")}
                    </span>
                  </span>

                  <span className="flex shrink-0 items-center gap-2 font-mono text-[13px]">
                    <button
                      type="button"
                      onClick={() => step(line.variant.id, -1)}
                      aria-label={t("less")}
                      className="flex size-6 items-center justify-center rounded-md border border-white/16 text-app-dim transition-colors duration-150 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-sapphire-lift"
                    >
                      −
                    </button>
                    <span className="w-4 text-center tabular-nums">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => step(line.variant.id, 1)}
                      disabled={line.quantity >= line.available}
                      aria-label={t("more")}
                      className="flex size-6 items-center justify-center rounded-md border border-white/16 text-app-dim transition-colors duration-150 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-sapphire-lift disabled:opacity-40"
                    >
                      +
                    </button>
                  </span>

                  <span className="w-14 shrink-0 text-right font-mono text-[13.5px] tabular-nums">
                    {money(line.price * line.quantity)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            <label htmlFor={discountId} className="text-[13px] text-app-dim">
              {t("discount")}
            </label>
            <input
              id={discountId}
              type="text"
              inputMode="numeric"
              value={discount}
              onChange={(event) =>
                setDiscount(event.target.value.replace(/\D/g, ""))
              }
              placeholder="0"
              className="w-24 rounded-lg border border-white/14 bg-white/5 px-3 py-2 text-right font-mono text-[13.5px] text-white tabular-nums transition-colors duration-150 outline-none placeholder:text-app-dim-2 focus:border-app-sapphire-lift"
            />
          </div>

          <div className="flex flex-col gap-0.5 pt-1.5">
            <span className="font-mono text-[10.5px] tracking-[0.2em] text-app-dim-2 uppercase">
              {t("toPay")}
            </span>
            <span className="font-mono text-[clamp(34px,5vw,46px)] leading-none font-bold tracking-[-0.04em] tabular-nums">
              {money(total)}
              <small className="ml-1.5 text-[0.42em] font-semibold tracking-[0.06em] text-app-dim">
                {t("currency")}
              </small>
            </span>
          </div>

          <div className="flex flex-wrap gap-5">
            {PAYMENTS.map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setPayment(method)}
                aria-pressed={method === payment}
                className={cn(
                  "pb-1 text-[12px] tracking-[0.1em] uppercase transition-colors duration-150",
                  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-app-sapphire-lift",
                  method === payment
                    ? "border-b-[1.5px] border-app-gold font-semibold text-white"
                    : "text-app-dim-2 hover:text-app-dim",
                )}
              >
                {t(`payment.${method}`)}
              </button>
            ))}
          </div>

          {error ? (
            <p role="alert" className="text-sm text-app-gold">
              {error}
            </p>
          ) : null}
          {done ? (
            <p role="status" className="text-sm text-app-dim">
              {done}
            </p>
          ) : null}

          <button
            type="button"
            onClick={handleSell}
            disabled={cart.length === 0 || saving}
            className="rounded-[10px] bg-app-gold px-4 py-4 text-[14px] font-extrabold tracking-[0.1em] text-on-accent uppercase shadow-[0_12px_26px_-14px_rgb(242_166_35/0.85)] transition-[opacity,transform] duration-150 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:pointer-events-none disabled:opacity-45 motion-reduce:hover:translate-y-0"
          >
            {saving ? t("selling") : t("sell")}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
