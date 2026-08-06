"use client";

import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";

import { Link, useRouter } from "@/i18n/navigation";
import { fetchApi } from "@/lib/apiClient";

/**
 * Минимальнейшая форма для чеклисти "Мол илова кунед" дар dashboard —
 * як маҳсулот бо як вариант (бе андоза/ранг/категория, онҳо баъдтар
 * дар саҳифаи пурраи инвентарь илова мешаванд).
 */
export function AddProductForm() {
  const t = useTranslations("inventory.new");
  const router = useRouter();

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [quantityStore, setQuantityStore] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameId = useId();
  const priceId = useId();
  const costPriceId = useId();
  const quantityId = useId();

  function errorMessage(err: unknown): string {
    return err instanceof Error && err.message ? err.message : t("errors.generic");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError(t("errors.nameRequired"));
      return;
    }

    const priceValue = Number(price);
    if (!price || Number.isNaN(priceValue) || priceValue < 0) {
      setError(t("errors.priceRequired"));
      return;
    }

    setLoading(true);
    try {
      await fetchApi("/inventory/products", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          variants: [
            {
              price: priceValue,
              costPrice: costPrice ? Number(costPrice) : 0,
              quantityStore: quantityStore ? Number(quantityStore) : 0,
            },
          ],
        }),
      });
      router.push("/dashboard");
    } catch (err) {
      setError(errorMessage(err));
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface px-5 py-10">
      <div className="mx-auto max-w-[520px]">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-subtle transition-colors hover:text-brand-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t("back")}
        </Link>

        <div className="rounded-[20px] border border-line bg-card p-8 shadow-[0_1px_3px_rgba(0,0,0,0.08)] tablet:p-10">
          <h1 className="text-[24px] font-extrabold tracking-[-0.5px] text-balance">
            {t("heading")}
          </h1>
          <p className="mt-2 text-body leading-normal text-pretty text-subtle">{t("lead")}</p>

          <form onSubmit={handleSubmit} noValidate className="mt-7 flex flex-col gap-5">
            <div>
              <label htmlFor={nameId} className="mb-2 block text-[13px] font-bold text-muted">
                {t("nameLabel")}
              </label>
              <input
                id={nameId}
                type="text"
                autoFocus
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t("namePlaceholder")}
                className="h-15 w-full rounded-card border-[1.5px] border-field-border bg-field px-4.5 font-bold transition-[border-color,box-shadow] duration-150 outline-none placeholder:font-medium placeholder:text-field-placeholder focus:border-brand-600 focus:shadow-[0_0_0_4px_rgb(15_82_186/0.10)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor={priceId} className="mb-2 block text-[13px] font-bold text-muted">
                  {t("priceLabel")}
                </label>
                <input
                  id={priceId}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  placeholder="0"
                  className="h-15 w-full rounded-card border-[1.5px] border-field-border bg-field px-4.5 font-bold transition-[border-color,box-shadow] duration-150 outline-none focus:border-brand-600 focus:shadow-[0_0_0_4px_rgb(15_82_186/0.10)]"
                />
              </div>

              <div>
                <label
                  htmlFor={costPriceId}
                  className="mb-2 block text-[13px] font-bold text-muted"
                >
                  {t("costPriceLabel")}
                </label>
                <input
                  id={costPriceId}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  value={costPrice}
                  onChange={(event) => setCostPrice(event.target.value)}
                  placeholder="0"
                  className="h-15 w-full rounded-card border-[1.5px] border-field-border bg-field px-4.5 font-bold transition-[border-color,box-shadow] duration-150 outline-none focus:border-brand-600 focus:shadow-[0_0_0_4px_rgb(15_82_186/0.10)]"
                />
              </div>
            </div>

            <div>
              <label htmlFor={quantityId} className="mb-2 block text-[13px] font-bold text-muted">
                {t("quantityLabel")}
              </label>
              <input
                id={quantityId}
                type="number"
                inputMode="numeric"
                min={0}
                step="1"
                value={quantityStore}
                onChange={(event) => setQuantityStore(event.target.value)}
                placeholder="0"
                className="h-15 w-full rounded-card border-[1.5px] border-field-border bg-field px-4.5 font-bold transition-[border-color,box-shadow] duration-150 outline-none focus:border-brand-600 focus:shadow-[0_0_0_4px_rgb(15_82_186/0.10)]"
              />
            </div>

            {error ? (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 h-14.5 w-full rounded-card bg-accent-500 text-[17px] font-extrabold text-on-accent shadow-[0_12px_24px_-12px_rgb(242_166_35/0.7)] transition-[background,transform] duration-150 hover:-translate-y-0.5 hover:bg-accent-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 active:translate-y-0 motion-reduce:hover:translate-y-0 disabled:pointer-events-none disabled:opacity-70"
            >
              {loading ? t("ctaLoading") : t("cta")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
