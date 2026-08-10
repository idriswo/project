"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { MockNotice } from "@/components/ui/mock-notice";
import { DashboardSkeleton } from "@/components/ui/skeleton";
import { DataCard, Eyebrow, PageHead, SubStat } from "@/components/ui/stat";
import { StatusPill } from "@/components/ui/status";
import { DataTable, Td, Th, TotalRow } from "@/components/ui/table";
import {
  closeShift,
  fetchCurrentShift,
  type ShiftSummary,
} from "@/lib/api/shifts";
import { money } from "@/lib/format";

/**
 * Закрытие смены и Z-отчёт (Э-05).
 *
 * Главное на экране — сверка: сколько денег должно быть в ящике и
 * сколько там на самом деле. Расхождение показывается сразу при вводе,
 * а не после нажатия кнопки: если кассир ошибся на ноль, он должен
 * увидеть это до того, как смена закроется.
 *
 * Колонка НДС появляется, только если бекенд его считает. Ставки НДС в
 * схеме нет (см. вопрос 1 в `BACKEND-REQUESTS.md`), и рисовать пустую
 * колонку значило бы обещать отчётность, которой нет.
 */
export function ShiftCloseView() {
  const t = useTranslations("app.shiftClose");
  const [shift, setShift] = useState<ShiftSummary | null>(null);
  const [counted, setCounted] = useState("");
  const [closing, setClosing] = useState(false);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchCurrentShift()
      .then((data) => alive && setShift(data))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (!shift) return <DashboardSkeleton />;

  const countedValue = counted.trim() === "" ? null : Number(counted);
  const difference =
    countedValue === null ? null : countedValue - shift.expectedCash;

  const showVat = shift.byCategory.some((row) => row.vat !== null);
  const totals = shift.byCategory.reduce(
    (acc, row) => ({
      sales: acc.sales + row.sales,
      vat: acc.vat + (row.vat ?? 0),
      total: acc.total + row.total,
    }),
    { sales: 0, vat: 0, total: 0 },
  );

  async function handleClose() {
    if (countedValue === null || !shift) return;
    setClosing(true);
    await closeShift({ id: shift.id, countedCash: countedValue });
    setClosed(true);
    setClosing(false);
    // Печать Z-отчёта — та же страница: браузер печатает то, что видно,
    // а видно ровно сводку смены.
    window.print();
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHead
        eyebrow={t("eyebrow")}
        title={t("title", { number: shift.number })}
      >
        <StatusPill tone={shift.status === "open" ? "info" : "neutral"}>
          {t(shift.status)}
        </StatusPill>
      </PageHead>

      <MockNotice text={t("mock")} />

      {/* ── Деньги за смену ─────────────────────────────────────── */}
      <div className="grid gap-4 tablet:grid-cols-2 desktop:grid-cols-4">
        <Money label={t("revenue")} value={shift.revenue} />
        <Money label={t("cash")} value={shift.cash} />
        <Money label={t("card")} value={shift.card} />
        <Money label={t("returns")} value={shift.returns} negative />
      </div>

      {/* ── Сверка кассы ────────────────────────────────────────── */}
      <DataCard className="flex flex-col gap-5 p-5 tablet:p-7">
        <div>
          <h2 className="text-[17px] font-extrabold tracking-[-0.015em] text-app-ink">
            {t("reconcile")}
          </h2>
          <p className="mt-1.5 text-[13.5px] text-app-dim">
            {t("expected")}{" "}
            <span className="font-mono font-bold text-app-ink num">
              {money(shift.expectedCash)}
            </span>{" "}
            TJS
          </p>
        </div>

        <div className="flex flex-wrap gap-x-10 gap-y-4">
          <SubStat label={t("openingCash")} value={money(shift.openingCash)} />
          <SubStat label={t("expenses")} value={money(shift.expenses)} />
          <SubStat label={t("salesCount")} value={String(shift.salesCount)} />
        </div>

        <Field label={t("countedLabel")} hint={t("countedHint")}>
          {(props) => (
            <TextInput
              {...props}
              inputMode="numeric"
              value={counted}
              onChange={(event) =>
                setCounted(event.target.value.replace(/\D/g, ""))
              }
              placeholder="0"
              className="text-right font-mono text-[20px]"
            />
          )}
        </Field>

        {difference !== null ? (
          <DifferenceNote difference={difference} />
        ) : null}
      </DataCard>

      {/* ── Свод по категориям ──────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <h2 className="text-[17px] font-extrabold tracking-[-0.015em] text-app-ink">
          {t("byCategory")}
        </h2>
        <DataTable
          caption={t("byCategory")}
          head={
            <>
              <Th>{t("category")}</Th>
              <Th align="right">{t("sales")}</Th>
              {showVat ? <Th align="right">{t("vat")}</Th> : null}
              <Th align="right">{t("total")}</Th>
            </>
          }
        >
          {shift.byCategory.map((row) => (
            <tr key={row.name}>
              <Td>{row.name}</Td>
              <Td numeric align="right">
                {money(row.sales)}
              </Td>
              {showVat ? (
                <Td numeric align="right">
                  {money(row.vat)}
                </Td>
              ) : null}
              <Td numeric align="right">
                {money(row.total)}
              </Td>
            </tr>
          ))}
          <TotalRow>
            <Td>{t("grandTotal")}</Td>
            <Td numeric align="right">
              {money(totals.sales)}
            </Td>
            {showVat ? (
              <Td numeric align="right">
                {money(totals.vat)}
              </Td>
            ) : null}
            <Td numeric align="right">
              {money(totals.total)}
            </Td>
          </TotalRow>
        </DataTable>
      </div>

      <div className="print:hidden">
        <Button
          type="button"
          size="xl"
          className="w-full"
          disabled={countedValue === null || closing || closed}
          onClick={handleClose}
        >
          {closed ? t("closedDone") : closing ? t("closing") : t("close")}
        </Button>
      </div>
    </div>
  );
}

function Money({
  label,
  value,
  negative,
}: {
  label: string;
  value: number;
  negative?: boolean;
}) {
  return (
    <DataCard className="p-5">
      <Eyebrow>{label}</Eyebrow>
      <p
        className={`mt-3 font-mono text-[24px] leading-none font-extrabold num ${
          negative ? "text-app-out" : "text-app-ink"
        }`}
      >
        {money(value)}
        <small className="ml-1.5 text-[0.55em] font-bold text-app-dim">
          TJS
        </small>
      </p>
    </DataCard>
  );
}

/**
 * Недостача, излишек или «сходится».
 *
 * Три разных сообщения, а не одно с числом: «−210» кассир прочитает как
 * опечатку, «Недостача 210 сомонӣ» — как то, что надо объяснить.
 */
function DifferenceNote({ difference }: { difference: number }) {
  const t = useTranslations("app.shiftClose");

  if (difference === 0) {
    return (
      <p
        role="status"
        className="flex items-center gap-2.5 rounded-card bg-app-ok-soft px-4 py-3 text-[13.5px] font-bold text-app-ok"
      >
        <CheckCircle2 className="size-4.5 shrink-0" aria-hidden />
        {t("matches")}
      </p>
    );
  }

  const shortage = difference < 0;

  return (
    <p
      role="status"
      className={`flex items-center gap-2.5 rounded-card px-4 py-3 text-[13.5px] font-bold ${
        shortage
          ? "bg-app-out-soft text-app-out"
          : "bg-app-low-soft text-app-low"
      }`}
    >
      <AlertTriangle className="size-4.5 shrink-0" aria-hidden />
      {shortage ? t("shortage") : t("surplus")}{" "}
      <span className="font-mono num">{money(Math.abs(difference))}</span> TJS
    </p>
  );
}
