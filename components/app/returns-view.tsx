"use client";

import { RotateCcw, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Select } from "@/components/app/label-preview-view";
import { Button } from "@/components/ui/button";
import { EmptyBlock } from "@/components/ui/empty";
import { MockNotice } from "@/components/ui/mock-notice";
import { DataCard, Eyebrow, PageHead } from "@/components/ui/stat";
import {
  createReturn,
  lookupReceipt,
  type Receipt,
  type ReturnReason,
} from "@/lib/api/returns";
import { cn } from "@/lib/cn";
import { money } from "@/lib/format";

/**
 * Возвраты и обмен (Э-21).
 *
 * Возврат начинается не с товара, а с чека: без чека неизвестно, по
 * какой цене вещь продали — со скидкой или без, — а вернуть надо ровно
 * уплаченное.
 *
 * Причина возврата обязательна у каждой позиции: из этих причин
 * складывается отчёт о потерях (Э-17), и «просто возврат» там не
 * различить от брака поставщика.
 */

const REASONS: ReturnReason[] = ["wrongSize", "defect", "changedMind", "other"];

export function ReturnsView() {
  const t = useTranslations("app.returns");
  const [query, setQuery] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [searched, setSearched] = useState(false);
  const [picked, setPicked] = useState<Record<string, ReturnReason>>({});
  const [refunded, setRefunded] = useState<number | null>(null);

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = await lookupReceipt(query);
    setReceipt(found);
    setSearched(true);
    setPicked({});
    setRefunded(null);
  }

  function toggleLine(id: string) {
    setPicked((prev) => {
      if (id in prev) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: "wrongSize" };
    });
  }

  const lines = receipt?.lines ?? [];
  const refundTotal = lines
    .filter((line) => line.id in picked)
    .reduce(
      (sum, line) => sum + line.price * (1 - line.discountPercent / 100),
      0,
    );

  async function handleRefund() {
    if (!receipt) return;
    const result = await createReturn({
      saleId: receipt.id,
      items: Object.entries(picked).map(([lineId, reason]) => ({
        lineId,
        reason,
      })),
      amount: refundTotal,
    });
    setRefunded(result.refunded);
    setPicked({});
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHead eyebrow={t("eyebrow")} title={t("title")} />
      <MockNotice text={t("mock")} />

      <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
        <label className="flex min-w-[240px] flex-1 items-center gap-2.5 rounded-card border-[1.5px] border-app-line-strong bg-app-card px-4 py-3 focus-within:border-app-sapphire">
          <Search className="size-4.5 shrink-0 text-app-dim-2" aria-hidden />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            className="min-w-0 flex-1 bg-transparent font-mono text-[16px] font-bold text-app-ink num outline-none placeholder:font-medium placeholder:text-app-dim-2"
          />
        </label>
        <Button type="submit" variant="sapphire" size="lg">
          {t("find")}
        </Button>
      </form>

      {searched && !receipt ? (
        <EmptyBlock
          art="search"
          title={t("notFoundTitle")}
          lead={t("notFoundLead")}
        />
      ) : null}

      {receipt ? (
        <>
          <DataCard className="p-5 tablet:p-6">
            <Eyebrow>{t("receiptDetails")}</Eyebrow>
            <p className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-[13.5px] text-app-dim">
              <span>
                {t("receiptNumber")}{" "}
                <span className="font-mono font-bold text-app-ink num">
                  {receipt.number}
                </span>
              </span>
              <span>
                {t("date")}{" "}
                <span className="font-semibold text-app-ink">
                  {receipt.date}
                </span>
              </span>
              <span>
                {t("cashier")}{" "}
                <span className="font-semibold text-app-ink">
                  {receipt.cashier}
                </span>
              </span>
            </p>

            <ul className="mt-5 flex flex-col divide-y divide-app-line border-t border-app-line">
              {lines.map((line) => {
                const chosen = line.id in picked;
                const paid = line.price * (1 - line.discountPercent / 100);

                return (
                  <li
                    key={line.id}
                    className={cn(
                      "flex flex-wrap items-center gap-x-4 gap-y-3 py-3.5",
                      chosen && "bg-app-sapphire-soft/40",
                    )}
                  >
                    <label className="flex min-w-[220px] flex-1 cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={chosen}
                        onChange={() => toggleLine(line.id)}
                        className="size-5 shrink-0 accent-[#0f52ba]"
                      />
                      <span className="min-w-0">
                        <span className="block font-semibold text-app-ink">
                          {line.name}
                        </span>
                        <span className="block text-[12.5px] text-app-dim">
                          {t("size")} {line.size} · {line.color}
                        </span>
                      </span>
                    </label>

                    {chosen ? (
                      <Select
                        aria-label={t("reason")}
                        value={picked[line.id]}
                        onChange={(value) =>
                          setPicked((prev) => ({
                            ...prev,
                            [line.id]: value as ReturnReason,
                          }))
                        }
                        options={REASONS.map((reason) => ({
                          value: reason,
                          label: t(`reasons.${reason}`),
                        }))}
                        className="h-11 w-[220px]"
                      />
                    ) : null}

                    <span className="shrink-0 text-right font-mono font-bold text-app-ink num">
                      {money(paid)}
                      {line.discountPercent > 0 ? (
                        <small className="ml-1.5 block text-[11.5px] font-semibold text-app-low">
                          {t("withDiscount", { percent: line.discountPercent })}
                        </small>
                      ) : null}
                    </span>
                  </li>
                );
              })}
            </ul>
          </DataCard>

          <DataCard className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div>
              <Eyebrow>{t("refundTotal")}</Eyebrow>
              <p className="mt-2 font-mono text-[32px] leading-none font-extrabold text-app-ink num">
                {money(refundTotal)}
                <small className="ml-2 text-[0.4em] font-bold text-app-dim">
                  TJS
                </small>
              </p>
              {refunded !== null ? (
                <p
                  role="status"
                  className="mt-2 text-[13px] font-semibold text-app-ok"
                >
                  {t("refunded", { amount: money(refunded) })}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Button
                type="button"
                size="lg"
                disabled={refundTotal === 0}
                onClick={handleRefund}
              >
                <RotateCcw className="size-[18px]" aria-hidden />
                {t("refund")}
              </Button>
              {/* Обмен — это возврат плюс новая продажа. Пока нет
               * `POST /returns/exchange`, ведём кассира на кассу: он
               * оформит вторую половину руками, а не упрётся в кнопку,
               * которая ничего не делает. */}
              <Button href="/pos" variant="ghost" size="lg">
                {t("exchange")}
              </Button>
            </div>
          </DataCard>
        </>
      ) : null}
    </div>
  );
}
