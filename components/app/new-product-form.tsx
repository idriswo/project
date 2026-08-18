"use client";

import { Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { AppShell } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";
import { Field, FormSection, TextInput } from "@/components/ui/field";
import { PageHead } from "@/components/ui/stat";
import { Toggle } from "@/components/ui/toggle";
import { useRouter } from "@/i18n/navigation";
import { fetchApi } from "@/lib/apiClient";
import { cn } from "@/lib/cn";
import { NO_VALUE } from "@/lib/format";
import { useAppSession } from "@/lib/session";
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
 *
 * Этап 19: форма разбита на четыре пронумерованных блока. Одним списком
 * из двадцати полей она читалась как анкета — человек не понимал, где
 * конец, и бросал на середине.
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
  const session = useAppSession();

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

  /** После сохранения сразу уйти на печать ценников (макет Э-01, вариант 2). */
  const [printLabels, setPrintLabels] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Маржа от розничной цены, а не наценка от закупки: владельца
   * интересует, какая доля чека остаётся ему. Пока цена или закуп
   * пустые, считать нечего — показываем прочерк, а не «0.0%».
   */
  const marginText = (() => {
    const retail = Number(price);
    const purchase = Number(cost);
    if (!retail || !purchase) return NO_VALUE;
    return `${(((retail - purchase) / retail) * 100).toFixed(1)}%`;
  })();

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
      const created = await fetchApi("/inventory/products", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          ...(brand.trim() ? { brand: brand.trim() } : {}),
          variants,
        }),
      });

      // Печать ценников — продолжение той же работы, поэтому уводим
      // прямо на этикетку, а не в список, откуда её пришлось бы искать.
      if (printLabels && created?.id) {
        router.push(`/labels?product=${created.id}`);
        return;
      }

      router.push(where === "store" ? "/floor" : "/warehouse");
    } catch (err: unknown) {
      setError(
        err instanceof Error && err.message ? err.message : t("errors.generic"),
      );
      setSaving(false);
    }
  }

  return (
    <AppShell session={session}>
      <form
        onSubmit={handleSubmit}
        className="mx-auto flex w-full max-w-[860px] flex-col gap-5"
      >
        <PageHead eyebrow={t("eyebrow")} title={t("title")} />

        {/* ── 1. Что за вещь ──────────────────────────────────── */}
        <FormSection step={1} title={t("basics")} hint={t("basicsHint")}>
          <div className="grid gap-4 tablet:grid-cols-2">
            <Field label={t("name")} className="tablet:col-span-2">
              {(props) => (
                <TextInput
                  {...props}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("namePlaceholder")}
                />
              )}
            </Field>
            <Field label={t("brand")}>
              {(props) => (
                <TextInput
                  {...props}
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                />
              )}
            </Field>
            <Field label={t("sku")}>
              {(props) => (
                <TextInput
                  {...props}
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase())}
                  placeholder="KRT-24"
                  className="font-mono"
                />
              )}
            </Field>
            <Field label={t("price")}>
              {(props) => (
                <TextInput
                  {...props}
                  inputMode="numeric"
                  value={price}
                  onChange={(e) => setPrice(digits(e.target.value))}
                  placeholder="450"
                  className="font-mono tabular-nums"
                />
              )}
            </Field>
            <Field label={t("cost")} hint={t("costHint")}>
              {(props) => (
                <TextInput
                  {...props}
                  inputMode="numeric"
                  value={cost}
                  onChange={(e) => setCost(digits(e.target.value))}
                  placeholder="310"
                  className="font-mono tabular-nums"
                />
              )}
            </Field>
            {/* Маржа не поле, а следствие двух предыдущих. Считаем сразу:
             * «сколько я на этом зарабатываю» — вопрос, который задают в
             * момент ввода цены, а не после сохранения. */}
            <Field label={t("margin")} hint={t("marginHint")}>
              {(props) => (
                <output
                  {...props}
                  className="flex h-14 items-center rounded-card border-[1.5px] border-dashed border-app-line-strong bg-app-panel px-4 font-mono font-bold text-app-ink num"
                >
                  {marginText}
                </output>
              )}
            </Field>
          </div>
        </FormSection>

        {/* ── 2. Размеры и цвета ──────────────────────────────── */}
        <FormSection step={2} title={t("variants")} hint={t("variantsHint")}>
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-2 text-[13px] font-bold text-app-dim">
              {t("sizes")}
            </legend>
            <div className="flex flex-wrap gap-2">
              {[...LETTER_PRESET, ...NUMERIC_PRESET].map((size) => (
                <Chip
                  key={size}
                  active={sizes.includes(size)}
                  onClick={() => toggleSize(size)}
                  mono
                >
                  {size}
                </Chip>
              ))}
            </div>
            <AddRow
              value={customSize}
              onChange={setCustomSize}
              onAdd={addCustomSize}
              placeholder={t("customSize")}
              label={t("add")}
              mono
            />
          </fieldset>

          <fieldset className="mt-7 flex flex-col gap-3">
            <legend className="mb-2 text-[13px] font-bold text-app-dim">
              {t("colors")}
            </legend>
            {colors.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <Chip
                    key={color}
                    active
                    onClick={() =>
                      setColors((prev) => prev.filter((c) => c !== color))
                    }
                  >
                    {color}
                    <X className="size-3.5" aria-hidden />
                    <span className="sr-only">{t("removeColor")}</span>
                  </Chip>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-app-dim-2">{t("noColors")}</p>
            )}
            <AddRow
              value={customColor}
              onChange={setCustomColor}
              onAdd={addColor}
              placeholder={t("colorPlaceholder")}
              label={t("add")}
            />
          </fieldset>
        </FormSection>

        {/* ── 3. Куда кладём ──────────────────────────────────── */}
        <FormSection step={3} title={t("where")} hint={t("whereHint")}>
          <div className="grid gap-3 tablet:grid-cols-2">
            {(["warehouse", "store"] as Where[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setWhere(option)}
                aria-pressed={where === option}
                className={cn(
                  "rounded-card border-[1.5px] px-5 py-4 text-left font-extrabold",
                  "transition-[background-color,border-color,color] duration-150",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-sapphire",
                  where === option
                    ? "border-app-sapphire bg-app-sapphire-soft text-app-sapphire"
                    : "border-app-line-strong text-app-ink hover:border-app-sapphire",
                )}
              >
                {t(`whereOption.${option}`)}
              </button>
            ))}
          </div>
        </FormSection>

        {/* ── 4. Сетка ────────────────────────────────────────── */}
        <FormSection step={4} title={t("grid")} hint={t("gridHint")}>
          {ordered.length === 0 ? (
            <p className="rounded-card bg-app-panel px-4 py-3.5 text-[13.5px] text-app-dim">
              {t("gridWaiting")}
            </p>
          ) : (
            /* Это поля ввода, а не таблица данных: сетка «цвет × размер» —
             * единственная форма, в которой владелец действительно считает
             * привоз, и заменять её списком было бы дольше в разы. */
            <div className="-mx-1 overflow-x-auto px-1">
              <table className="border-separate border-spacing-2">
                <thead>
                  <tr>
                    <th />
                    {ordered.map((size) => (
                      <th
                        key={size}
                        scope="col"
                        className="px-1 pb-1 font-mono text-[12px] font-bold text-app-dim"
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
                        className="pr-3 text-right text-[13px] font-bold whitespace-nowrap text-app-dim"
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
                              className="h-12 w-14 rounded-card border-[1.5px] border-app-line-strong bg-app-card text-center font-mono text-[15px] font-bold text-app-ink tabular-nums transition-[border-color,box-shadow] duration-150 outline-none placeholder:font-medium placeholder:text-app-dim-2 focus:border-app-sapphire focus:shadow-[0_0_0_4px_rgb(15_82_186/0.10)]"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </FormSection>

        {error ? (
          <p
            role="alert"
            className="rounded-card bg-app-out-soft px-4 py-3.5 text-[13.5px] font-semibold text-app-out"
          >
            {error}
          </p>
        ) : null}

        {/* Ценники печатают сразу после завоза — иначе товар уезжает в зал
         * без цены, и продавец называет её по памяти. */}
        <Toggle
          label={t("printLabels")}
          hint={t("printLabelsHint")}
          checked={printLabels}
          onChange={setPrintLabels}
          className="rounded-frame border border-app-line bg-app-card p-5"
        />

        <Button type="submit" size="xl" disabled={saving} className="w-full">
          {saving ? t("saving") : t("save")}
        </Button>
      </form>
    </AppShell>
  );
}

function Chip({
  active,
  mono,
  onClick,
  children,
}: {
  active: boolean;
  mono?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-bold",
        "transition-[background-color,border-color,color] duration-150",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-sapphire",
        mono && "font-mono",
        active
          ? "border-app-sapphire bg-app-sapphire-soft text-app-sapphire"
          : "border-app-line-strong text-app-dim hover:border-app-sapphire hover:text-app-sapphire",
      )}
    >
      {children}
    </button>
  );
}

function AddRow({
  value,
  onChange,
  onAdd,
  placeholder,
  label,
  mono,
}: {
  value: string;
  onChange: (value: string) => void;
  onAdd: () => void;
  placeholder: string;
  label: string;
  mono?: boolean;
}) {
  return (
    <div className="flex gap-2">
      <TextInput
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onAdd();
          }
        }}
        placeholder={placeholder}
        className={cn("h-12 w-48", mono && "font-mono")}
      />
      <Button type="button" variant="quiet" size="md" onClick={onAdd}>
        <Plus className="size-4" aria-hidden />
        {label}
      </Button>
    </div>
  );
}
