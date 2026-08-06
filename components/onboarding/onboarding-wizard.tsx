"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useEffect, useId, useState } from "react";

import { setActiveTenantId } from "@/lib/activeTenant";
import { fetchApi } from "@/lib/apiClient";
import { cn } from "@/lib/cn";
import { slugify } from "@/lib/slug";
import { supabase } from "@/lib/supabase";

type BusinessType = "RETAIL" | "WHOLESALE" | "NETWORK";

const BUSINESS_TYPES: BusinessType[] = ["RETAIL", "WHOLESALE", "NETWORK"];

interface Plan {
  key: string;
  name: string;
  description: string;
  pricePerMonth: number;
  includedWithRegistration: boolean;
  comingSoon: boolean;
}

const TOTAL_STEPS = 4;

/**
 * Мастер створення дӯкон дар 4 қадам: хушомадгӯӣ → номи мағоза →
 * намуди тиҷорат → функсияҳои лозима. Дар охир `POST /tenants`, баъд
 * барои ҳар функсияи пулакии интихобшуда `POST /billing/subscribe`
 * (MVP: пардохти воқеӣ нест — модул ҳамчун 14-рӯза TRIAL фаъол мешавад,
 * бинобар ин саҳифаи алоҳидаи "checkout" сохта нашуд — он ҷои холии
 * бидуни маъно мешуд).
 *
 * `businessType` (Қадам 3) дар backend ҳанӯз ҷой надорад — танҳо дар
 * интерфейс сабт мешавад, монанди `role`/`neededModules`-и шакли кӯҳна.
 */
export function OnboardingWizard() {
  const t = useTranslations("onboarding");
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [businessType, setBusinessType] = useState<BusinessType>("RETAIL");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Есть ли куда возвращаться: сюда попадают и с пустым аккаунтом, и по «Создать ещё». */
  const [hasStores, setHasStores] = useState(false);

  const nameInputId = useId();

  useEffect(() => {
    fetchApi("/me")
      .then((me) => setHasStores(Array.isArray(me?.profiles) && me.profiles.length > 0))
      .catch(() => {
        // Не смогли выяснить — не показываем ссылку, чем вести в пустой список.
      });
  }, []);

  useEffect(() => {
    fetchApi("/billing/plans")
      .then(({ plans: allPlans }: { plans: Plan[] }) => {
        setPlans(allPlans.filter((p) => !p.includedWithRegistration && !p.comingSoon));
      })
      .catch(() => {
        // Тарифҳо танҳо барои намоиш дар қадами 4 лозиманд — агар нашуд,
        // қадами 4 бе чекбокс нишон дода мешавад, ин ҷараёнро намебандад.
      });
  }, []);

  function errorMessage(err: unknown): string {
    return err instanceof Error && err.message ? err.message : t("errors.generic");
  }

  function toggleModule(key: string) {
    setSelectedModules((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  function goNext() {
    setError(null);

    if (step === 2 && name.trim().length < 2) {
      setError(t("storeName.errorShort"));
      return;
    }

    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  }

  function goBack() {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  }

  async function handleFinish() {
    setError(null);
    setLoading(true);

    try {
      let tenant: { id: string } | null = null;
      let attempt = 0;

      // Коллизияи slug (хеле кам эҳтимол дорад — тасодуфист) — якчанд бор
      // бо slug-и нав кӯшиш мекунем, то корбар онро набинад.
      while (!tenant && attempt < 3) {
        attempt += 1;
        try {
          const { tenant: created } = await fetchApi("/tenants", {
            method: "POST",
            body: JSON.stringify({ name: name.trim(), slug: slugify(name), industry: "CLOTHING" }),
          });
          tenant = created;
        } catch (err) {
          const message = errorMessage(err);
          const isSlugConflict = message.includes("кӯтоҳ");
          if (!isSlugConflict || attempt >= 3) throw err;
        }
      }

      if (tenant) {
        setActiveTenantId(tenant.id);
      }

      // Модулҳои пулакии интихобшуда — MVP: 14 рӯз TRIAL, бе пардохти воқеӣ.
      // Хатои алоҳидаи як модул ҷараёнро намебандад — соҳиб баъдтар аз
      // dashboard дубора кӯшиш карда метавонад.
      await Promise.allSettled(
        selectedModules.map((moduleKey) =>
          fetchApi("/billing/subscribe", {
            method: "POST",
            body: JSON.stringify({ moduleKey }),
          }),
        ),
      );

      router.push("/dashboard");
    } catch (err) {
      setError(errorMessage(err));
      setLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/auth");
  }

  return (
    <div className="flex min-w-0 flex-col p-6 tablet:p-14">
      <div className="mb-8.5">
        <div className="mb-2 flex items-center justify-between text-[13px] font-semibold text-subtle">
          <span>{t("stepLabel", { current: step, total: TOTAL_STEPS })}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-brand-600 transition-[width] duration-300 ease-out"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-center">
        {step === 1 ? (
          <div className="text-center">
            <h1 className="text-[30px] font-extrabold tracking-[-0.8px] text-balance">
              {t("welcome.heading")}
            </h1>
            <p className="mt-2.5 text-body leading-normal text-pretty text-subtle">
              {t("welcome.lead")}
            </p>
            <button
              type="button"
              onClick={goNext}
              className="mt-8.5 h-14.5 w-full rounded-card bg-accent-500 text-[17px] font-extrabold text-on-accent shadow-[0_12px_24px_-12px_rgb(242_166_35/0.7)] transition-[background,transform] duration-150 hover:-translate-y-0.5 hover:bg-accent-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 active:translate-y-0 motion-reduce:hover:translate-y-0"
            >
              {t("welcome.cta")}
            </button>
          </div>
        ) : null}

        {step === 2 ? (
          <div>
            <div className="text-center">
              <h1 className="text-[26px] font-extrabold tracking-[-0.6px] text-balance">
                {t("storeName.heading")}
              </h1>
              <p className="mt-2.5 text-body leading-normal text-pretty text-subtle">
                {t("storeName.lead")}
              </p>
            </div>

            <div className="mt-8.5">
              <label
                htmlFor={nameInputId}
                className="mb-2.5 block text-[13px] font-bold tracking-[0.2px] text-muted"
              >
                {t("storeName.label")}
              </label>
              <input
                id={nameInputId}
                type="text"
                autoFocus
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  if (error) setError(null);
                }}
                placeholder={t("storeName.placeholder")}
                aria-invalid={error ? true : undefined}
                className="h-15 w-full rounded-card border-[1.5px] border-field-border bg-field px-4.5 font-bold transition-[border-color,box-shadow] duration-150 outline-none placeholder:font-medium placeholder:text-field-placeholder focus:border-brand-600 focus:shadow-[0_0_0_4px_rgb(15_82_186/0.10)]"
              />
              {error ? (
                <p role="alert" className="mt-2.5 text-sm text-danger">
                  {error}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div>
            <div className="text-center">
              <h1 className="text-[26px] font-extrabold tracking-[-0.6px] text-balance">
                {t("businessType.heading")}
              </h1>
              <p className="mt-2.5 text-body leading-normal text-pretty text-subtle">
                {t("businessType.lead")}
              </p>
            </div>

            <div className="mt-8.5 flex flex-col gap-3">
              {BUSINESS_TYPES.map((type) => {
                const isSelected = businessType === type;
                const key = type.toLowerCase();

                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setBusinessType(type)}
                    aria-pressed={isSelected}
                    className={cn(
                      "flex items-center justify-between rounded-card border-[1.5px] px-5 py-4 text-left transition-[border-color,box-shadow,background] duration-150",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
                      isSelected
                        ? "border-brand-600 bg-brand-50 shadow-[0_10px_22px_-14px_rgb(15_82_186/0.5)]"
                        : "border-field-border bg-card hover:border-brand-600 hover:shadow-[0_10px_22px_-14px_rgb(15_82_186/0.5)]",
                    )}
                  >
                    <span>
                      <span className="block font-extrabold text-ink">
                        {t(`businessType.${key}.name`)}
                      </span>
                      <span className="mt-0.5 block text-sm text-subtle">
                        {t(`businessType.${key}.desc`)}
                      </span>
                    </span>
                    {isSelected ? (
                      <Check className="size-5 shrink-0 text-brand-ink" aria-hidden />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div>
            <div className="text-center">
              <h1 className="text-[26px] font-extrabold tracking-[-0.6px] text-balance">
                {t("features.heading")}
              </h1>
              <p className="mt-2.5 text-body leading-normal text-pretty text-subtle">
                {t("features.lead")}
              </p>
            </div>

            <div className="mt-8.5 flex flex-col gap-3">
              {plans.map((plan) => {
                const isChecked = selectedModules.includes(plan.key);

                return (
                  <label
                    key={plan.key}
                    className={cn(
                      "flex cursor-pointer items-center gap-3.5 rounded-card border-[1.5px] px-5 py-4 transition-[border-color,box-shadow] duration-150",
                      isChecked
                        ? "border-brand-600 bg-brand-50"
                        : "border-field-border bg-card hover:border-brand-600",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleModule(plan.key)}
                      className="size-5 shrink-0 rounded border-field-border text-brand-600 focus:ring-brand-600"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block font-extrabold text-ink">{plan.name}</span>
                      <span className="mt-0.5 block text-sm text-subtle">{plan.description}</span>
                    </span>
                    <span className="shrink-0 text-sm font-bold whitespace-nowrap text-brand-ink">
                      {plan.pricePerMonth} {t("features.priceSuffix")}
                    </span>
                  </label>
                );
              })}

              {plans.length > 0 ? (
                <p className="mt-1 text-center text-sm text-subtle">
                  {t("features.trialNote", { days: 14 })}
                </p>
              ) : null}
            </div>

            {error ? (
              <p role="alert" className="mt-4 text-center text-sm text-danger">
                {error}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-8.5 flex items-center gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={goBack}
              disabled={loading}
              className="h-14.5 rounded-card border-[1.5px] border-field-border px-6 font-bold text-ink transition-colors duration-150 hover:border-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:pointer-events-none disabled:opacity-70"
            >
              {t("back")}
            </button>
          ) : null}

          {step > 1 && step < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={goNext}
              className="h-14.5 flex-1 rounded-card bg-accent-500 text-[17px] font-extrabold text-on-accent shadow-[0_12px_24px_-12px_rgb(242_166_35/0.7)] transition-[background,transform] duration-150 hover:-translate-y-0.5 hover:bg-accent-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 active:translate-y-0 motion-reduce:hover:translate-y-0"
            >
              {step === 2 ? t("storeName.cta") : t("businessType.cta")}
            </button>
          ) : null}

          {step === TOTAL_STEPS ? (
            <button
              type="button"
              onClick={handleFinish}
              disabled={loading}
              className="h-14.5 flex-1 rounded-card bg-accent-500 text-[17px] font-extrabold text-on-accent shadow-[0_12px_24px_-12px_rgb(242_166_35/0.7)] transition-[background,transform] duration-150 hover:-translate-y-0.5 hover:bg-accent-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 active:translate-y-0 motion-reduce:hover:translate-y-0 disabled:pointer-events-none disabled:opacity-70"
            >
              {loading ? t("features.ctaLoading") : t("features.cta")}
            </button>
          ) : null}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
          {hasStores ? (
            <Link
              href="/stores"
              className="text-sm font-semibold text-subtle transition-colors hover:text-brand-ink"
            >
              {t("backToStores")}
            </Link>
          ) : null}
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm font-semibold text-subtle transition-colors hover:text-brand-ink"
          >
            {t("logout")}
          </button>
        </div>
      </div>
    </div>
  );
}
