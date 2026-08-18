"use client";

import { Check, ChevronLeft, Loader2, Shirt, ShoppingCart, Utensils, Briefcase, Store } from "lucide-react";
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

type BusinessSphere = "CLOTHING" | "GROCERY" | "RESTAURANT" | "SUPERMARKET" | "HYPERMARKET" | "COMPANY";

const BUSINESS_TYPES: BusinessSphere[] = [
  "CLOTHING",
  "GROCERY",
  "RESTAURANT",
  "SUPERMARKET",
  "HYPERMARKET",
  "COMPANY",
];

const ICONS = {
  clothing: Shirt,
  grocery: ShoppingCart,
  restaurant: Utensils,
  supermarket: Store,
  hypermarket: Store,
  company: Briefcase,
};

interface Plan {
  key: string;
  name: string;
  description: string;
  pricePerMonth: number;
  includedWithRegistration: boolean;
  comingSoon: boolean;
}

const STEPS = ["welcome", "name", "modules", "setup"] as const;
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
  const [businessSphere, setBusinessSphere] = useState<BusinessSphere>("CLOTHING");
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
    fetchApi(`/billing/plans?sphere=${businessSphere}`)
      .then(({ plans: allPlans }: { plans: Plan[] }) => {
        setPlans(
          allPlans.filter((p) => !p.includedWithRegistration && !p.comingSoon),
        );
      })
      .catch(() => {
        setPlans([]);
      });
  }, [businessSphere]);

  function errorMessage(err: unknown): string {
    return err instanceof Error && err.message
      ? err.message
      : t("errors.generic");
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

    if (step === 3) {
      setStep(4);
      handleFinish();
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
              sphere: businessSphere,
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
            body: JSON.stringify({ moduleKey: moduleKey.toUpperCase() }),
          }),
        ),
      );

      // Искусственная задержка для вау-эффекта "магии настройки"
      await new Promise((r) => setTimeout(r, 2000));

      setLoading(false);
      // Пауза перед редиректом, чтобы показать надпись "Готово!"
      await new Promise((r) => setTimeout(r, 500));

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
    <div className="flex min-w-0 flex-col p-6 tablet:p-8 tablet:px-10">
      <Progress step={step} />

      <div className="flex flex-1 flex-col justify-center pt-6">
        {step === 1 ? (
          <div className="flex flex-col min-h-0">
            <StepHead
              heading={t("businessType.heading")}
              lead={t("businessType.lead")}
            />
            <div className="mt-6 grid grid-cols-1 gap-3 tablet:grid-cols-2 overflow-y-auto custom-scrollbar pr-2 -mr-2 pb-2">
              {BUSINESS_TYPES.map((type) => {
                const key = type.toLowerCase() as keyof typeof ICONS;
                const selected = businessSphere === type;
                const Icon = ICONS[key];

                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setBusinessSphere(type)}
                    className={cn(
                      "group relative flex flex-col items-start gap-3 rounded-card border-[1.5px] p-4 text-left transition-all duration-200",
                      selected
                        ? "border-app-sapphire bg-app-sapphire/5 ring-1 ring-app-sapphire/20"
                        : "border-app-line hover:border-app-line-strong hover:bg-surface",
                    )}
                  >
                    <div
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors",
                        selected
                          ? "bg-app-sapphire text-white"
                          : "bg-surface text-app-dim group-hover:text-app-ink",
                      )}
                    >
                      <Icon className="size-4.5" />
                    </div>
                    <div>
                      <h3
                        className={cn(
                          "font-bold leading-tight",
                          selected ? "text-app-sapphire" : "text-app-ink",
                        )}
                      >
                        {t(`businessType.${key}.name`)}
                      </h3>
                      <p className="mt-1 text-[13.5px] leading-snug text-app-dim">
                        {t(`businessType.${key}.desc`)}
                      </p>
                    </div>
                    {selected && (
                      <div className="absolute top-5 right-5 text-app-sapphire">
                        <Check className="size-5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
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
          <div className="flex flex-col min-h-0">
            <StepHead
              heading={t("features.heading")}
              lead={t("features.lead")}
            />

            <div className="mt-8 flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-2 -mr-2 pb-2">
              {plans.length === 0 && (
                <p className="text-sm text-app-dim">Модули загружаются или недоступны для данной сферы.</p>
              )}
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

              <p className="mt-1 text-center text-[13px] text-app-dim-2 shrink-0">
                {t("features.trialNote", { days: 14 })}
              </p>
            </div>

            {error ? (
              <p role="alert" className="mt-4 text-center text-sm text-app-out">
                {error}
              </p>
            ) : null}
          </div>
        ) : null}

        {step === 4 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            {loading ? (
              <Loader2 className="size-12 animate-spin text-app-sapphire" />
            ) : (
              <div className="flex size-12 items-center justify-center rounded-full bg-app-sapphire text-white">
                <Check className="size-6" />
              </div>
            )}
            <h2 className="mt-8 text-[26px] font-extrabold tracking-tight text-app-ink">
              {t("setupMagic.heading")}
            </h2>
            <p className="mt-2 text-body text-app-dim">
              {loading
                ? t(`setupMagic.${businessSphere.toLowerCase()}`, { fallback: t("setupMagic.final") })
                : t("setupMagic.final")}
            </p>
          </div>
        ) : null}

        {/* ── Действия ──────────────────────────────────────────── */}
        {step < 4 ? (
          <div className="mt-6 flex items-center gap-3">
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
              onClick={goNext}
              disabled={loading}
              className="w-full flex-1"
            >
              {step === 1
                ? t("businessType.cta")
                : step === 2
                  ? t("storeName.cta")
                  : t("features.cta")}
            </Button>
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
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
