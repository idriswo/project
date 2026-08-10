"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { MockNotice } from "@/components/ui/mock-notice";
import { ListSkeleton } from "@/components/ui/skeleton";
import { DataCard, Eyebrow, PageHead } from "@/components/ui/stat";
import { Diff } from "@/components/ui/status";
import { DataTable, Td, Th, TotalRow } from "@/components/ui/table";
import { Toggle } from "@/components/ui/toggle";
import {
  fetchPurchase,
  type PurchaseOrder,
  receivePurchase,
} from "@/lib/api/suppliers";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { count, money } from "@/lib/format";

/**
 * Приёмка товара (Э-09).
 *
 * Кладовщик считает коробку и вбивает, сколько пришло на самом деле.
 * Расхождение подсвечивается прямо в строке: если недовложили две вещи,
 * это должно быть видно в момент ввода, а не в акте через неделю.
 *
 * Кнопка приёмки живёт в липкой панели внизу — таблица длиннее экрана,
 * и уезжающая наверх кнопка означала бы прокрутку туда-обратно.
 */
export function PurchaseCheckinView({ id }: { id: string }) {
  const t = useTranslations("app.purchase");
  const router = useRouter();
  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [printLabels, setPrintLabels] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchPurchase(id)
      .then((data) => {
        if (!alive) return;
        setOrder(data);
        setCounts(
          Object.fromEntries(
            data.items.map((item) => [item.id, String(item.receivedQty)]),
          ),
        );
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [id]);

  if (!order) return <ListSkeleton rows={5} />;

  const rows = order.items.map((item) => {
    const received = Number(counts[item.id] ?? item.receivedQty) || 0;
    return {
      ...item,
      received,
      diff: received - item.expectedQty,
      total: received * item.unitCost,
    };
  });

  const totalUnits = rows.reduce((sum, row) => sum + row.received, 0);
  const totalCost = rows.reduce((sum, row) => sum + row.total, 0);
  const hasDiff = rows.some((row) => row.diff !== 0);

  async function handleReceive() {
    setSaving(true);
    await receivePurchase({
      id,
      items: rows.map((row) => ({ id: row.id, receivedQty: row.received })),
    });
    setSaving(false);
    // Ценники печатают сразу после завоза, иначе товар уедет в зал без цены.
    router.push(printLabels ? "/labels" : "/warehouse");
  }

  return (
    <div className="flex flex-col gap-6 pb-24">
      <PageHead
        eyebrow={t("eyebrow")}
        title={t("title", { number: order.number })}
      >
        <span className="text-[13.5px] font-semibold text-app-dim">
          {t("supplier")}{" "}
          <span className="text-app-sapphire">{order.supplierName}</span>
        </span>
      </PageHead>

      <MockNotice text={t("mock")} />

      <div className="grid gap-4 tablet:grid-cols-3">
        <Metric
          label={t("totalItems")}
          value={count(totalUnits)}
          unit={t("pcs")}
        />
        <Metric label={t("totalCost")} value={money(totalCost)} unit="TJS" />
        <Metric
          label={t("diffCount")}
          value={String(rows.filter((row) => row.diff !== 0).length)}
          unit={t("positions")}
          tone={hasDiff ? "low" : "ok"}
        />
      </div>

      <DataTable
        caption={t("items")}
        head={
          <>
            <Th>{t("name")}</Th>
            <Th align="center">{t("size")}</Th>
            <Th align="right">{t("expected")}</Th>
            <Th align="center">{t("actual")}</Th>
            <Th align="center">{t("diff")}</Th>
            <Th align="right">{t("unitCost")}</Th>
            <Th align="right">{t("rowTotal")}</Th>
          </>
        }
      >
        {rows.map((row) => (
          <tr key={row.id}>
            <Td className="font-semibold">{row.name}</Td>
            <Td align="center" numeric>
              {row.size}
            </Td>
            <Td align="right" numeric className="text-app-dim">
              {row.expectedQty}
            </Td>
            <Td align="center">
              <input
                inputMode="numeric"
                aria-label={`${row.name} — ${t("actual")}`}
                value={counts[row.id] ?? ""}
                onChange={(event) =>
                  setCounts((prev) => ({
                    ...prev,
                    [row.id]: event.target.value.replace(/\D/g, ""),
                  }))
                }
                className={cn(
                  "h-11 w-20 rounded-card border-[1.5px] bg-app-card text-center font-mono font-bold text-app-ink num",
                  "transition-[border-color,box-shadow] duration-150 outline-none",
                  "focus:border-app-sapphire focus:shadow-[0_0_0_4px_rgb(15_82_186/0.10)]",
                  row.diff === 0
                    ? "border-app-line-strong"
                    : "border-app-gold bg-app-gold-soft",
                )}
              />
            </Td>
            <Td align="center">
              <Diff value={row.diff} />
            </Td>
            <Td align="right" numeric className="text-app-dim">
              {money(row.unitCost)}
            </Td>
            <Td align="right" numeric>
              {money(row.total)}
            </Td>
          </tr>
        ))}
        <TotalRow>
          <Td>{t("grandTotal")}</Td>
          <Td />
          <Td />
          <Td align="center" numeric>
            {count(totalUnits)}
          </Td>
          <Td />
          <Td />
          <Td align="right" numeric>
            {money(totalCost)}
          </Td>
        </TotalRow>
      </DataTable>

      {/* ── Липкая панель приёмки ───────────────────────────────── */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-app-line bg-app-card/95 px-4 py-4 backdrop-blur-sm desktop:left-[236px]">
        <div className="mx-auto flex w-full max-w-[1320px] flex-wrap items-center gap-4">
          <Button
            type="button"
            size="lg"
            onClick={handleReceive}
            disabled={saving}
            className="flex-1 tablet:flex-none"
          >
            <Check className="size-[18px]" aria-hidden />
            {saving ? t("receiving") : t("receive")}
          </Button>
          <Toggle
            label={t("printLabels")}
            checked={printLabels}
            onChange={setPrintLabels}
          />
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  unit,
  tone = "ink",
}: {
  label: string;
  value: string;
  unit: string;
  tone?: "ink" | "ok" | "low";
}) {
  const color =
    tone === "ok"
      ? "text-app-ok"
      : tone === "low"
        ? "text-app-low"
        : "text-app-ink";

  return (
    <DataCard className="p-5">
      <Eyebrow>{label}</Eyebrow>
      <p
        className={cn(
          "mt-3 font-mono text-[26px] leading-none font-extrabold num",
          color,
        )}
      >
        {value}
        <small className="ml-1.5 text-[0.5em] font-bold text-app-dim">
          {unit}
        </small>
      </p>
    </DataCard>
  );
}
