"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { AppShell, HeadStat, SectionHead } from "@/components/app/app-shell";
import {
  buildBars,
  SizeCurve,
  type CurveBar,
  type CurveMode,
} from "@/components/app/size-curve";
import { Link } from "@/i18n/navigation";
import { fetchApi } from "@/lib/apiClient";
import {
  colorsOf,
  inStore,
  inWarehouse,
  popularSizes,
  type Product,
  type ProductPage,
  type SizeDemand,
} from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { moveToFloor, receiveStock } from "@/lib/stock";

/**
 * Зал и склад — один экран, показанный с разных сторон.
 *
 * В зале главное число столбца — витрина, на складе — коробки. Действие тоже
 * зеркальное: в зале «принести не хватающее», на складе «выдать в зал» и
 * «принять поставку». Разводить это на два почти одинаковых компонента
 * значило бы чинить каждую правку дважды.
 */

interface Picked {
  bar: CurveBar;
  product: Product;
  /** Сколько единиц двигаем. Строка — поле ввода, пустое допустимо. */
  amount: string;
}

function money(value: number): string {
  return new Intl.NumberFormat("ru-RU").format(Math.round(value));
}

export function StockView({ mode }: { mode: CurveMode }) {
  const t = useTranslations("app.stock");
  const floor = mode === "store";

  const [products, setProducts] = useState<Product[] | null>(null);
  const [popular, setPopular] = useState<Set<string>>(new Set());
  const [storeName, setStoreName] = useState("");
  const [pickedColor, setPickedColor] = useState<Record<string, string>>({});

  const [picked, setPicked] = useState<Picked | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ kind: "ok" | "bad"; text: string } | null>(
    null,
  );

  /**
   * Возвращает список, а не пишет его в состояние: так вызов остаётся
   * обычным промисом и в эффекте, и после операции со складом.
   * Пустой список честнее вечной «загрузки» — экран отрисуется и скажет,
   * что товаров нет; ошибку самой операции показывает `note` ниже.
   */
  const fetchProducts = useCallback(async (): Promise<Product[]> => {
    try {
      const page: ProductPage = await fetchApi("/inventory/products?limit=50");
      return Array.isArray(page?.items) ? page.items : [];
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    fetchApi("/me")
      .then((me) => setStoreName(me?.tenant?.name ?? ""))
      .catch(() => {});

    fetchApi("/reports/size-analysis?period=month")
      .then((rows: SizeDemand[]) =>
        setPopular(popularSizes(Array.isArray(rows) ? rows : [])),
      )
      .catch(() => {});

    fetchProducts().then(setProducts);
  }, [fetchProducts]);

  const all = products ?? [];

  // Дыра в ходовом размере — то, ради чего на экран вообще заходят.
  const holes = all.reduce(
    (sum, product) =>
      sum +
      buildBars(product.variants ?? [], popular).filter((bar) => bar.alert)
        .length,
    0,
  );
  const onFloor = all.reduce(
    (sum, p) => sum + (p.variants ?? []).reduce((s, v) => s + inStore(v), 0),
    0,
  );
  const inBack = all.reduce(
    (sum, p) =>
      sum + (p.variants ?? []).reduce((s, v) => s + inWarehouse(v), 0),
    0,
  );
  const backValue = all.reduce(
    (sum, p) =>
      sum +
      (p.variants ?? []).reduce(
        (s, v) => s + inWarehouse(v) * (v.costPrice ?? 0),
        0,
      ),
    0,
  );

  async function commit(kind: "move" | "receive") {
    if (!picked) return;
    const amount = Number(picked.amount);
    if (!Number.isFinite(amount) || amount <= 0) return;

    setBusy(true);
    setNote(null);
    try {
      if (kind === "receive") {
        await receiveStock(picked.bar.variant.id, amount);
        setNote({ kind: "ok", text: t("received", { count: amount }) });
      } else {
        const result = await moveToFloor(picked.bar.variant.id, amount);
        if (result.status === "done") {
          setNote({ kind: "ok", text: t("moved", { count: amount }) });
        } else if (result.status === "stuck") {
          // Худший исход: со склада списали, в зал не добавили.
          setNote({
            kind: "bad",
            text: t("moveStuck", { count: amount, reason: result.message }),
          });
        } else {
          setNote({ kind: "bad", text: t("moveFailed") });
        }
      }
      setPicked(null);
      setProducts(await fetchProducts());
    } catch (err: unknown) {
      setNote({
        kind: "bad",
        text: err instanceof Error && err.message ? err.message : t("failed"),
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell storeName={storeName}>
      <SectionHead
        eyebrow={floor ? t("floorEyebrow") : t("warehouseEyebrow")}
        title={floor ? t("floorTitle") : t("warehouseTitle")}
      >
        <HeadStat value={String(all.length)} label={t("models")} />
        {floor ? (
          <>
            <HeadStat value={String(onFloor)} label={t("itemsOnFloor")} />
            <HeadStat
              value={String(holes)}
              label={t("holes")}
              gold={holes > 0}
            />
          </>
        ) : (
          <>
            <HeadStat value={String(inBack)} label={t("itemsInBack")} />
            <HeadStat
              value={money(backValue)}
              label={t("backValue", { currency: t("currency") })}
            />
            <Link
              href="/inventory/new"
              className="rounded-lg bg-app-gold px-4 py-2.5 text-[11.5px] font-bold tracking-[0.09em] text-on-accent uppercase shadow-[0_10px_22px_-13px_rgb(242_166_35/0.85)] transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:hover:translate-y-0"
            >
              {t("newProduct")}
            </Link>
          </>
        )}
      </SectionHead>

      <div className="flex flex-col px-5 pb-10 tablet:px-6">
        {note ? (
          <p
            role={note.kind === "bad" ? "alert" : "status"}
            className={cn(
              "mt-4 rounded-[10px] border px-4 py-3 text-sm",
              note.kind === "bad"
                ? "border-app-gold/40 bg-app-gold/10 text-app-gold"
                : "border-white/12 bg-white/5 text-app-dim",
            )}
          >
            {note.text}
          </p>
        ) : null}

        {products === null ? (
          <p className="py-8 text-sm text-app-dim">{t("loading")}</p>
        ) : all.length === 0 ? (
          <p className="py-8 text-sm text-app-dim">{t("empty")}</p>
        ) : (
          all.map((product) => {
            const colors = colorsOf(product);
            const color = pickedColor[product.id] ?? colors[0] ?? null;
            const variants = color
              ? product.variants.filter((v) => v.color === color)
              : product.variants;
            const bars = buildBars(variants, popular);
            const rowHoles = bars.filter((bar) => bar.alert);
            const isOpen = picked?.product.id === product.id;

            return (
              <div
                key={product.id}
                className="flex flex-col gap-4 border-b border-white/7 py-5 last:border-b-0"
              >
                <div className="flex flex-wrap items-center gap-x-7 gap-y-4">
                  <div className="flex min-w-[176px] flex-col gap-1">
                    <b className="text-[15.5px] font-bold tracking-[-0.014em]">
                      {product.name}
                    </b>
                    <span className="font-mono text-[11px] tracking-[0.05em] text-app-dim-2 uppercase">
                      {[
                        variants[0]?.sku,
                        color,
                        floor
                          ? null
                          : `${t("cost")} ${money(variants[0]?.costPrice ?? 0)}`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </div>

                  <SizeCurve
                    bars={bars}
                    mode={mode}
                    onPick={(bar) =>
                      setPicked({
                        bar,
                        product,
                        amount: String(
                          floor
                            ? Math.min(
                                bar.warehouse,
                                Math.max(1, bar.warehouse),
                              )
                            : 1,
                        ),
                      })
                    }
                  />

                  <div className="ml-auto flex flex-wrap items-center gap-2.5">
                    {floor && rowHoles.length === 0 ? (
                      <span className="rounded-lg border border-white/16 px-4 py-2.5 text-[11.5px] font-semibold tracking-[0.09em] text-app-dim uppercase">
                        {t("rowFine")}
                      </span>
                    ) : null}
                    {floor && rowHoles.length > 0 ? (
                      <span className="rounded-lg border border-app-gold/40 bg-app-gold/10 px-4 py-2.5 text-[11.5px] font-semibold tracking-[0.09em] text-app-gold uppercase">
                        {t("rowHoles", { count: rowHoles.length })}
                      </span>
                    ) : null}
                  </div>
                </div>

                {colors.length > 1 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {colors.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setPickedColor((prev) => ({
                            ...prev,
                            [product.id]: c,
                          }));
                          setPicked(null);
                        }}
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

                {isOpen && picked ? (
                  <div className="flex flex-wrap items-end gap-4 rounded-[10px] border border-white/12 bg-white/4 p-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-[10.5px] tracking-[0.16em] text-app-dim-2 uppercase">
                        {[picked.bar.variant.color, picked.bar.size]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                      <span className="text-[13px] text-app-dim">
                        {t("standing", {
                          store: picked.bar.store,
                          warehouse: picked.bar.warehouse,
                        })}
                      </span>
                    </div>

                    <label className="flex flex-col gap-1.5">
                      <span className="font-mono text-[10.5px] tracking-[0.16em] text-app-dim-2 uppercase">
                        {t("howMany")}
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        autoFocus
                        value={picked.amount}
                        onChange={(event) =>
                          setPicked({
                            ...picked,
                            amount: event.target.value.replace(/\D/g, ""),
                          })
                        }
                        className="w-24 rounded-lg border border-white/14 bg-white/5 px-3 py-2 text-right font-mono text-[14px] text-white tabular-nums transition-colors duration-150 outline-none focus:border-app-sapphire-lift"
                      />
                    </label>

                    <div className="flex flex-wrap gap-2.5">
                      <button
                        type="button"
                        disabled={busy || picked.bar.warehouse === 0}
                        onClick={() => commit("move")}
                        className="rounded-lg bg-app-gold px-4 py-2.5 text-[11.5px] font-bold tracking-[0.09em] text-on-accent uppercase shadow-[0_10px_22px_-13px_rgb(242_166_35/0.85)] transition-opacity duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:pointer-events-none disabled:opacity-45"
                      >
                        {busy ? t("working") : t("moveToFloor")}
                      </button>

                      {!floor ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => commit("receive")}
                          className="rounded-lg border border-white/16 px-4 py-2.5 text-[11.5px] font-semibold tracking-[0.09em] text-app-dim uppercase transition-colors duration-150 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-sapphire-lift disabled:pointer-events-none disabled:opacity-45"
                        >
                          {t("receive")}
                        </button>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => setPicked(null)}
                        className="rounded-lg px-3 py-2.5 text-[11.5px] font-semibold tracking-[0.09em] text-app-dim-2 uppercase transition-colors duration-150 hover:text-app-dim focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-sapphire-lift"
                      >
                        {t("cancel")}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </AppShell>
  );
}
