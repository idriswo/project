"use client";

import { Check, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { MockNotice } from "@/components/ui/mock-notice";
import { ListSkeleton } from "@/components/ui/skeleton";
import { DataCard, Eyebrow } from "@/components/ui/stat";
import { StatusPill } from "@/components/ui/status";
import { Link } from "@/i18n/navigation";
import {
  approveWriteOff,
  fetchWriteOff,
  rejectWriteOff,
  type WriteOff,
  type WriteOffStatus,
} from "@/lib/api/documents";
import { money } from "@/lib/format";

/**
 * Согласование дорогого списания (Э-13).
 *
 * Сумма набрана крупно и красным — это единственное число, ради
 * которого менеджера сюда позвали. Ниже — из чего она сложилась: без
 * причины и фамилии сотрудника решение принимать не по чему.
 *
 * Отклонение требует комментария, одобрение — нет. Отказ без объяснения
 * возвращается тем же вопросом через час.
 */
export function WriteOffApprovalView({ id }: { id: string }) {
  const t = useTranslations("app.writeOffApproval");
  const [act, setAct] = useState<WriteOff | null>(null);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<WriteOffStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [noteError, setNoteError] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchWriteOff(id)
      .then((data) => alive && setAct(data))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [id]);

  if (!act) return <ListSkeleton rows={3} />;

  const total = act.items.reduce(
    (sum, item) => sum + item.quantity * item.unitCost,
    0,
  );
  const decided = status ?? (act.status === "pending" ? null : act.status);

  async function handleApprove() {
    setBusy(true);
    const result = await approveWriteOff({
      id,
      managerNote: note || undefined,
    });
    setStatus(result.status);
    setBusy(false);
  }

  async function handleReject() {
    if (!note.trim()) {
      setNoteError(true);
      return;
    }
    setBusy(true);
    const result = await rejectWriteOff({ id, managerNote: note });
    setStatus(result.status);
    setBusy(false);
  }

  return (
    <div className="flex flex-col gap-5">
      <MockNotice text={t("mock")} />

      <DataCard className="p-6 tablet:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Eyebrow>{t("eyebrow")}</Eyebrow>
            <h1 className="mt-2 text-[clamp(24px,4vw,30px)] leading-none font-extrabold tracking-[-0.03em] text-app-ink">
              {t("title")}
            </h1>
            <p className="mt-2 text-[13.5px] text-app-dim">
              {t("subtitle", { number: act.number })}
            </p>
          </div>
          {decided ? (
            <StatusPill tone={decided === "approved" ? "ok" : "out"}>
              {t(`status.${decided}`)}
            </StatusPill>
          ) : (
            <StatusPill tone="low">{t("status.pending")}</StatusPill>
          )}
        </div>

        <p className="mt-7 font-mono text-[clamp(40px,8vw,56px)] leading-none font-extrabold tracking-[-0.04em] text-app-out num">
          {money(total)}
          <small className="ml-3 text-[0.32em] font-bold tracking-[0.06em] text-app-dim">
            TJS
          </small>
        </p>
        <p className="mt-2 text-[13px] text-app-dim">{t("amountHint")}</p>

        {/* ── Из чего сложилась сумма ───────────────────────────── */}
        <h2 className="mt-8 text-[15px] font-extrabold text-app-ink">
          {t("composition")}
        </h2>
        <ul className="mt-3 divide-y divide-app-line border-t border-app-line">
          {act.items.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-baseline gap-x-5 gap-y-1 py-3"
            >
              <span className="min-w-[180px] flex-1 font-semibold text-app-ink">
                {item.name}
              </span>
              <span className="font-mono text-[14px] font-bold text-app-ink num">
                {item.quantity} {t("pcs")}
              </span>
              <span className="min-w-[200px] flex-1 text-[13px] text-app-dim">
                {t(`reasons.${item.reason}`)}
                <span className="block text-app-dim-2">
                  {t("employee")} {item.employee}
                </span>
              </span>
              <span className="font-mono text-[14px] font-bold text-app-out num">
                {money(item.quantity * item.unitCost)}
              </span>
            </li>
          ))}
        </ul>

        {/* ── Решение ───────────────────────────────────────────── */}
        {decided ? (
          <p
            role="status"
            className="mt-7 rounded-card bg-app-panel px-4 py-3.5 text-[13.5px] font-semibold text-app-dim"
          >
            {t(`decided.${decided}`)}{" "}
            <Link
              href={`/documents/write-off/${act.id}`}
              className="font-bold text-app-sapphire underline underline-offset-2"
            >
              {t("openAct")}
            </Link>
          </p>
        ) : (
          <>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button
                type="button"
                size="lg"
                onClick={handleApprove}
                disabled={busy}
              >
                <Check className="size-[18px]" aria-hidden />
                {t("approve")}
              </Button>
              <Button
                type="button"
                size="lg"
                variant="danger"
                onClick={handleReject}
                disabled={busy}
              >
                <X className="size-[18px]" aria-hidden />
                {t("reject")}
              </Button>
            </div>

            <label className="mt-6 block">
              <span className="text-[13px] font-bold text-app-dim">
                {t("noteLabel")}
              </span>
              <textarea
                value={note}
                onChange={(event) => {
                  setNote(event.target.value);
                  setNoteError(false);
                }}
                rows={3}
                placeholder={t("notePlaceholder")}
                aria-invalid={noteError || undefined}
                className="mt-2 w-full resize-y rounded-card border-[1.5px] border-app-line-strong bg-app-card px-4 py-3 font-medium text-app-ink transition-[border-color,box-shadow] duration-150 outline-none placeholder:text-app-dim-2 focus:border-app-sapphire focus:shadow-[0_0_0_4px_rgb(15_82_186/0.10)] aria-invalid:border-app-out"
              />
              {noteError ? (
                <span
                  role="alert"
                  className="mt-2 block text-[12.5px] text-app-out"
                >
                  {t("noteRequired")}
                </span>
              ) : null}
            </label>
          </>
        )}
      </DataCard>
    </div>
  );
}
