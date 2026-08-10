"use client";

import { FileText, ImageIcon, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { Select } from "@/components/app/label-preview-view";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { MockNotice } from "@/components/ui/mock-notice";
import { DataCard, Eyebrow, PageHead } from "@/components/ui/stat";
import { DataTable, Td, Th } from "@/components/ui/table";
import {
  createExpense,
  EXPENSE_CATEGORIES,
  type Expense,
  type ExpenseCategory,
  type ExpensesSummary,
  fetchExpenses,
  fetchExpensesSummary,
} from "@/lib/api/expenses";
import { cn } from "@/lib/cn";
import { count, money } from "@/lib/format";

/**
 * Расходы из кассы (Э-07).
 *
 * Слева — что уже потратили, справа — форма новой записи. Форма стоит
 * рядом со списком, а не за кнопкой «добавить»: расход записывают
 * сразу после того, как отдали деньги, и лишний переход по экранам
 * означает, что запись не появится вовсе.
 */
export function ExpensesView() {
  const t = useTranslations("app.expenses");
  const [summary, setSummary] = useState<ExpensesSummary | null>(null);
  const [items, setItems] = useState<Expense[]>([]);
  const [shown, setShown] = useState(6);

  const [category, setCategory] = useState<ExpenseCategory>("supplies");
  const [amount, setAmount] = useState("");
  const [comment, setComment] = useState("");
  const [receipt, setReceipt] = useState<"image" | "pdf" | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    fetchExpensesSummary()
      .then(setSummary)
      .catch(() => {});
    fetchExpenses()
      .then(setItems)
      .catch(() => {});
  }, []);

  useEffect(load, [load]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = Number(amount);
    if (!value) return;

    setSaving(true);
    await createExpense({ category, amount: value, comment, receipt });
    setAmount("");
    setComment("");
    setReceipt(null);
    setSaving(false);
    load();
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHead eyebrow={t("eyebrow")} title={t("title")} />
      <MockNotice text={t("mock")} />

      <div className="grid gap-4 tablet:grid-cols-3">
        <Metric
          label={t("cashBalance")}
          value={money(summary?.cashBalance)}
          unit="TJS"
        />
        <Metric
          label={t("todayTotal")}
          value={money(summary?.todayTotal)}
          unit="TJS"
        />
        <Metric
          label={t("pendingReceipts")}
          value={count(summary?.pendingReceipts)}
          unit={t("receiptsUnit")}
        />
      </div>

      <div className="grid gap-5 desktop:grid-cols-[1fr_340px]">
        {/* ── Что уже потратили ─────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          <h2 className="text-[17px] font-extrabold tracking-[-0.015em] text-app-ink">
            {t("recent")}
          </h2>
          <DataTable
            caption={t("recent")}
            head={
              <>
                <Th>{t("date")}</Th>
                <Th>{t("category")}</Th>
                <Th align="right">{t("amount")}</Th>
                <Th>{t("comment")}</Th>
                <Th align="center">{t("receipt")}</Th>
              </>
            }
          >
            {items.slice(0, shown).map((item) => (
              <tr key={item.id}>
                <Td numeric className="whitespace-nowrap text-app-dim">
                  {item.date}
                </Td>
                <Td>{t(`categories.${item.category}`)}</Td>
                <Td numeric align="right">
                  {money(item.amount)}
                </Td>
                <Td className="text-app-dim">{item.comment}</Td>
                <Td align="center">
                  <ReceiptMark kind={item.receipt} />
                </Td>
              </tr>
            ))}
          </DataTable>

          {shown < items.length ? (
            <Button
              type="button"
              variant="quiet"
              onClick={() => setShown((n) => n + 6)}
            >
              {t("viewMore")}
            </Button>
          ) : null}
        </div>

        {/* ── Новая запись ──────────────────────────────────────── */}
        <form
          onSubmit={handleSubmit}
          className="flex h-fit flex-col gap-4 rounded-frame border border-app-line bg-app-card p-5"
        >
          <div>
            <h2 className="text-[17px] font-extrabold tracking-[-0.015em] text-app-ink">
              {t("newEntry")}
            </h2>
            <p className="mt-1 text-[13px] text-app-dim">{t("newEntryHint")}</p>
          </div>

          <Field label={t("amount")}>
            {(props) => (
              <TextInput
                {...props}
                inputMode="numeric"
                value={amount}
                onChange={(event) =>
                  setAmount(event.target.value.replace(/\D/g, ""))
                }
                placeholder="0"
                className="h-12 text-right font-mono"
              />
            )}
          </Field>

          <Field label={t("category")}>
            {(props) => (
              <Select
                {...props}
                value={category}
                onChange={(value) => setCategory(value as ExpenseCategory)}
                options={EXPENSE_CATEGORIES.map((key) => ({
                  value: key,
                  label: t(`categories.${key}`),
                }))}
              />
            )}
          </Field>

          <Field label={t("comment")}>
            {(props) => (
              <textarea
                {...props}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={3}
                placeholder={t("commentPlaceholder")}
                className="w-full resize-y rounded-card border-[1.5px] border-app-line-strong bg-app-card px-4 py-3 font-medium text-app-ink transition-[border-color,box-shadow] duration-150 outline-none placeholder:text-app-dim-2 focus:border-app-sapphire focus:shadow-[0_0_0_4px_rgb(15_82_186/0.10)]"
              />
            )}
          </Field>

          <ReceiptPicker value={receipt} onChange={setReceipt} />

          <Button type="submit" size="lg" disabled={!amount || saving}>
            {saving ? t("saving") : t("save")}
          </Button>
        </form>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <DataCard className="p-5">
      <Eyebrow>{label}</Eyebrow>
      <p className="mt-3 font-mono text-[26px] leading-none font-extrabold text-app-ink num">
        {value}
        <small className="ml-1.5 text-[0.5em] font-bold text-app-dim">
          {unit}
        </small>
      </p>
    </DataCard>
  );
}

function ReceiptMark({ kind }: { kind: "image" | "pdf" | null }) {
  const t = useTranslations("app.expenses");

  if (!kind) {
    return (
      <span className="text-[12px] font-semibold text-app-dim-2">
        {t("noReceipt")}
      </span>
    );
  }

  const Icon = kind === "pdf" ? FileText : ImageIcon;

  return (
    <span
      title={t(kind)}
      className="inline-flex size-8 items-center justify-center rounded-full bg-app-sapphire-soft text-app-sapphire"
    >
      <Icon className="size-4" aria-hidden />
      <span className="sr-only">{t(kind)}</span>
    </span>
  );
}

/**
 * Загрузка чека.
 *
 * Файл сейчас никуда не уезжает — эндпоинта `POST /expenses/:id/receipt`
 * ещё нет. Поэтому запоминаем только тип вложения: так список выглядит
 * так, как будет выглядеть, и при появлении эндпоинта меняется одна
 * функция, а не экран.
 */
function ReceiptPicker({
  value,
  onChange,
}: {
  value: "image" | "pdf" | null;
  onChange: (next: "image" | "pdf" | null) => void;
}) {
  const t = useTranslations("app.expenses");

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return onChange(null);
    onChange(file.type === "application/pdf" ? "pdf" : "image");
  }

  return (
    <label
      className={cn(
        "flex cursor-pointer flex-col items-center gap-2 rounded-card border-2 border-dashed px-4 py-6 text-center",
        "transition-colors duration-150",
        value
          ? "border-app-sapphire bg-app-sapphire-soft"
          : "border-app-line-strong hover:border-app-sapphire",
      )}
    >
      <Upload className="size-5 text-app-sapphire" aria-hidden />
      <span className="text-[13.5px] font-bold text-app-ink">
        {value ? t("receiptAttached") : t("uploadReceipt")}
      </span>
      <span className="text-[12px] text-app-dim">{t("uploadHint")}</span>
      <input
        type="file"
        accept="image/jpeg,image/png,application/pdf"
        onChange={handleFile}
        className="sr-only"
      />
    </label>
  );
}
