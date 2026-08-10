"use client";

import { Minus, Plus, Printer } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { CodeImage } from "@/components/app/barcode";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";

import { PageHead } from "@/components/ui/stat";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/cn";
import { money } from "@/lib/format";
import {
  clampQuantity,
  DEFAULT_LABEL,
  type LabelConfig,
  type LabelData,
  LABEL_SIZES,
  type LabelSizeKey,
  MAX_LABELS,
  PRINTERS,
  type PrinterModel,
} from "@/lib/labels";
import { queuePrintJob } from "@/lib/api/print";

/**
 * Предпросмотр и печать этикетки (Э-02).
 *
 * Слева — сама этикетка в натуральную пропорцию, справа — настройки.
 * Порядок именно такой: человек смотрит на результат и правит его, а не
 * заполняет форму вслепую и надеется, что напечатается нужное.
 *
 * Печать идёт через `window.print()`: драйвер термопринтера уже стоит в
 * системе, и свой протокол печати мы бы всё равно не реализовали лучше.
 * Размер листа задаётся в `@page` из выбранного размера этикетки.
 */

export function LabelPreviewView({ data }: { data: LabelData }) {
  const t = useTranslations("app.labels");
  const [config, setConfig] = useState<LabelConfig>(DEFAULT_LABEL);
  const [oldPrice, setOldPrice] = useState(String(data.oldPrice ?? data.price));
  const [newPrice, setNewPrice] = useState(String(data.price));
  const [queued, setQueued] = useState(false);

  const discount = config.type === "discount";
  const sheet = LABEL_SIZES[config.size];

  // Размер листа живёт в @page, а её нельзя задать инлайновым стилем —
  // только правилом. Поэтому подменяем правило целиком при смене размера.
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `@page { size: ${sheet.w}mm ${sheet.h}mm; margin: 0; }`;
    document.head.append(style);
    return () => style.remove();
  }, [sheet.w, sheet.h]);

  function patch(next: Partial<LabelConfig>) {
    setConfig((prev) => ({ ...prev, ...next }));
    setQueued(false);
  }

  async function handlePrint() {
    // Задание в очередь ставим до печати, а не после: если человек
    // отменит системный диалог, задание всё равно останется в списке —
    // так менеджер увидит, что этикетки на этот товар уже заказывали.
    await queuePrintJob({
      productName: data.productName,
      labelType: config.type,
      quantity: config.quantity,
    });
    setQueued(true);
    window.print();
  }

  const shown: LabelData = discount
    ? {
        ...data,
        price: Number(newPrice) || 0,
        oldPrice: Number(oldPrice) || 0,
      }
    : data;

  return (
    <div className="flex flex-col gap-6">
      <div className="print:hidden">
        <PageHead eyebrow={t("eyebrow")} title={t("title")} />
      </div>

      <div className="grid gap-6 desktop:grid-cols-[1fr_320px]">
        {/* ── Сама этикетка ─────────────────────────────────────── */}
        <div className="flex items-center justify-center rounded-frame border border-app-line bg-app-panel p-8 print:border-0 print:bg-white print:p-0">
          <LabelSheet
            data={shown}
            config={config}
            discountBadge={t("discountBadge")}
          />
        </div>

        {/* ── Настройки ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-5 rounded-frame border border-app-line bg-app-card p-5 print:hidden">
          <h2 className="text-[17px] font-extrabold tracking-[-0.015em] text-app-ink">
            {t("settings")}
          </h2>

          <Field label={t("printer")}>
            {(props) => (
              <Select
                {...props}
                value={config.printer}
                onChange={(value) => patch({ printer: value as PrinterModel })}
                options={Object.entries(PRINTERS).map(([key, printer]) => ({
                  value: key,
                  label: printer.name,
                }))}
              />
            )}
          </Field>

          <Toggle
            label={t("showBarcode")}
            checked={config.showBarcode}
            onChange={(value) => patch({ showBarcode: value })}
          />
          <Toggle
            label={t("showQr")}
            checked={config.showQr}
            onChange={(value) => patch({ showQr: value })}
          />
          <Toggle
            label={t("discountMode")}
            hint={t("discountHint")}
            checked={discount}
            onChange={(value) =>
              patch({ type: value ? "discount" : "standard" })
            }
          />

          {discount ? (
            <div className="flex flex-col gap-4 rounded-card bg-app-panel p-4">
              <Field label={t("oldPrice")}>
                {(props) => (
                  <TextInput
                    {...props}
                    inputMode="numeric"
                    className="h-12 font-mono"
                    value={oldPrice}
                    onChange={(event) => setOldPrice(event.target.value)}
                  />
                )}
              </Field>
              <Field label={t("newPrice")}>
                {(props) => (
                  <TextInput
                    {...props}
                    inputMode="numeric"
                    className="h-12 font-mono"
                    value={newPrice}
                    onChange={(event) => setNewPrice(event.target.value)}
                  />
                )}
              </Field>
            </div>
          ) : null}

          <Field label={t("size")}>
            {(props) => (
              <Select
                {...props}
                value={config.size}
                onChange={(value) => patch({ size: value as LabelSizeKey })}
                options={Object.entries(LABEL_SIZES).map(([key, box]) => ({
                  value: key,
                  label: `${box.w}×${box.h} ${t("mm")}`,
                }))}
              />
            )}
          </Field>

          <Field
            label={t("quantity")}
            hint={t("quantityHint", { max: MAX_LABELS })}
          >
            {(props) => (
              <div className="flex items-center rounded-card border-[1.5px] border-app-line-strong">
                <StepButton
                  label={t("less")}
                  onClick={() =>
                    patch({ quantity: clampQuantity(config.quantity - 1) })
                  }
                >
                  <Minus className="size-4" aria-hidden />
                </StepButton>
                <input
                  {...props}
                  inputMode="numeric"
                  value={config.quantity}
                  onChange={(event) =>
                    patch({
                      quantity: clampQuantity(Number(event.target.value)),
                    })
                  }
                  className="h-12 min-w-0 flex-1 bg-transparent text-center font-mono font-bold text-app-ink num outline-none"
                />
                <StepButton
                  label={t("more")}
                  onClick={() =>
                    patch({ quantity: clampQuantity(config.quantity + 1) })
                  }
                >
                  <Plus className="size-4" aria-hidden />
                </StepButton>
              </div>
            )}
          </Field>

          <Button type="button" size="lg" onClick={handlePrint}>
            <Printer className="size-[18px]" aria-hidden />
            {t("print")}
          </Button>

          {queued ? (
            <p role="status" className="text-[12.5px] text-app-ok">
              {t("queued", { count: config.quantity })}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/**
 * Лист этикетки.
 *
 * Пропорция задаётся аспектом из выбранного размера, а не подбором
 * пикселей: на экране этикетка обязана выглядеть ровно так, как ляжет
 * на ленту, иначе предпросмотр бесполезен.
 */
function LabelSheet({
  data,
  config,
  discountBadge,
}: {
  data: LabelData;
  config: LabelConfig;
  discountBadge: string;
}) {
  const sheet = LABEL_SIZES[config.size];
  const discount = config.type === "discount";

  return (
    <div
      className={cn(
        "flex w-full max-w-[360px] flex-col items-center gap-1.5 rounded-lg bg-white p-3 text-center",
        "shadow-[0_18px_40px_-24px_rgb(15_25_60/0.45)] print:rounded-none print:shadow-none",
      )}
      style={{ aspectRatio: `${sheet.w} / ${sheet.h}` }}
    >
      {discount ? (
        <span className="rounded-md bg-app-out px-2.5 py-0.5 text-[11px] font-extrabold tracking-[0.1em] text-white uppercase">
          {discountBadge}
        </span>
      ) : (
        <span className="text-[11px] font-extrabold tracking-[0.18em] text-app-navy uppercase">
          TIM
        </span>
      )}

      <span className="line-clamp-1 text-[15px] font-extrabold text-black">
        {data.productName}
      </span>

      {data.size ? (
        <span className="text-[26px] leading-none font-extrabold text-black">
          {data.size}
        </span>
      ) : null}

      {discount && data.oldPrice ? (
        <span className="font-mono text-[15px] font-bold text-app-dim-2 num line-through">
          {money(data.oldPrice)}
        </span>
      ) : null}

      <span
        className={cn(
          "font-mono text-[22px] leading-none font-extrabold num",
          discount ? "text-app-out" : "text-black",
        )}
      >
        {money(data.price)}
        <small className="ml-1.5 text-[0.6em] font-bold">TJS</small>
      </span>

      <div className="flex w-full min-w-0 flex-1 items-end justify-center gap-2">
        {config.showBarcode ? (
          <CodeImage
            kind="code128"
            value={data.barcode ?? ""}
            className="min-w-0 flex-1"
          />
        ) : null}
        {config.showQr ? (
          <CodeImage
            kind="qrcode"
            value={data.barcode ?? ""}
            showText={false}
            className="w-16 shrink-0"
          />
        ) : null}
      </div>
    </div>
  );
}

function StepButton({
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
      className="flex size-12 shrink-0 items-center justify-center text-app-dim transition-colors duration-150 hover:text-app-sapphire focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-app-sapphire"
    >
      {children}
    </button>
  );
}

/** Единственный вид выпадающего списка приложения. */
export function Select({
  value,
  onChange,
  options,
  className,
  ...rest
}: {
  value: string;
  onChange: (next: string) => void;
  options: readonly { value: string; label: string }[];
  className?: string;
} & Omit<React.ComponentProps<"select">, "value" | "onChange">) {
  return (
    <select
      {...rest}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={cn(
        "h-12 w-full rounded-card border-[1.5px] border-app-line-strong bg-app-card px-3.5",
        "font-semibold text-app-ink outline-none",
        "transition-[border-color,box-shadow] duration-150",
        "focus:border-app-sapphire focus:shadow-[0_0_0_4px_rgb(15_82_186/0.10)]",
        className,
      )}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
