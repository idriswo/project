"use client";

import { Download, Mail, PenLine, Printer } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { MockNotice } from "@/components/ui/mock-notice";
import { ListSkeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { fetchWriteOff, type WriteOff } from "@/lib/api/documents";
import { money } from "@/lib/format";

/**
 * Акт списания товаров (Э-12).
 *
 * Это не «экран со списком», а документ: его подписывают и подшивают.
 * Поэтому вёрстка бумажная — рамка, шапка с реквизитами, нумерованные
 * строки, «Итого» и места для двух подписей. При печати всё лишнее
 * (панель действий, навигация приложения) исчезает: на листе должен
 * остаться только акт.
 */
export function WriteOffActView({ id }: { id: string }) {
  const t = useTranslations("app.writeOffAct");
  const [act, setAct] = useState<WriteOff | null>(null);

  useEffect(() => {
    let alive = true;
    fetchWriteOff(id)
      .then((data) => alive && setAct(data))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [id]);

  if (!act) return <ListSkeleton rows={4} />;

  const total = act.items.reduce(
    (sum, item) => sum + item.quantity * item.unitCost,
    0,
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="print:hidden">
        <MockNotice text={t("mock")} />
      </div>

      <div className="grid gap-6 desktop:grid-cols-[1fr_240px]">
        {/* ── Сам документ ──────────────────────────────────────── */}
        <article className="rounded-frame border border-app-line bg-white p-6 tablet:p-9 print:rounded-none print:border-0 print:p-0">
          <header className="flex flex-wrap items-start justify-between gap-6">
            <h1 className="text-[22px] font-extrabold tracking-[-0.01em] text-black uppercase">
              {t("title")}
            </h1>
            <div className="text-right text-[12.5px] leading-relaxed text-app-dim">
              <p className="text-[14px] font-extrabold tracking-[0.16em] text-app-navy uppercase">
                TIM
              </p>
              <p className="mt-1 font-semibold text-app-ink">{act.storeName}</p>
              <p>{act.storeAddress}</p>
              <p>
                {t("taxId")} {act.taxId}
              </p>
            </div>
          </header>

          {/* Реквизиты документа — рамкой, как в бумажной форме. */}
          <dl className="mt-6 grid grid-cols-1 gap-px overflow-hidden rounded-md border border-app-line-strong bg-app-line-strong tablet:grid-cols-3">
            <Requisite label={t("docDate")} value={act.date} />
            <Requisite label={t("location")} value={act.location} />
            <Requisite label={t("responsible")} value={act.responsible} />
          </dl>

          <table className="mt-6 w-full border-collapse text-left text-[13px]">
            <caption className="sr-only">{t("title")}</caption>
            <thead>
              <tr className="bg-app-panel">
                <Cell as="th" className="w-10 text-center">
                  №
                </Cell>
                <Cell as="th">SKU</Cell>
                <Cell as="th">{t("product")}</Cell>
                <Cell as="th" className="text-center">
                  {t("size")}
                </Cell>
                <Cell as="th" className="text-center">
                  {t("qty")}
                </Cell>
                <Cell as="th" className="text-right">
                  {t("unitCost")}
                </Cell>
                <Cell as="th" className="text-right">
                  {t("rowTotal")}
                </Cell>
              </tr>
            </thead>
            <tbody>
              {act.items.map((item, index) => (
                <tr key={item.id}>
                  <Cell className="text-center font-mono">{index + 1}</Cell>
                  <Cell className="font-mono whitespace-nowrap">
                    {item.sku}
                  </Cell>
                  <Cell>
                    <span className="font-semibold text-black">
                      {item.name}
                    </span>
                    <span className="mt-0.5 block text-[11.5px] text-app-dim">
                      {t("reasonLabel")} {t(`reasons.${item.reason}`)} ·{" "}
                      {item.employee}
                    </span>
                  </Cell>
                  <Cell className="text-center">{item.size}</Cell>
                  <Cell className="text-center font-mono font-bold num">
                    {item.quantity}
                  </Cell>
                  <Cell className="text-right font-mono num">
                    {money(item.unitCost)}
                  </Cell>
                  <Cell className="text-right font-mono font-bold num">
                    {money(item.quantity * item.unitCost)}
                  </Cell>
                </tr>
              ))}
              <tr className="bg-app-panel">
                <Cell
                  colSpan={6}
                  className="text-right text-[15px] font-extrabold"
                >
                  {t("grandTotal")}
                </Cell>
                <Cell className="text-right font-mono text-[15px] font-extrabold num">
                  {money(total)}
                </Cell>
              </tr>
            </tbody>
          </table>

          <footer className="mt-10 flex flex-col items-end gap-4 text-[13px] text-app-ink">
            <Signature label={t("initiator")} />
            <Signature label={t("approver")} />
          </footer>
        </article>

        {/* ── Действия ──────────────────────────────────────────── */}
        <aside className="flex h-fit flex-col gap-2.5 print:hidden">
          <Link
            href={`/approvals/write-off/${act.id}`}
            className="flex items-center gap-2 rounded-card px-3 py-2 text-[13.5px] font-semibold text-app-dim transition-colors duration-150 hover:text-app-sapphire"
          >
            <PenLine className="size-4" aria-hidden />
            {t("edit")}
          </Link>
          <Link
            href="/documents"
            className="flex items-center gap-2 rounded-card px-3 py-2 text-[13.5px] font-semibold text-app-dim transition-colors duration-150 hover:text-app-sapphire"
          >
            {t("backToList")}
          </Link>
          <a
            href={`mailto:?subject=${encodeURIComponent(t("title"))}`}
            className="flex items-center gap-2 rounded-card px-3 py-2 text-[13.5px] font-semibold text-app-dim transition-colors duration-150 hover:text-app-sapphire"
          >
            <Mail className="size-4" aria-hidden />
            {t("sendEmail")}
          </a>

          <Button
            type="button"
            size="lg"
            className="mt-2"
            onClick={() => window.print()}
          >
            <Printer className="size-[18px]" aria-hidden />
            {t("print")}
          </Button>
          {/* PDF на сервере пока не делаем — вопрос 3 в BACKEND-REQUESTS.md.
           * До ответа «Скачать PDF» — та же печать: браузер умеет сохранять
           * в PDF из диалога печати. */}
          <Button
            type="button"
            variant="sapphire"
            size="lg"
            onClick={() => window.print()}
          >
            <Download className="size-[18px]" aria-hidden />
            {t("downloadPdf")}
          </Button>
        </aside>
      </div>
    </div>
  );
}

function Requisite({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2 bg-white px-3.5 py-2.5">
      <dt className="text-[12px] font-bold text-app-dim">{label}</dt>
      <dd className="text-[13px] font-semibold text-black">{value}</dd>
    </div>
  );
}

function Cell({
  as: Tag = "td",
  className,
  children,
  ...rest
}: React.ComponentProps<"td"> & { as?: "td" | "th" }) {
  return (
    <Tag
      {...rest}
      className={`border border-app-line-strong px-3 py-2 align-top ${className ?? ""}`}
    >
      {children}
    </Tag>
  );
}

function Signature({ label }: { label: string }) {
  return (
    <p className="flex items-baseline gap-3">
      {label}
      <span
        aria-hidden
        className="inline-block w-[220px] border-b border-dashed border-app-line-strong"
      />
    </p>
  );
}
