"use client";

import { Check, ChevronLeft, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { ChoiceCard, Field, TextInput } from "@/components/ui/field";
import { Link, useRouter } from "@/i18n/navigation";
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

const STEPS = ["welcome", "name", "type", "modules"] as const;
const TOTAL_STEPS = STEPS.length;

/**
 * Мастер создания магазина в 4 шага: приветствие → название →
 * тип бизнеса → нужные функции. В конце `POST /tenants`, затем на каждую
 * выбранную платную функцию `POST /billing/subscribe` (MVP: настоящей
 * оплаты нет — модуль включается как 14-дневный TRIAL, поэтому отдельной
 * страницы «оплата» нет, она была бы пустой).
 *
 * `businessType` (шаг 3) в бэкенде пока не хранится — остаётся только на
 * клиенте, как `role`/`neededModules` старой формы.
 *
 * Дизайн (Этап 19): один вопрос на шаг. Полоса прогресса подписана
 * названиями шагов, а не только процентами: «шаг 2 из 4» говорит, сколько
 * осталось, но не говорит, что будет дальше, и человек не понимает, стоит
 * ли начинать. Кнопка продолжения — янтарная и на всю ширину: на этом
 * экране она всегда единственное главное действие.
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

  useEffect(() => {
    fetchApi("/me")
      .then((me) =>
        setHasStores(Array.isArray(me?.profiles) && me.profiles.length > 0),
      )
      .catch(() => {
        // Не смогли выяснить — не показываем ссылку, чем вести в пустой список.
      });
  }, []);

  useEffect(() => {
    fetchApi("/billing/plans")
      .then(({ plans: allPlans }: { plans: Plan[] }) => {
        setPlans(
          allPlans.filter((p) => !p.includedWithRegistration && !p.comingSoon),
        );
      })
      .catch(() => {
        // Тарифы нужны только для показа на шаге 4 — если не пришли,
        // шаг 4 рисуется без флажков, поток это не ломает.
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

      // Коллизия slug (маловероятна — он случайный) — пробуем несколько
      // раз с новым slug, чтобы пользователь этого не увидел.
      while (!tenant && attempt < 3) {
        attempt += 1;
        try {
          const { tenant: created } = await fetchApi("/tenants", {
            method: "POST",
            body: JSON.stringify({
              name: name.trim(),
              slug: slugify(name),
              industry: "CLOTHING",
            }),
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

      // Выбранные платные модули — MVP: 14 дней TRIAL, без реальной оплаты.
      // Ошибка одного модуля не рвёт поток — владелец повторит из дашборда.
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
    <div className="flex min-w-0 flex-col p-6 tablet:p-12">
      <Progress step={step} />

      <div className="flex flex-1 flex-col justify-center pt-9">
        {step === 1 ? (
          <div className="text-center">
            <span
              aria-hidden
              className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-app-gold-soft text-app-gold"
            >
              <Sparkles className="size-7" />
            </span>
            <h1 className="mt-6 text-[30px] leading-tight font-extrabold tracking-[-0.03em] text-balance">
              {t("welcome.heading")}
            </h1>
            <p className="mt-3 text-body leading-normal text-pretty text-app-dim">
              {t("welcome.lead")}
            </p>
          </div>
        ) : null}

        {step === 2 ? (
          <div>
            <StepHead
              heading={t("storeName.heading")}
              lead={t("storeName.lead")}
            />
            <Field label={t("storeName.label")} error={error} className="mt-8">
              {(props) => (
                <TextInput
                  {...props}
                  type="text"
                  autoFocus
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    if (error) setError(null);
                  }}
                  placeholder={t("storeName.placeholder")}
                />
              )}
            </Field>
          </div>
        ) : null}

        {step === 3 ? (
          <div>
            <StepHead
              heading={t("businessType.heading")}
              lead={t("businessType.lead")}
            />
            <div className="mt-8 flex flex-col gap-3">
              {BUSINESS_TYPES.map((type) => {
                const key = type.toLowerCase();
                const selected = businessType === type;

                return (
                  <ChoiceCard
                    key={type}
                    selected={selected}
                    title={t(`businessType.${key}.name`)}
                    description={t(`businessType.${key}.desc`)}
                    onClick={() => setBusinessType(type)}
                    right={
                      selected ? (
                        <Check
                          className="size-5 shrink-0 text-app-sapphire"
                          aria-hidden
                        />
                      ) : null
                    }
                  />
                );
              })}
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div>
            <StepHead
              heading={t("features.heading")}
              lead={t("features.lead")}
            />

            <div className="mt-8 flex flex-col gap-3">
              {plans.map((plan) => {
                const checked = selectedModules.includes(plan.key);

                return (
                  <ChoiceCard
                    key={plan.key}
                    selected={checked}
                    title={plan.name}
                    description={plan.description}
                    onClick={() => toggleModule(plan.key)}
                    right={
                      <span className="flex shrink-0 items-center gap-3">
                        <span className="font-mono text-[13px] font-bold whitespace-nowrap text-app-dim tabular-nums">
                          {plan.pricePerMonth} {t("features.priceSuffix")}
                        </span>
                        <span
                          aria-hidden
                          className={cn(
                            "flex size-6 items-center justify-center rounded-md border-[1.5px] transition-colors duration-150",
                            checked
                              ? "border-app-sapphire bg-app-sapphire text-white"
                              : "border-app-line-strong",
                          )}
                        >
                          {checked ? <Check className="size-3.5" /> : null}
                        </span>
                      </span>
                    }
                  />
                );
              })}

              {plans.length > 0 ? (
                <p className="mt-1 text-center text-[13px] text-app-dim-2">
                  {t("features.trialNote", { days: 14 })}
                </p>
              ) : null}
            </div>

            {error ? (
              <p role="alert" className="mt-4 text-center text-sm text-app-out">
                {error}
              </p>
            ) : null}
          </div>
        ) : null}

        {/* ── Действия ──────────────────────────────────────────── */}
        <div className="mt-9 flex items-center gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={goBack}
              disabled={loading}
              aria-label={t("back")}
              className="flex h-15 w-15 shrink-0 items-center justify-center rounded-card border-[1.5px] border-app-line-strong text-app-dim transition-colors duration-150 hover:border-app-sapphire hover:text-app-sapphire focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-sapphire disabled:pointer-events-none disabled:opacity-50"
            >
              <ChevronLeft className="size-5" aria-hidden />
            </button>
          ) : null}

          <Button
            size="xl"
            onClick={step === TOTAL_STEPS ? handleFinish : goNext}
            disabled={loading}
            className="w-full flex-1"
          >
            {step === 1
              ? t("welcome.cta")
              : step === 2
                ? t("storeName.cta")
                : step === 3
                  ? t("businessType.cta")
                  : loading
                    ? t("features.ctaLoading")
                    : t("features.cta")}
          </Button>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
          {hasStores ? (
            <Link
              href="/stores"
              className="text-sm font-semibold text-app-dim transition-colors hover:text-app-sapphire"
            >
              {t("backToStores")}
            </Link>
          ) : null}
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm font-semibold text-app-dim transition-colors hover:text-app-sapphire"
          >
            {t("logout")}
          </button>
        </div>
      </div>
    </div>
  );
}

function StepHead({ heading, lead }: { heading: string; lead: string }) {
  return (
    <div>
      <h1 className="text-[26px] leading-tight font-extrabold tracking-[-0.028em] text-balance">
        {heading}
      </h1>
      <p className="mt-2.5 text-body leading-normal text-pretty text-app-dim">
        {lead}
      </p>
    </div>
  );
}

/**
 * Полоса прогресса с подписанными шагами.
 *
 * Названия видны только на широком экране: на телефоне четыре подписи
 * либо режутся, либо мельчают до нечитаемого. Там остаётся «шаг 2 из 4»
 * и сама полоса — этого хватает, чтобы понять, сколько осталось.
 */
function Progress({ step }: { step: number }) {
  const t = useTranslations("onboarding");

  return (
    <div>
      <div className="flex h-1.5 gap-1.5">
        {STEPS.map((key, index) => (
          <span
            key={key}
            className={cn(
              "h-full flex-1 rounded-full transition-colors duration-200",
              index < step ? "bg-app-sapphire" : "bg-app-track",
            )}
          />
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between gap-4">
        <span className="text-[12.5px] font-bold text-app-dim-2">
          {t("stepLabel", { current: step, total: TOTAL_STEPS })}
        </span>
        <span className="hidden text-[12.5px] font-bold text-app-sapphire tablet:block">
          {t(`steps.${STEPS[step - 1]}`)}
        </span>
      </div>
    </div>
  );
}
