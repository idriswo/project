"use client";

import { useTranslations } from "next-intl";
import { useId, useState } from "react";

import { AppShell, SectionHead } from "@/components/app/app-shell";
import { useRouter } from "@/i18n/navigation";
import { fetchApi } from "@/lib/apiClient";
import { cn } from "@/lib/cn";
import { compareSizes } from "@/lib/sizes";

/**
 * Новый товар.
 *
 * Форма спрашивает не «вариант за вариантом», а так же, как товар устроен
 * в голове у владельца: отмечаешь размеры, добавляешь цвета — и заполняешь
 * получившуюся сетку. Это тот же инструмент, что и кривая на рабочих
 * экранах, поэтому заводить товар и смотреть остатки ощущается одинаково.
 *
 * `POST /inventory/products` принимает массив `variants` целиком, так что
 * весь товар со всеми размерами уезжает одним запросом.
 */

const LETTER_PRESET = ["XS", "S", "M", "L", "XL", "XXL"];
const NUMERIC_PRESET = ["38", "40", "42", "44", "46", "48"];

type Where = "store" | "warehouse";

function digits(value: string): string {
  return value.replace(/\D/g, "");
}

export function NewProductForm() {
  const t = useTranslations("app.newProduct");
  const router = useRouter();

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");

  const [sizes, setSizes] = useState<string[]>([]);
  const [customSize, setCustomSize] = useState("");
  const [colors, setColors] = useState<string[]>([]);
  const [customColor, setCustomColor] = useState("");
  const [where, setWhere] = useState<Where>("warehouse");

  /** Ключ клетки — `цвет|размер`. */
  const [grid, setGrid] = useState<Record<string, string>>({});

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameId = useId();
  const brandId = useId();
  const skuId = useId();
  const priceId = useId();
  const costId = useId();

  const ordered = [...sizes].sort(compareSizes);
  const rows = colors.length > 0 ? colors : [""];

  function toggleSize(size: string) {
    setSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size],
    );
  }

  function addCustomSize() {
    const value = customSize.trim();
    if (!value || sizes.includes(value)) return;
    setSizes((prev) => [...prev, value]);
    setCustomSize("");
  }

  function addColor() {
    const value = customColor.trim();
    if (!value || colors.includes(value)) return;
    setColors((prev) => [...prev, value]);
    setCustomColor("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (name.trim().length < 2) return setError(t("errors.name"));
    if (!price.trim()) return setError(t("errors.price"));
    if (ordered.length === 0) return setError(t("errors.sizes"));

    // В запрос уходят только заполненные клетки: пустая клетка означает
    // «такого сочетания не завозили», а не «завезли ноль штук».
    const variants = rows.flatMap((color) =>
      ordered
        .map((size) => {
          const quantity = Number(grid[`${color}|${size}`] || 0);
          if (quantity <= 0) return null;
          return {
            size,
            ...(color ? { color } : {}),
            ...(sku.trim() ? { sku: `${sku.trim()}-${size}` } : {}),
            price: Number(price),
            costPrice: Number(cost) || 0,
            quantityStore: where === "store" ? quantity : 0,
            quantityWarehouse: where === "warehouse" ? quantity : 0,
          };
        })
        .filter(Boolean),
    );

    if (variants.length === 0) return setError(t("errors.empty"));

    setSaving(true);
    try {
      await fetchApi("/inventory/products", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          ...(brand.trim() ? { brand: brand.trim() } : {}),
          variants,
        }),
      });
      router.push(where === "store" ? "/floor" : "/warehouse");
    } catch (err: unknown) {
      setError(
        err instanceof Error && err.message ? err.message : t("errors.generic"),
      );
      setSaving(false);
    }
  }

  const field =
    "w-full rounded-lg border border-white/14 bg-white/5 px-3.5 py-2.5 text-[15px] text-white outline-none transition-colors duration-150 placeholder:text-app-dim-2 focus:border-app-sapphire-lift";
  const label =
    "font-mono text-[10.5px] tracking-[0.16em] text-app-dim-2 uppercase";

  return (
    <AppShell>
      <SectionHead eyebrow={t("eyebrow")} title={t("title")} />

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-8 px-5 pt-6 pb-14 tablet:px-6"
      >
        {/* ── Что за вещь ─────────────────────────────── */}
        <div className="grid gap-4 tablet:grid-cols-2 desktop:grid-cols-4">
          <label className="flex flex-col gap-1.5 tablet:col-span-2">
            <span className={label}>{t("name")}</span>
            <input
              id={nameId}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("namePlaceholder")}
              className={field}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={label}>{t("brand")}</span>
            <input
              id={brandId}
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className={field}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={label}>{t("sku")}</span>
            <input
              id={skuId}
              value={sku}
              onChange={(e) => setSku(e.target.value.toUpperCase())}
              placeholder="KRT-24"
              className={cn(field, "font-mono")}
            />
          </label>
        </div>

        <div className="grid gap-4 tablet:grid-cols-2 desktop:grid-cols-4">
          <label className="flex flex-col gap-1.5">
            <span className={label}>{t("price")}</span>
            <input
              id={priceId}
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(digits(e.target.value))}
              placeholder="450"
              className={cn(field, "font-mono tabular-nums")}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={label}>{t("cost")}</span>
            <input
              id={costId}
              inputMode="numeric"
              value={cost}
              onChange={(e) => setCost(digits(e.target.value))}
              placeholder="310"
              className={cn(field, "font-mono tabular-nums")}
            />
          </label>
        </div>

        {/* ── Размеры ─────────────────────────────────── */}
        <fieldset className="flex flex-col gap-3">
          <legend className={label}>{t("sizes")}</legend>
          <div className="flex flex-wrap gap-1.5">
            {[...LETTER_PRESET, ...NUMERIC_PRESET].map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => toggleSize(size)}
                aria-pressed={sizes.includes(size)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 font-mono text-[12.5px] transition-colors duration-150",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-sapphire-lift",
                  sizes.includes(size)
                    ? "border-white/50 bg-white/8 text-white"
                    : "border-white/13 text-app-dim hover:text-white",
                )}
              >
                {size}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              value={customSize}
              onChange={(e) => setCustomSize(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomSize();
                }
              }}
              placeholder={t("customSize")}
              className={cn(field, "w-40 font-mono")}
            />
            <button
              type="button"
              onClick={addCustomSize}
              className="rounded-lg border border-white/16 px-4 text-[12px] font-semibold tracking-[0.09em] text-app-dim uppercase transition-colors duration-150 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-sapphire-lift"
            >
              {t("add")}
            </button>
          </div>
        </fieldset>

        {/* ── Цвета ───────────────────────────────────── */}
        <fieldset className="flex flex-col gap-3">
          <legend className={label}>{t("colors")}</legend>
          {colors.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() =>
                    setColors((prev) => prev.filter((c) => c !== color))
                  }
                  className="flex items-center gap-2 rounded-full border border-white/50 bg-white/8 px-3.5 py-1.5 text-[12.5px] text-white transition-colors duration-150 hover:border-app-gold/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-sapphire-lift"
                >
                  {color}
                  <span aria-hidden className="text-app-dim">
                    ×
                  </span>
                  <span className="sr-only">{t("removeColor")}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-app-dim-2">{t("noColors")}</p>
          )}
          <div className="flex flex-wrap gap-2">
            <input
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addColor();
                }
              }}
              placeholder={t("colorPlaceholder")}
              className={cn(field, "w-48")}
            />
            <button
              type="button"
              onClick={addColor}
              className="rounded-lg border border-white/16 px-4 text-[12px] font-semibold tracking-[0.09em] text-app-dim uppercase transition-colors duration-150 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-sapphire-lift"
            >
              {t("add")}
            </button>
          </div>
        </fieldset>

        {/* ── Куда кладём ─────────────────────────────── */}
        <fieldset className="flex flex-col gap-3">
          <legend className={label}>{t("where")}</legend>
          <div className="flex flex-wrap gap-5">
            {(["warehouse", "store"] as Where[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setWhere(option)}
                aria-pressed={where === option}
                className={cn(
                  "pb-1 text-[12px] tracking-[0.1em] uppercase transition-colors duration-150",
                  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-app-sapphire-lift",
                  where === option
                    ? "border-b-[1.5px] border-app-gold font-semibold text-white"
                    : "text-app-dim-2 hover:text-app-dim",
                )}
              >
                {t(`whereOption.${option}`)}
              </button>
            ))}
          </div>
        </fieldset>

        {/* ── Сетка ───────────────────────────────────── */}
        {ordered.length > 0 ? (
          <div className="flex flex-col gap-3">
            <span className={label}>{t("grid")}</span>
            <div className="overflow-x-auto">
              <table className="border-separate border-spacing-1.5">
                <thead>
                  <tr>
                    <th />
                    {ordered.map((size) => (
                      <th
                        key={size}
                        scope="col"
                        className="px-1 pb-1 font-mono text-[11.5px] font-semibold text-app-dim"
                      >
                        {size}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((color) => (
                    <tr key={color || "plain"}>
                      <th
                        scope="row"
                        className="pr-3 text-right text-[13px] font-semibold whitespace-nowrap text-app-dim"
                      >
                        {color || t("noColorRow")}
                      </th>
                      {ordered.map((size) => {
                        const key = `${color}|${size}`;
                        return (
                          <td key={size}>
                            <input
                              inputMode="numeric"
                              value={grid[key] ?? ""}
                              onChange={(e) =>
                                setGrid((prev) => ({
                                  ...prev,
                                  [key]: digits(e.target.value),
                                }))
                              }
                              aria-label={`${color || t("noColorRow")} ${size}`}
                              placeholder="0"
                              className="h-11 w-14 rounded-lg border border-white/14 bg-white/5 text-center font-mono text-[14px] text-white tabular-nums transition-colors duration-150 outline-none placeholder:text-app-dim-2 focus:border-app-sapphire-lift"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[13px] text-app-dim-2">{t("gridHint")}</p>
          </div>
        ) : null}

        {error ? (
          <p role="alert" className="text-sm text-app-gold">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-[10px] bg-app-gold px-6 py-3.5 text-[13px] font-extrabold tracking-[0.1em] text-on-accent uppercase shadow-[0_12px_26px_-14px_rgb(242_166_35/0.85)] transition-[opacity,transform] duration-150 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:pointer-events-none disabled:opacity-45 motion-reduce:hover:translate-y-0"
          >
            {saving ? t("saving") : t("save")}
          </button>
        </div>
      </form>
    </AppShell>
  );
}
