"use client";

import { CreditCard, RefreshCw, Smartphone } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Select } from "@/components/app/label-preview-view";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { MockNotice } from "@/components/ui/mock-notice";
import { Segmented } from "@/components/ui/segmented";
import { DataCard, PageHead } from "@/components/ui/stat";
import {
  generateGiftCardCode,
  type GiftCardKind,
  issueGiftCard,
} from "@/lib/api/loyalty";
import { money } from "@/lib/format";

/**
 * Выпуск подарочной карты (Э-20).
 *
 * Превью карты справа обновляется при вводе суммы: карту отдают в руки,
 * и человек должен видеть, что именно он отдаст, до того как нажмёт
 * «выпустить».
 */

const PRESETS = [500, 1000, 2000, 5000];

const TERMS = ["6m", "1y", "2y"] as const;
type Term = (typeof TERMS)[number];

/** Дата окончания от сегодняшнего дня. */
function expiryFor(term: Term): string {
  const date = new Date();
  const months = term === "6m" ? 6 : term === "1y" ? 12 : 24;
  date.setMonth(date.getMonth() + months);
  return date.toISOString().slice(0, 10);
}

export function GiftCardView() {
  const t = useTranslations("app.giftCard");
  const [kind, setKind] = useState<GiftCardKind>("physical");
  const [amount, setAmount] = useState("2500");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState(generateGiftCardCode);
  const [term, setTerm] = useState<Term>("1y");
  const [issued, setIssued] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const value = Number(amount) || 0;
  const expiresAt = expiryFor(term);

  async function handleIssue() {
    if (!value) return;
    setBusy(true);
    const card = await issueGiftCard({
      kind,
      amount: value,
      code,
      customerPhone: phone || undefined,
      expiresAt,
    });
    setIssued(card.code);
    setBusy(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHead eyebrow={t("eyebrow")} title={t("title")} />
      <MockNotice text={t("mock")} />

      <Segmented
        ariaLabel={t("kind")}
        value={kind}
        onChange={setKind}
        options={[
          { value: "physical", label: t("physical") },
          { value: "digital", label: t("digital") },
        ]}
      />

      <div className="grid gap-5 desktop:grid-cols-[1fr_320px]">
        <DataCard className="flex flex-col gap-5 p-5 tablet:p-6">
          <Field label={t("customer")} hint={t("customerHint")}>
            {(props) => (
              <TextInput
                {...props}
                inputMode="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+992 900 00 00 00"
                className="font-mono"
              />
            )}
          </Field>

          <div className="grid gap-4 tablet:grid-cols-2">
            <Field label={t("amount")}>
              {(props) => (
                <TextInput
                  {...props}
                  inputMode="numeric"
                  value={amount}
                  onChange={(event) =>
                    setAmount(event.target.value.replace(/\D/g, ""))
                  }
                  className="text-right font-mono"
                />
              )}
            </Field>

            <Field label={t("code")} hint={t("codeHint")}>
              {(props) => (
                <div className="flex items-center gap-2">
                  <TextInput
                    {...props}
                    readOnly
                    value={code}
                    className="font-mono text-[13px]"
                  />
                  <button
                    type="button"
                    aria-label={t("regenerate")}
                    title={t("regenerate")}
                    onClick={() => setCode(generateGiftCardCode())}
                    className="flex size-14 shrink-0 items-center justify-center rounded-card border-[1.5px] border-app-line-strong text-app-dim transition-colors duration-150 hover:border-app-sapphire hover:text-app-sapphire focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-sapphire"
                  >
                    <RefreshCw className="size-4.5" aria-hidden />
                  </button>
                </div>
              )}
            </Field>
          </div>

          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(String(preset))}
                className="rounded-full border border-app-line bg-app-panel px-3.5 py-1.5 font-mono text-[13px] font-bold text-app-dim num transition-colors duration-150 hover:border-app-sapphire hover:text-app-sapphire focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-sapphire"
              >
                {money(preset)} TJS
              </button>
            ))}
          </div>

          <Field label={t("validity")}>
            {(props) => (
              <div className="flex flex-wrap items-center gap-3">
                <Select
                  {...props}
                  value={term}
                  onChange={(next) => setTerm(next as Term)}
                  options={TERMS.map((item) => ({
                    value: item,
                    label: t(`terms.${item}`),
                  }))}
                  className="max-w-[220px]"
                />
                <span className="font-mono text-[14px] font-bold text-app-ink num">
                  {expiresAt}
                </span>
              </div>
            )}
          </Field>

          <Button
            type="button"
            size="xl"
            disabled={!value || busy}
            onClick={handleIssue}
          >
            {busy ? t("issuing") : t("issue")}
          </Button>

          {issued ? (
            <p
              role="status"
              className="text-[13.5px] font-semibold text-app-ok"
            >
              {t("issued", { code: issued })}
            </p>
          ) : null}
        </DataCard>

        {/* ── Превью карты ──────────────────────────────────────── */}
        <div className="flex h-fit flex-col gap-4 rounded-frame bg-app-navy p-6 text-white shadow-[0_24px_50px_-28px_rgb(0_9_38/0.85)]">
          <span className="flex items-center gap-2.5 text-[13px] font-extrabold tracking-[0.18em] uppercase">
            {kind === "physical" ? (
              <CreditCard className="size-4.5" aria-hidden />
            ) : (
              <Smartphone className="size-4.5" aria-hidden />
            )}
            TIM
          </span>

          <p className="font-mono text-[34px] leading-none font-extrabold text-app-sapphire-lift num">
            {money(value)}
            <small className="ml-2 text-[0.42em] font-bold text-white/70">
              TJS
            </small>
          </p>

          <p className="text-[11.5px] font-bold tracking-[0.14em] text-navy-text uppercase">
            {t("cardLabel")}
          </p>

          <p className="border-t border-navy-rule pt-4 font-mono text-[13px] text-navy-text num">
            {code}
          </p>
          <p className="text-[12px] text-navy-dim">
            {t("validUntil")} {expiresAt}
          </p>
        </div>
      </div>
    </div>
  );
}
