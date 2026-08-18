"use client";

import { PackagePlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { AppShell } from "@/components/app/app-shell";
import {
  buildBars,
  type CurveBar,
  type CurveMode,
  SizeCurve,
} from "@/components/app/size-curve";
import { Badge, stockTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyBlock } from "@/components/ui/empty";
import { ListSkeleton } from "@/components/ui/skeleton";
import { DataCard, PageHead, SubStat } from "@/components/ui/stat";
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
import { count, initial, money, toneOf } from "@/lib/format";
import { useAppSession } from "@/lib/session";
import { moveToFloor, receiveStock } from "@/lib/stock";

/**
 * Зал и склад — один экран, показанный с разных сторон.
 *
 * В зале главное число столбца — витрина, на складе — коробки. Действие
 * тоже зеркальное: в зале «принести не хватающее», на складе «выдать в
 * зал» и «принять поставку». Разводить это на два почти одинаковых
 * компонента значило бы чинить каждую правку дважды.
 *
 * Этап 19: список стал карточками с плиткой и значком состояния. Строка
 * таблицы заставляет читать число, чтобы понять, всё ли в порядке;
 * значок отвечает на этот вопрос цветом, до чтения.
 */

interface Picked {
  bar: CurveBar;
  product: Product;
  /** Сколько единиц двигаем. Строка — поле ввода, пустое допустимо. */
  amount: string;
}

export function StockView({ mode }: { mode: CurveMode }) {
  const t = useTranslations("app.stock");
  const session = useAppSession();
  const floor = mode === "store";

  const [products, setProducts] = useState<Product[] | null>(null);
  const [popular, setPopular] = useState<Set<string>>(new Set());
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
    <AppShell session={session}>
      <div className="mx-auto flex w-full max-w-[1040px] flex-col gap-6">
        <PageHead
          eyebrow={floor ? t("floorEyebrow") : t("warehouseEyebrow")}
          title={floor ? t("floorTitle") : t("warehouseTitle")}
        >
          {!floor ? (
            <Button href="/inventory/new" size="md">
              <PackagePlus className="size-4.5" aria-hidden />
              {t("newProduct")}
            </Button>
          ) : null}
        </PageHead>

        <DataCard className="flex flex-wrap gap-x-10 gap-y-6 p-6 tablet:p-7">
          <SubStat label={t("models")} value={count(all.length)} />
          {floor ? (
            <>
              <SubStat label={t("itemsOnFloor")} value={count(onFloor)} />
              <SubStat
                label={t("holes")}
                value={count(holes)}
                tone={holes > 0 ? "low" : "ok"}
              />
            </>
          ) : (
            <>
              <SubStat label={t("itemsInBack")} value={count(inBack)} />
              <SubStat
                label={t("backValue", { currency: t("currency") })}
                value={money(backValue)}
              />
            </>
          )}
        </DataCard>

        {note ? (
          <p
            role={note.kind === "bad" ? "alert" : "status"}
            className={cn(
              "rounded-card px-4 py-3.5 text-[13.5px] leading-snug font-semibold",
              note.kind === "bad"
                ? "bg-app-out-soft text-app-out"
                : "bg-app-ok-soft text-app-ok",
            )}
          >
            {note.text}
          </p>
        ) : null}

        {products === null ? (
          <ListSkeleton rows={5} />
        ) : all.length === 0 ? (
          <EmptyBlock
            art="box"
            title={t("emptyHeading")}
            lead={t("empty")}
            action={
              <Button href="/inventory/new" size="xl">
                <PackagePlus className="size-5" aria-hidden />
                {t("newProduct")}
              </Button>
            }
          />
        ) : (
          <div className="flex flex-col gap-3">
            {all.map((product) => {
              const colors = colorsOf(product);
              const color = pickedColor[product.id] ?? colors[0] ?? null;
              const variants = color
                ? product.variants.filter((v) => v.color === color)
                : product.variants;
              const bars = buildBars(variants, popular);
              const rowHoles = bars.filter((bar) => bar.alert);
              const lead = bars.reduce(
                (sum, bar) => sum + (floor ? bar.store : bar.warehouse),
                0,
              );
              const isOpen = picked?.product.id === product.id;

              return (
                <DataCard key={product.id} className="p-4 tablet:p-5">
                  <div className="flex items-start gap-4">
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
                        {[
                          variants[0]?.sku,
                          color,
                          floor
                            ? null
                            : `${t("cost")} ${money(variants[0]?.costPrice ?? 0)}`,
                        ]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </span>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <span className="font-mono text-[18px] leading-none font-bold text-app-ink tabular-nums">
                        {count(lead)}
                      </span>
                      {floor && rowHoles.length > 0 ? (
                        <Badge tone="gold">
                          {t("rowHoles", { count: rowHoles.length })}
                        </Badge>
                      ) : (
                        <Badge tone={stockTone(lead)}>
                          {lead > 0
                            ? floor
                              ? t("rowFine")
                              : t("inStock")
                            : t("outOfStock")}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {colors.length > 1 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
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
                            "rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold",
                            "transition-[background-color,border-color,color] duration-150",
                            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-sapphire",
                            c === color
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
                    <SizeCurve
                      bars={bars}
                      mode={mode}
                      onPick={(bar) =>
                        setPicked({
                          bar,
                          product,
                          amount: String(
                            floor ? Math.max(1, bar.warehouse) : 1,
                          ),
                        })
                      }
                    />
                  </div>

                  {isOpen && picked ? (
                    <MovePanel
                      picked={picked}
                      floor={floor}
                      busy={busy}
                      onAmount={(amount) => setPicked({ ...picked, amount })}
                      onMove={() => commit("move")}
                      onReceive={() => commit("receive")}
                      onCancel={() => setPicked(null)}
                    />
                  ) : null}
                </DataCard>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}

/**
 * Панель перевода. Открывается по конкретному столбцу — «вынести всё»
 * звучало бы удобно, но магазин так не работает: из шести штук выносят
 * две (решение 17.6.2).
 */
function MovePanel({
  picked,
  floor,
  busy,
  onAmount,
  onMove,
  onReceive,
  onCancel,
}: {
  picked: Picked;
  floor: boolean;
  busy: boolean;
  onAmount: (value: string) => void;
  onMove: () => void;
  onReceive: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations("app.stock");

  return (
    <div className="mt-4 flex flex-wrap items-end gap-4 rounded-card border border-app-line bg-app-panel p-4">
      <div className="flex flex-col gap-1">
        <span className="font-mono text-[11px] tracking-[0.14em] text-app-dim-2 uppercase">
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
        <span className="font-mono text-[11px] tracking-[0.14em] text-app-dim-2 uppercase">
          {t("howMany")}
        </span>
        <input
          type="text"
          inputMode="numeric"
          autoFocus
          value={picked.amount}
          onChange={(event) => onAmount(event.target.value.replace(/\D/g, ""))}
          className="h-11 w-24 rounded-card border-[1.5px] border-app-line-strong bg-app-card px-3 text-right font-mono text-[15px] font-bold text-app-ink tabular-nums transition-[border-color,box-shadow] duration-150 outline-none focus:border-app-sapphire focus:shadow-[0_0_0_4px_rgb(15_82_186/0.10)]"
        />
      </label>

      <div className="flex flex-wrap gap-2.5">
        <Button
          variant="sapphire"
          size="md"
          disabled={busy || picked.bar.warehouse === 0}
          onClick={onMove}
        >
          {busy ? t("working") : t("moveToFloor")}
        </Button>

        {!floor ? (
          <Button variant="quiet" size="md" disabled={busy} onClick={onReceive}>
            {t("receive")}
          </Button>
        ) : null}

        <Button variant="ghost" size="md" onClick={onCancel}>
          {t("cancel")}
        </Button>
      </div>
    </div>
  );
}
