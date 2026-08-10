"use client";

import { PenLine, ScanBarcode, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { MockNotice } from "@/components/ui/mock-notice";
import { Segmented } from "@/components/ui/segmented";
import { ListSkeleton } from "@/components/ui/skeleton";
import { PageHead } from "@/components/ui/stat";
import { Diff } from "@/components/ui/status";
import { DataTable, Td, Th } from "@/components/ui/table";
import {
  completeStocktake,
  fetchStocktake,
  saveStocktakeCounts,
  type StockLocation,
  type StocktakeRow,
} from "@/lib/api/stock-ops";
import { cn } from "@/lib/cn";
import { count } from "@/lib/format";

/**
 * Инвентаризация (Э-10).
 *
 * Два режима работы, и это не украшение: со сканером человек идёт вдоль
 * полки и стреляет в каждую вещь — поле ввода само находит строку и
 * прибавляет единицу. Вручную он вбивает итог по позиции. Смешивать их
 * нельзя: в режиме сканера курсор обязан всегда стоять в поле приёма,
 * иначе следующий выстрел уйдёт в никуда.
 */

type Mode = "scan" | "manual";

export function StocktakeView({ id }: { id: string }) {
  const t = useTranslations("app.stocktake");
  const [location, setLocation] = useState<StockLocation>("warehouse");
  const [mode, setMode] = useState<Mode>("manual");
  const [rows, setRows] = useState<StocktakeRow[] | null>(null);
  const [number, setNumber] = useState(0);
  const [query, setQuery] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchStocktake(id, location)
      .then((data) => {
        if (!alive) return;
        setRows(data.rows);
        setNumber(data.number);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [id, location]);

  if (!rows) return <ListSkeleton rows={6} />;

  const visible = rows.filter((row) => {
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    return (
      row.name.toLowerCase().includes(needle) ||
      row.sku.toLowerCase().includes(needle)
    );
  });

  const counted = rows.filter((row) => row.countedQty !== null);
  const totalUnits = counted.reduce(
    (sum, row) => sum + (row.countedQty ?? 0),
    0,
  );
  const totalDiff = counted.reduce(
    (sum, row) => sum + ((row.countedQty ?? 0) - row.systemQty),
    0,
  );

  function setCount(rowId: string, value: number | null) {
    setRows((prev) =>
      (prev ?? []).map((row) =>
        row.id === rowId ? { ...row, countedQty: value } : row,
      ),
    );
  }

  /** Выстрел сканера: находим строку по SKU и прибавляем единицу. */
  function handleScan(code: string) {
    const target = rows?.find(
      (row) => row.sku.toLowerCase() === code.trim().toLowerCase(),
    );
    if (!target) return false;
    setCount(target.id, (target.countedQty ?? 0) + 1);
    return true;
  }

  async function handleComplete() {
    await saveStocktakeCounts({
      id,
      items: rows!.map((row) => ({ id: row.id, countedQty: row.countedQty })),
    });
    await completeStocktake(id);
    setDone(true);
  }

  return (
    <div className="flex flex-col gap-5 pb-24">
      <PageHead eyebrow={t("eyebrow")} title={t("title", { number })}>
        <Segmented
          ariaLabel={t("location")}
          value={location}
          onChange={setLocation}
          options={[
            { value: "warehouse", label: t("warehouse") },
            { value: "floor", label: t("floor") },
          ]}
        />
      </PageHead>

      <MockNotice text={t("mock")} />

      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          ariaLabel={t("mode")}
          value={mode}
          onChange={setMode}
          options={[
            { value: "scan", label: t("scanMode") },
            { value: "manual", label: t("manualMode") },
          ]}
        />
        <label className="flex min-w-[220px] flex-1 items-center gap-2.5 rounded-card border border-app-line bg-app-card px-3.5 py-2.5">
          <Search className="size-4 shrink-0 text-app-dim-2" aria-hidden />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            className="min-w-0 flex-1 bg-transparent text-[14px] font-medium text-app-ink outline-none placeholder:text-app-dim-2"
          />
        </label>
      </div>

      {mode === "scan" ? <ScanBox onScan={handleScan} /> : null}

      <DataTable
        caption={t("title", { number })}
        head={
          <>
            <Th>{t("product")}</Th>
            <Th>SKU</Th>
            <Th align="center">{t("size")}</Th>
            <Th align="right">{t("systemQty")}</Th>
            <Th align="center">{t("countedQty")}</Th>
            <Th align="center">{t("diff")}</Th>
          </>
        }
      >
        {visible.map((row) => {
          const diff =
            row.countedQty === null ? null : row.countedQty - row.systemQty;

          return (
            <tr key={row.id}>
              <Td className="font-semibold">{row.name}</Td>
              <Td numeric className="text-app-dim">
                {row.sku}
              </Td>
              <Td align="center" numeric>
                {row.size}
              </Td>
              <Td align="right" numeric className="text-app-dim">
                {row.systemQty}
              </Td>
              <Td align="center">
                <input
                  inputMode="numeric"
                  disabled={mode === "scan"}
                  aria-label={`${row.name} — ${t("countedQty")}`}
                  value={row.countedQty ?? ""}
                  placeholder="—"
                  onChange={(event) => {
                    const raw = event.target.value.replace(/\D/g, "");
                    setCount(row.id, raw === "" ? null : Number(raw));
                  }}
                  className={cn(
                    "h-11 w-20 rounded-card border-[1.5px] border-app-line-strong bg-app-card text-center font-mono font-bold text-app-ink num",
                    "transition-[border-color,box-shadow] duration-150 outline-none",
                    "focus:border-app-sapphire focus:shadow-[0_0_0_4px_rgb(15_82_186/0.10)]",
                    "disabled:bg-app-panel disabled:text-app-dim",
                  )}
                />
              </Td>
              <Td align="center">
                {diff === null ? (
                  <span className="text-[12px] font-semibold text-app-dim-2">
                    {t("notCounted")}
                  </span>
                ) : (
                  <Diff value={diff} />
                )}
              </Td>
            </tr>
          );
        })}
      </DataTable>

      {/* ── Липкий итог ─────────────────────────────────────────── */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-app-line bg-app-card/95 px-4 py-4 backdrop-blur-sm desktop:left-[236px]">
        <div className="mx-auto flex w-full max-w-[1320px] flex-wrap items-center gap-x-8 gap-y-3">
          <Summary
            label={t("positions")}
            value={`${counted.length}/${rows.length}`}
          />
          <Summary label={t("units")} value={count(totalUnits)} />
          <Summary
            label={t("totalDiff")}
            value={`${totalDiff > 0 ? "+" : ""}${totalDiff}`}
            tone={totalDiff === 0 ? "ok" : "out"}
          />
          <Button
            type="button"
            size="lg"
            className="ml-auto"
            disabled={counted.length === 0 || done}
            onClick={handleComplete}
          >
            {done ? t("completed") : t("complete")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Summary({
  label,
  value,
  tone = "ink",
}: {
  label: string;
  value: string;
  tone?: "ink" | "ok" | "out";
}) {
  const color =
    tone === "ok"
      ? "text-app-ok"
      : tone === "out"
        ? "text-app-out"
        : "text-app-ink";

  return (
    <span className="flex flex-col gap-0.5">
      <span className="text-[11px] font-bold tracking-[0.08em] text-app-dim-2 uppercase">
        {label}
      </span>
      <span className={cn("font-mono text-[17px] font-extrabold num", color)}>
        {value}
      </span>
    </span>
  );
}

/**
 * Приём выстрелов сканера.
 *
 * Поле возвращает себе фокус после каждого кода: человек идёт вдоль
 * полки и не смотрит на экран, а сканер печатает туда, где стоит курсор.
 */
function ScanBox({ onScan }: { onScan: (code: string) => boolean }) {
  const t = useTranslations("app.stocktake");
  const [value, setValue] = useState("");
  const [last, setLast] = useState<{ code: string; ok: boolean } | null>(null);
  const ref = useRef<HTMLInputElement>(null);

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const code = value.trim();
    if (!code) return;
    setLast({ code, ok: onScan(code) });
    setValue("");
  }

  return (
    <div className="flex flex-col gap-3 rounded-frame border-[1.5px] border-app-sapphire bg-app-sapphire-soft p-5">
      <span className="flex items-center gap-2.5 text-[13px] font-bold tracking-[0.08em] text-app-sapphire uppercase">
        <ScanBarcode className="size-4.5" aria-hidden />
        {t("scanMode")}
      </span>

      <input
        ref={ref}
        autoFocus
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => ref.current?.focus()}
        placeholder={t("scanPlaceholder")}
        aria-label={t("scanPlaceholder")}
        className="h-14 w-full rounded-card border-[1.5px] border-app-sapphire/40 bg-white text-center font-mono text-[19px] font-extrabold text-app-ink num outline-none placeholder:font-medium placeholder:text-app-dim-2"
      />

      {last ? (
        <p
          role="status"
          className={cn(
            "flex items-center gap-2 text-[13px] font-bold",
            last.ok ? "text-app-ok" : "text-app-out",
          )}
        >
          <PenLine className="size-4" aria-hidden />
          {last.ok
            ? t("scanOk", { code: last.code })
            : t("scanUnknown", { code: last.code })}
        </p>
      ) : null}
    </div>
  );
}
