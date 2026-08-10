"use client";

import {
  ArrowRight,
  Minus,
  Plus,
  Search,
  Store,
  Warehouse,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { EmptyBlock } from "@/components/ui/empty";
import { MockNotice } from "@/components/ui/mock-notice";
import { ListSkeleton } from "@/components/ui/skeleton";
import { DataCard, Eyebrow, PageHead } from "@/components/ui/stat";
import {
  createTransfer,
  fetchLocationSummary,
  fetchTransferCatalog,
  type LocationSummary,
  type TransferProduct,
} from "@/lib/api/stock-ops";
import { cn } from "@/lib/cn";
import { count } from "@/lib/format";

/**
 * Перемещение со склада в торговый зал (Э-11).
 *
 * Корзина перемещения справа — та же идея, что чек на кассе: человек
 * набирает несколько позиций и проводит их одним документом. По одной
 * вещи за раз кладовщик выносит десять коробок и делает десять записей.
 */

type CartLine = {
  productId: string;
  productName: string;
  size: string;
  quantity: number;
  available: number;
};

export function TransferView() {
  const t = useTranslations("app.transfer");
  const [summary, setSummary] = useState<LocationSummary | null>(null);
  const [catalog, setCatalog] = useState<TransferProduct[] | null>(null);
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [saving, setSaving] = useState(false);
  const [movedUnits, setMovedUnits] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    fetchLocationSummary()
      .then((data) => alive && setSummary(data))
      .catch(() => {});
    fetchTransferCatalog()
      .then((data) => alive && setCatalog(data))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  function addLine(product: TransferProduct, size: string, available: number) {
    setMovedUnits(null);
    setCart((prev) => {
      const existing = prev.find(
        (line) => line.productId === product.id && line.size === size,
      );
      if (existing) {
        // Повторное нажатие прибавляет единицу, а не создаёт вторую строку:
        // иначе в корзине окажется три «M» и их придётся складывать глазами.
        return prev.map((line) =>
          line === existing
            ? {
                ...line,
                quantity: Math.min(line.available, line.quantity + 1),
              }
            : line,
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          size,
          quantity: 1,
          available,
        },
      ];
    });
  }

  function setQuantity(index: number, value: number) {
    setCart((prev) =>
      prev.map((line, i) =>
        i === index
          ? { ...line, quantity: Math.min(line.available, Math.max(1, value)) }
          : line,
      ),
    );
  }

  const totalUnits = cart.reduce((sum, line) => sum + line.quantity, 0);

  const visible = (catalog ?? []).filter((product) => {
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    return (
      product.name.toLowerCase().includes(needle) ||
      product.sku.toLowerCase().includes(needle)
    );
  });

  async function handleConfirm() {
    setSaving(true);
    const result = await createTransfer({
      from: "warehouse",
      to: "floor",
      items: cart.map((line) => ({
        productId: line.productId,
        size: line.size,
        quantity: line.quantity,
      })),
    });
    setSaving(false);
    setMovedUnits(result.movedUnits);
    setCart([]);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHead eyebrow={t("eyebrow")} title={t("title")} />
      <MockNotice text={t("mock")} />

      {/* ── Откуда и куда ───────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-4">
        <LocationCard
          icon={<Warehouse className="size-5" aria-hidden />}
          label={t("from")}
          name={t("warehouse")}
          value={summary?.warehouse}
        />
        <ArrowRight className="size-6 shrink-0 text-app-dim-2" aria-hidden />
        <LocationCard
          icon={<Store className="size-5" aria-hidden />}
          label={t("to")}
          name={t("floor")}
          value={summary?.floor}
        />
      </div>

      <div className="grid gap-5 desktop:grid-cols-[1fr_340px]">
        {/* ── Каталог ───────────────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-2.5 rounded-card border border-app-line bg-app-card px-3.5 py-2.5">
            <Search className="size-4 shrink-0 text-app-dim-2" aria-hidden />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchPlaceholder")}
              className="min-w-0 flex-1 bg-transparent text-[14px] font-medium text-app-ink outline-none placeholder:text-app-dim-2"
            />
          </label>

          {!catalog ? (
            <ListSkeleton rows={3} />
          ) : (
            visible.map((product) => (
              <DataCard key={product.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-extrabold text-app-ink">
                      {product.name}
                    </p>
                    <p className="mt-0.5 font-mono text-[12.5px] text-app-dim num">
                      {product.sku}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size.size}
                      type="button"
                      disabled={size.available === 0}
                      onClick={() =>
                        addLine(product, size.size, size.available)
                      }
                      className={cn(
                        "flex flex-col items-center gap-0.5 rounded-card border px-3.5 py-2",
                        "transition-[border-color,background-color] duration-150",
                        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-sapphire",
                        "disabled:opacity-40",
                        "border-app-line-strong bg-app-card hover:border-app-sapphire hover:bg-app-sapphire-soft",
                      )}
                    >
                      <span className="text-[13px] font-extrabold text-app-ink">
                        {size.size}
                      </span>
                      <span className="font-mono text-[11.5px] font-bold text-app-dim num">
                        {size.available}
                      </span>
                    </button>
                  ))}
                </div>
              </DataCard>
            ))
          )}
        </div>

        {/* ── Корзина перемещения ───────────────────────────────── */}
        <div className="flex h-fit flex-col gap-3 rounded-frame border border-app-line bg-app-card p-5">
          <h2 className="text-[17px] font-extrabold tracking-[-0.015em] text-app-ink">
            {t("cart")}
          </h2>

          {cart.length === 0 ? (
            movedUnits !== null ? (
              <p
                role="status"
                className="text-[13.5px] font-semibold text-app-ok"
              >
                {t("moved", { count: movedUnits })}
              </p>
            ) : (
              <p className="text-[13.5px] leading-snug text-app-dim">
                {t("cartEmpty")}
              </p>
            )
          ) : (
            <>
              <ul className="flex flex-col gap-2">
                {cart.map((line, index) => (
                  <li
                    key={`${line.productId}:${line.size}`}
                    className="flex items-center gap-3 rounded-card bg-app-panel px-3 py-2.5"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-bold text-app-ink">
                        {line.productName}
                      </span>
                      <span className="text-[12px] font-semibold text-app-dim">
                        {t("size")} {line.size}
                      </span>
                    </span>

                    <span className="flex shrink-0 items-center gap-1">
                      <Step
                        label={t("less")}
                        onClick={() => setQuantity(index, line.quantity - 1)}
                      >
                        <Minus className="size-3.5" aria-hidden />
                      </Step>
                      <span className="w-7 text-center font-mono text-[14px] font-extrabold text-app-ink num">
                        {line.quantity}
                      </span>
                      <Step
                        label={t("more")}
                        onClick={() => setQuantity(index, line.quantity + 1)}
                      >
                        <Plus className="size-3.5" aria-hidden />
                      </Step>
                    </span>

                    <button
                      type="button"
                      aria-label={t("remove")}
                      onClick={() =>
                        setCart((prev) => prev.filter((_, i) => i !== index))
                      }
                      className="flex size-7 shrink-0 items-center justify-center rounded-full text-app-dim-2 transition-colors duration-150 hover:bg-app-out-soft hover:text-app-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-out"
                    >
                      <X className="size-3.5" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>

              <p className="flex items-baseline justify-between border-t border-app-line pt-3">
                <Eyebrow>{t("totalUnits")}</Eyebrow>
                <span className="font-mono text-[19px] font-extrabold text-app-ink num">
                  {count(totalUnits)}
                </span>
              </p>

              <Button
                type="button"
                size="lg"
                disabled={saving}
                onClick={handleConfirm}
              >
                {saving ? t("moving") : t("confirm")}
              </Button>
            </>
          )}
        </div>
      </div>

      {catalog && visible.length === 0 ? (
        <EmptyBlock
          art="search"
          title={t("nothingTitle")}
          lead={t("nothingLead")}
        />
      ) : null}
    </div>
  );
}

function LocationCard({
  icon,
  label,
  name,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  name: string;
  value: number | undefined;
}) {
  const t = useTranslations("app.transfer");

  return (
    <DataCard className="min-w-[200px] flex-1 p-5">
      <Eyebrow>{label}</Eyebrow>
      <p className="mt-2 flex items-center gap-2.5 text-[15px] font-extrabold text-app-ink">
        <span className="text-app-sapphire">{icon}</span>
        {name}
      </p>
      <p className="mt-3 font-mono text-[26px] leading-none font-extrabold text-app-ink num">
        {count(value)}
        <small className="ml-1.5 text-[0.45em] font-bold text-app-dim">
          {t("units")}
        </small>
      </p>
    </DataCard>
  );
}

function Step({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-7 items-center justify-center rounded-full bg-app-card text-app-dim transition-colors duration-150 hover:text-app-sapphire focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-sapphire"
    >
      {children}
    </button>
  );
}
