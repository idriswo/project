"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { Select } from "@/components/app/label-preview-view";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { MockNotice } from "@/components/ui/mock-notice";
import { Modal } from "@/components/ui/modal";
import { DataCard, Eyebrow, PageHead } from "@/components/ui/stat";
import { SignedMoney } from "@/components/ui/status";
import { DataTable, Td, Th } from "@/components/ui/table";
import {
  fetchSupplierInvoices,
  fetchSuppliers,
  fetchSuppliersSummary,
  paySupplier,
  type Supplier,
  type SupplierInvoice,
  type SuppliersSummary,
} from "@/lib/api/suppliers";
import { money } from "@/lib/format";

/**
 * Взаиморасчёты с поставщиками (Э-08).
 *
 * Долг — минус, переплата — плюс, и знак печатается всегда: по одному
 * цвету направление не читается, а ошибиться здесь дорого.
 */
export function SuppliersView() {
  const t = useTranslations("app.suppliers");
  const [summary, setSummary] = useState<SuppliersSummary | null>(null);
  const [items, setItems] = useState<Supplier[]>([]);
  const [paying, setPaying] = useState<Supplier | null>(null);

  const load = useCallback(() => {
    fetchSuppliersSummary()
      .then(setSummary)
      .catch(() => {});
    fetchSuppliers()
      .then(setItems)
      .catch(() => {});
  }, []);

  useEffect(load, [load]);

  return (
    <div className="flex flex-col gap-6">
      <PageHead eyebrow={t("eyebrow")} title={t("title")} />
      <MockNotice text={t("mock")} />

      <div className="grid gap-4 tablet:grid-cols-3">
        <DataCard className="p-5">
          <Eyebrow>{t("totalDebt")}</Eyebrow>
          <p className="mt-3 font-mono text-[26px] leading-none font-extrabold text-app-out num">
            {money(summary?.totalDebt)}
            <small className="ml-1.5 text-[0.5em] font-bold text-app-dim">
              TJS
            </small>
          </p>
        </DataCard>
        <DataCard className="p-5">
          <Eyebrow>{t("dueThisWeek")}</Eyebrow>
          <p className="mt-3 font-mono text-[26px] leading-none font-extrabold text-app-ink num">
            {money(summary?.dueThisWeek)}
            <small className="ml-1.5 text-[0.5em] font-bold text-app-dim">
              TJS
            </small>
          </p>
        </DataCard>
        <DataCard className="p-5">
          <Eyebrow>{t("lastPayment")}</Eyebrow>
          <p className="mt-3 font-mono text-[20px] leading-none font-extrabold text-app-ink num">
            {money(summary?.lastPayment?.amount)}
          </p>
          <p className="mt-2 text-[13px] text-app-dim">
            {summary?.lastPayment?.date ?? "—"}
          </p>
        </DataCard>
      </div>

      <DataTable
        caption={t("title")}
        head={
          <>
            <Th>{t("supplier")}</Th>
            <Th align="right">{t("balance")}</Th>
            <Th>{t("lastShipment")}</Th>
            <Th align="right">{t("actions")}</Th>
          </>
        }
      >
        {items.map((supplier) => (
          <tr key={supplier.id}>
            <Td className="font-semibold">{supplier.name}</Td>
            <Td align="right">
              <SignedMoney
                value={supplier.balance}
                formatted={money(Math.abs(supplier.balance))}
                unit="TJS"
              />
            </Td>
            <Td numeric className="text-app-dim">
              {supplier.lastShipment}
            </Td>
            <Td align="right">
              <Button
                type="button"
                size="sm"
                onClick={() => setPaying(supplier)}
                disabled={supplier.balance >= 0}
              >
                {t("pay")}
              </Button>
            </Td>
          </tr>
        ))}
      </DataTable>

      <PaymentModal
        supplier={paying}
        onClose={() => setPaying(null)}
        onPaid={() => {
          setPaying(null);
          load();
        }}
      />
    </div>
  );
}

/**
 * Оплата поставщику.
 *
 * Список закупок с чекбоксами — не украшение: платёж должен знать, какие
 * накладные он гасит, иначе через месяц никто не скажет, за что платили.
 */
function PaymentModal({
  supplier,
  onClose,
  onPaid,
}: {
  supplier: Supplier | null;
  onClose: () => void;
  onPaid: () => void;
}) {
  const t = useTranslations("app.suppliers");
  const [invoices, setInvoices] = useState<SupplierInvoice[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("transfer");
  const [saving, setSaving] = useState(false);

  const supplierId = supplier?.id ?? null;

  useEffect(() => {
    if (!supplierId) return;
    let alive = true;

    fetchSupplierInvoices(supplierId)
      .then((rows) => alive && setInvoices(rows))
      .catch(() => {});

    return () => {
      alive = false;
    };
  }, [supplierId]);

  // Сумма подставляется из выбранных накладных: чаще всего платят ровно
  // их, а править вручную всё равно можно.
  function toggle(id: string) {
    const next = picked.includes(id)
      ? picked.filter((item) => item !== id)
      : [...picked, id];

    const sum = invoices
      .filter((invoice) => next.includes(invoice.id))
      .reduce((acc, invoice) => acc + invoice.amount, 0);

    setPicked(next);
    setAmount(sum ? String(sum) : "");
  }

  async function handlePay() {
    if (!supplier || !Number(amount)) return;
    setSaving(true);
    await paySupplier({
      supplierId: supplier.id,
      amount: Number(amount),
      method: method as "transfer" | "cash",
      invoiceIds: picked,
    });
    setSaving(false);
    setPicked([]);
    setAmount("");
    onPaid();
  }

  return (
    <Modal
      open={supplier !== null}
      onClose={onClose}
      title={t("payTitle", { name: supplier?.name ?? "" })}
      footer={
        <Button
          type="button"
          size="lg"
          className="w-full"
          disabled={!Number(amount) || saving}
          onClick={handlePay}
        >
          {saving ? t("paying") : t("confirmPayment")}
        </Button>
      }
    >
      <Field label={t("paymentAmount")}>
        {(props) => (
          <TextInput
            {...props}
            inputMode="numeric"
            value={amount}
            onChange={(event) =>
              setAmount(event.target.value.replace(/\D/g, ""))
            }
            className="h-12 text-right font-mono"
          />
        )}
      </Field>

      <Field label={t("paymentMethod")}>
        {(props) => (
          <Select
            {...props}
            value={method}
            onChange={setMethod}
            options={[
              { value: "transfer", label: t("methods.transfer") },
              { value: "cash", label: t("methods.cash") },
            ]}
          />
        )}
      </Field>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-[13px] font-bold text-app-dim">
          {t("linkedInvoices")}
        </legend>
        {invoices.map((invoice) => (
          <label
            key={invoice.id}
            className="flex cursor-pointer items-center gap-3 rounded-card border border-app-line px-3.5 py-2.5 text-[13.5px] transition-colors duration-150 hover:border-app-sapphire"
          >
            <input
              type="checkbox"
              checked={picked.includes(invoice.id)}
              onChange={() => toggle(invoice.id)}
              className="size-4.5 shrink-0 accent-[#0f52ba]"
            />
            <span className="min-w-0 flex-1 font-semibold text-app-ink">
              {t("invoice", { number: invoice.number })}
            </span>
            <span className="text-app-dim">{invoice.date}</span>
            <span className="font-mono font-bold text-app-ink num">
              {money(invoice.amount)}
            </span>
          </label>
        ))}
      </fieldset>
    </Modal>
  );
}
