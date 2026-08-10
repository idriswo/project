"use client";

import { Pause, Play, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { EmptyBlock } from "@/components/ui/empty";
import { MockNotice } from "@/components/ui/mock-notice";
import { DataCard, Eyebrow, PageHead } from "@/components/ui/stat";
import { StatusDot, StatusPill } from "@/components/ui/status";
import { DataTable, Td, Th } from "@/components/ui/table";
import {
  cancelPrintJob,
  clearPrintQueue,
  fetchPrintQueue,
  pausePrintJob,
  type PrintJob,
  type PrintQueue,
} from "@/lib/api/print";
import { cn } from "@/lib/cn";
import { count } from "@/lib/format";

/**
 * Очередь печати этикеток (Э-03).
 *
 * Экран отвечает на один вопрос: «почему из принтера ничего не лезет».
 * Поэтому статус принтера стоит наверху рядом со счётчиками, а не в
 * подвале: если он офлайн, дальше читать нечего.
 */
export function PrintQueueView() {
  const t = useTranslations("app.printQueue");
  const [data, setData] = useState<PrintQueue | null>(null);

  const load = useCallback(() => {
    fetchPrintQueue()
      .then(setData)
      .catch(() => setData(null));
  }, []);

  useEffect(load, [load]);

  async function handlePause(id: string) {
    await pausePrintJob(id);
    load();
  }

  async function handleCancel(id: string) {
    await cancelPrintJob(id);
    load();
  }

  async function handleClear() {
    await clearPrintQueue();
    load();
  }

  const jobs = data?.jobs ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PageHead eyebrow={t("eyebrow")} title={t("title")}>
        <Button
          type="button"
          onClick={handleClear}
          disabled={jobs.length === 0}
        >
          <Trash2 className="size-[18px]" aria-hidden />
          {t("clear")}
        </Button>
      </PageHead>

      <MockNotice text={t("mock")} />

      <div className="grid gap-4 tablet:grid-cols-3">
        <DataCard className="p-5">
          <Eyebrow>{t("activeJobs")}</Eyebrow>
          <p className="mt-3 font-mono text-[34px] leading-none font-extrabold text-app-ink num">
            {count(data?.activeCount)}
          </p>
          <p className="mt-2 text-[13px] text-app-dim">{t("activeHint")}</p>
        </DataCard>

        <DataCard className="p-5">
          <Eyebrow>{t("printedToday")}</Eyebrow>
          <p className="mt-3 font-mono text-[34px] leading-none font-extrabold text-app-ink num">
            {count(data?.printedToday)}
          </p>
          <p className="mt-2 text-[13px] text-app-dim">{t("printedHint")}</p>
        </DataCard>

        <DataCard className="p-5">
          <Eyebrow>{t("printerStatus")}</Eyebrow>
          <p className="mt-3 flex items-center gap-2.5 text-[15px] font-bold text-app-ink">
            <StatusDot tone={data?.printerOnline ? "ok" : "out"} />
            {data?.printerName ?? "—"}
          </p>
          <p className="mt-2 text-[13px] text-app-dim">
            {data?.printerOnline ? t("online") : t("offline")}
          </p>
        </DataCard>
      </div>

      {jobs.length === 0 ? (
        <EmptyBlock art="box" title={t("emptyTitle")} lead={t("emptyLead")} />
      ) : (
        <DataTable
          caption={t("title")}
          head={
            <>
              <Th>{t("jobId")}</Th>
              <Th>{t("product")}</Th>
              <Th>{t("labelType")}</Th>
              <Th align="right">{t("quantity")}</Th>
              <Th>{t("progress")}</Th>
              <Th align="right">{t("actions")}</Th>
            </>
          }
        >
          {jobs.map((job) => (
            <Row
              key={job.id}
              job={job}
              onPause={() => handlePause(job.id)}
              onCancel={() => handleCancel(job.id)}
            />
          ))}
        </DataTable>
      )}
    </div>
  );
}

function Row({
  job,
  onPause,
  onCancel,
}: {
  job: PrintJob;
  onPause: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations("app.printQueue");
  const percentDone = Math.round(
    (job.printed / Math.max(1, job.quantity)) * 100,
  );
  const running = job.status === "printing";

  return (
    <tr>
      <Td numeric className="text-app-dim">
        #{job.id}
      </Td>
      <Td className="font-semibold">{job.productName}</Td>
      <Td>
        <StatusPill tone={job.labelType === "discount" ? "low" : "neutral"}>
          {t(job.labelType)}
        </StatusPill>
      </Td>
      <Td numeric align="right">
        {count(job.quantity)}
      </Td>
      <Td>
        <div className="flex items-center gap-3">
          <span
            className="h-2 w-28 shrink-0 overflow-hidden rounded-full bg-app-track"
            role="progressbar"
            aria-valuenow={percentDone}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={job.productName}
          >
            <span
              className="block h-full rounded-full bg-app-sapphire transition-[width] duration-150"
              style={{ width: `${percentDone}%` }}
            />
          </span>
          <span className="font-mono text-[13px] font-bold text-app-dim num">
            {percentDone}%
          </span>
        </div>
      </Td>
      <Td align="right">
        <div className="flex justify-end gap-1.5">
          <IconAction
            label={running ? t("pause") : t("resume")}
            onClick={onPause}
          >
            {running ? (
              <Pause className="size-4" aria-hidden />
            ) : (
              <Play className="size-4" aria-hidden />
            )}
          </IconAction>
          <IconAction label={t("cancel")} onClick={onCancel} danger>
            <X className="size-4" aria-hidden />
          </IconAction>
        </div>
      </Td>
    </tr>
  );
}

function IconAction({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "flex size-9 items-center justify-center rounded-full border border-app-line",
        "text-app-dim transition-colors duration-150",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-sapphire",
        danger
          ? "hover:border-app-out hover:bg-app-out-soft hover:text-app-out"
          : "hover:border-app-sapphire hover:bg-app-sapphire-soft hover:text-app-sapphire",
      )}
    >
      {children}
    </button>
  );
}
