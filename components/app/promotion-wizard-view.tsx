"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Select } from "@/components/app/label-preview-view";
import { Button } from "@/components/ui/button";
import { Field, FormSection, TextInput } from "@/components/ui/field";
import { PageHead } from "@/components/ui/stat";
import { Toggle } from "@/components/ui/toggle";
import { useRouter } from "@/i18n/navigation";
import { fetchApi } from "@/lib/apiClient";
import { cn } from "@/lib/cn";

/**
 * Создание маркетинговой акции (Э-19).
 *
 * Шаги в макете разложены по четырём вкладкам, но все они помещаются на
 * одном экране, а разбиение на страницы стоит человеку четырёх кликов и
 * потери контекста. Поэтому здесь — пронумерованные блоки в одном
 * потоке (как в форме товара) плюс живая сводка справа: она и играет
 * роль четвёртого шага «Обзор».
 *
 * `POST /promotions` существует по-настоящему. Чего нет — сегментов по
 * уровням лояльности: уровней в бекенде пока не заведено (модуль 12),
 * поэтому выбранные Bronze/Silver/Gold уезжают как есть и будут
 * учтены, когда уровни появятся.
 */

const TIERS = ["bronze", "silver", "gold"] as const;
type Tier = (typeof TIERS)[number];

export function PromotionWizardView() {
  const t = useTranslations("app.promotion");
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [segmented, setSegmented] = useState(false);
  const [tiers, setTiers] = useState<Tier[]>([...TIERS]);
  const [discountType, setDiscountType] = useState("percent");
  const [value, setValue] = useState("15");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleTier(tier: Tier) {
    setTiers((prev) =>
      prev.includes(tier)
        ? prev.filter((item) => item !== tier)
        : [...prev, tier],
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (name.trim().length < 2) return setError(t("errors.name"));
    if (!Number(value)) return setError(t("errors.value"));
    if (!from || !to) return setError(t("errors.period"));

    setSaving(true);
    try {
      await fetchApi("/promotions", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          ...(description.trim() ? { description: description.trim() } : {}),
          type: discountType === "percent" ? "PERCENT" : "FIXED",
          value: Number(value),
          startsAt: from,
          endsAt: to,
          ...(segmented ? { tiers } : {}),
        }),
      });
      router.push("/loyalty");
    } catch (err: unknown) {
      setError(
        err instanceof Error && err.message ? err.message : t("errors.generic"),
      );
      setSaving(false);
    }
  }

  const badge =
    discountType === "percent"
      ? t("badgePercent", { value: value || "0" })
      : t("badgeFixed", { value: value || "0" });

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <PageHead eyebrow={t("eyebrow")} title={t("title")} />

      <div className="grid gap-5 desktop:grid-cols-[1fr_300px]">
        <div className="flex flex-col gap-5">
          <FormSection step={1} title={t("basics")} hint={t("basicsHint")}>
            <div className="flex flex-col gap-4">
              <Field label={t("name")}>
                {(props) => (
                  <TextInput
                    {...props}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder={t("namePlaceholder")}
                  />
                )}
              </Field>

              <Field label={t("description")}>
                {(props) => (
                  <textarea
                    {...props}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={3}
                    placeholder={t("descriptionPlaceholder")}
                    className="w-full resize-y rounded-card border-[1.5px] border-app-line-strong bg-app-card px-4 py-3 font-medium text-app-ink transition-[border-color,box-shadow] duration-150 outline-none placeholder:text-app-dim-2 focus:border-app-sapphire focus:shadow-[0_0_0_4px_rgb(15_82_186/0.10)]"
                  />
                )}
              </Field>

              <div className="grid gap-4 tablet:grid-cols-2">
                <Field label={t("from")}>
                  {(props) => (
                    <TextInput
                      {...props}
                      type="date"
                      value={from}
                      onChange={(event) => setFrom(event.target.value)}
                    />
                  )}
                </Field>
                <Field label={t("to")}>
                  {(props) => (
                    <TextInput
                      {...props}
                      type="date"
                      value={to}
                      onChange={(event) => setTo(event.target.value)}
                    />
                  )}
                </Field>
              </div>
            </div>
          </FormSection>

          <FormSection step={2} title={t("audience")} hint={t("audienceHint")}>
            <div className="flex flex-col gap-4">
              <Toggle
                label={t("segmented")}
                hint={t("segmentedHint")}
                checked={segmented}
                onChange={setSegmented}
              />

              {segmented ? (
                <div className="flex flex-wrap gap-2">
                  {TIERS.map((tier) => {
                    const active = tiers.includes(tier);
                    return (
                      <button
                        key={tier}
                        type="button"
                        onClick={() => toggleTier(tier)}
                        aria-pressed={active}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-bold",
                          "transition-colors duration-150",
                          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-sapphire",
                          active
                            ? "border-app-sapphire bg-app-sapphire-soft text-app-sapphire"
                            : "border-app-line-strong bg-app-card text-app-dim",
                        )}
                      >
                        {active ? (
                          <Check className="size-3.5" aria-hidden />
                        ) : null}
                        {t(`tiers.${tier}`)}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </FormSection>

          <FormSection step={3} title={t("reward")} hint={t("rewardHint")}>
            <div className="grid gap-4 tablet:grid-cols-2">
              <Field label={t("discountType")}>
                {(props) => (
                  <Select
                    {...props}
                    value={discountType}
                    onChange={setDiscountType}
                    options={[
                      { value: "percent", label: t("types.percent") },
                      { value: "fixed", label: t("types.fixed") },
                    ]}
                  />
                )}
              </Field>
              <Field label={t("value")}>
                {(props) => (
                  <TextInput
                    {...props}
                    inputMode="numeric"
                    value={value}
                    onChange={(event) =>
                      setValue(event.target.value.replace(/\D/g, ""))
                    }
                    className="text-right font-mono"
                  />
                )}
              </Field>
            </div>
          </FormSection>

          {error ? (
            <p
              role="alert"
              className="rounded-card bg-app-out-soft px-4 py-3.5 text-[13.5px] font-semibold text-app-out"
            >
              {error}
            </p>
          ) : null}
        </div>

        {/* ── Живая сводка = шаг 4 «Обзор» ──────────────────────── */}
        <aside className="flex h-fit flex-col gap-4 rounded-frame border border-app-line bg-app-card p-5">
          <h2 className="text-[17px] font-extrabold tracking-[-0.015em] text-app-ink">
            {t("summary")}
          </h2>

          <p className="rounded-card bg-app-sapphire px-4 py-3 text-[19px] font-extrabold text-white">
            {badge}
          </p>

          <dl className="flex flex-col gap-2.5 text-[13.5px]">
            <Row label={t("summaryName")} value={name || "—"} />
            <Row
              label={t("summaryAudience")}
              value={
                segmented
                  ? tiers.map((tier) => t(`tiers.${tier}`)).join(", ") || "—"
                  : t("allCustomers")
              }
            />
            <Row
              label={t("summaryPeriod")}
              value={from && to ? `${from} — ${to}` : "—"}
            />
          </dl>

          <Button type="submit" size="lg" disabled={saving}>
            {saving ? t("starting") : t("start")}
          </Button>
        </aside>
      </div>
    </form>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
      <dt className="text-app-dim">{label}</dt>
      <dd className="font-semibold text-app-ink">{value}</dd>
    </div>
  );
}
