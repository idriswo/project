"use client";

import { Phone, Search, UserPlus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useId, useState } from "react";

import { AppShell } from "@/components/app/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyBlock } from "@/components/ui/empty";
import { Field, TextInput } from "@/components/ui/field";
import { ListSkeleton } from "@/components/ui/skeleton";
import { DataCard, PageHead, SubStat } from "@/components/ui/stat";
import { fetchApi } from "@/lib/apiClient";
import { cn } from "@/lib/cn";
import { count, initial, money, toneOf } from "@/lib/format";
import { useAppSession } from "@/lib/session";

/**
 * Клиенты (Этап 19.16).
 *
 * Экран нужен продавцу в тот же момент, что и касса: записать долг или
 * начислить бонусы по только что пробитому чеку. Поэтому он открывается
 * с поиска, а не со списка настроек.
 *
 * Список — карточки, а не строки таблицы: «никаких таблиц с чередующимися
 * строками» — одна из красных линий заказчика на Этапе 19. Плитка с
 * инициалом даёт списку опору для глаза там, где фотографий нет.
 *
 * Долг приходит не отсюда: у `GET /customers` поля долга нет вовсе. Он
 * собирается из `GET /debts?status=OPEN` и сводится по `customerId` —
 * продавцу важно видеть «должен» до того, как он откроет карточку.
 */

interface Customer {
  id: string;
  fullName: string;
  phone: string | null;
  note: string | null;
  points: number;
  totalSpent: number;
  lastPurchaseAt: string | null;
}

interface DebtRow {
  id: string;
  remaining: number;
  customer: { id: string } | null;
}

function get<T>(endpoint: string): Promise<T> {
  return fetchApi(endpoint) as Promise<T>;
}

export function CustomersView() {
  const t = useTranslations("app.customers");
  const session = useAppSession();

  const [query, setQuery] = useState("");
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  /** `customerId` → сколько должен. Пусто, если долгов нет. */
  const [debtBy, setDebtBy] = useState<Record<string, number>>({});

  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchId = useId();

  const fetchCustomers = useCallback(
    async (search: string): Promise<Customer[]> => {
      try {
        const page = await get<{ items?: Customer[] }>(
          `/customers?limit=50${search ? `&search=${encodeURIComponent(search)}` : ""}`,
        );
        return Array.isArray(page?.items) ? page.items : [];
      } catch {
        return [];
      }
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;

    // Долги тянем один раз: они не зависят от строки поиска, а дёргать их
    // на каждую букву значило бы гонять один и тот же список впустую.
    get<{ items?: DebtRow[] }>("/debts?status=OPEN&limit=200")
      .then((page) => {
        if (cancelled) return;
        const rows = Array.isArray(page?.items) ? page.items : [];
        const sums: Record<string, number> = {};
        for (const row of rows) {
          const id = row.customer?.id;
          if (!id) continue;
          sums[id] = (sums[id] ?? 0) + (row.remaining ?? 0);
        }
        setDebtBy(sums);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(
      () => {
        fetchCustomers(query.trim()).then((rows) => {
          if (!cancelled) setCustomers(rows);
        });
      },
      query ? 250 : 0,
    );

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, fetchCustomers]);

  const all = customers ?? [];
  const owing = all.filter((c) => (debtBy[c.id] ?? 0) > 0).length;
  const debtTotal = Object.values(debtBy).reduce((sum, n) => sum + n, 0);

  async function handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError(t("errors.name"));
      return;
    }

    setSaving(true);
    try {
      await fetchApi("/customers", {
        method: "POST",
        body: JSON.stringify({
          fullName: name.trim(),
          ...(phone.trim() ? { phone: phone.trim() } : {}),
        }),
      });

      setName("");
      setPhone("");
      setAdding(false);
      setCustomers(await fetchCustomers(query.trim()));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      // Бэкенд отдаёт 409 при `@@unique([tenantId, phone])`. Показывать код
      // ошибки бессмысленно — человеку нужно знать, что делать дальше.
      setError(
        /уже|аллакай|exист|CONFLICT|409/i.test(message)
          ? t("errors.phoneTaken")
          : message || t("errors.generic"),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell storeName={session.storeName} role={session.role}>
      <div className="mx-auto flex w-full max-w-[1040px] flex-col gap-6">
        <PageHead eyebrow={t("eyebrow")} title={t("title")}>
          <Button
            size="md"
            variant={adding ? "quiet" : "primary"}
            onClick={() => {
              setAdding((v) => !v);
              setError(null);
            }}
          >
            {adding ? (
              <X className="size-4.5" aria-hidden />
            ) : (
              <UserPlus className="size-4.5" aria-hidden />
            )}
            {adding ? t("cancel") : t("add")}
          </Button>
        </PageHead>

        <DataCard className="flex flex-wrap gap-x-10 gap-y-6 p-6 tablet:p-7">
          <SubStat label={t("total")} value={count(all.length)} />
          <SubStat
            label={t("owing")}
            value={count(owing)}
            tone={owing > 0 ? "low" : "ok"}
          />
          <SubStat label={t("debtTotal")} value={money(debtTotal)} />
        </DataCard>

        {adding ? (
          <DataCard className="p-6 tablet:p-7">
            <form onSubmit={handleAdd} className="flex flex-col gap-5">
              <div className="grid gap-4 tablet:grid-cols-2">
                <Field label={t("name")} error={error}>
                  {(props) => (
                    <TextInput
                      {...props}
                      autoFocus
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (error) setError(null);
                      }}
                      placeholder={t("namePlaceholder")}
                    />
                  )}
                </Field>
                <Field label={t("phone")} hint={t("phoneHint")}>
                  {(props) => (
                    <TextInput
                      {...props}
                      type="tel"
                      inputMode="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+992 00 000 00 00"
                    />
                  )}
                </Field>
              </div>
              <Button type="submit" size="xl" disabled={saving}>
                {saving ? t("saving") : t("save")}
              </Button>
            </form>
          </DataCard>
        ) : null}

        <div className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-app-dim-2"
          />
          <label htmlFor={searchId} className="sr-only">
            {t("searchLabel")}
          </label>
          <TextInput
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="pl-12"
          />
        </div>

        {customers === null ? (
          <ListSkeleton rows={5} />
        ) : all.length === 0 ? (
          <EmptyBlock
            art="search"
            title={query ? t("empty.foundHeading") : t("empty.heading")}
            lead={query ? t("empty.foundLead") : t("empty.lead")}
            action={
              query ? null : (
                <Button size="xl" onClick={() => setAdding(true)}>
                  <UserPlus className="size-5" aria-hidden />
                  {t("add")}
                </Button>
              )
            }
          />
        ) : (
          <div className="grid gap-3 tablet:grid-cols-2">
            {all.map((customer) => {
              const debt = debtBy[customer.id] ?? 0;

              return (
                <DataCard
                  key={customer.id}
                  className="flex items-center gap-4 p-5"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "flex size-12 shrink-0 items-center justify-center rounded-card text-[18px] font-extrabold",
                      toneOf(customer.fullName),
                    )}
                  >
                    {initial(customer.fullName)}
                  </span>

                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="truncate font-bold text-app-ink">
                      {customer.fullName}
                    </span>
                    {customer.phone ? (
                      <a
                        href={`tel:${customer.phone.replace(/[^\d+]/g, "")}`}
                        className="flex items-center gap-1.5 font-mono text-[12.5px] text-app-dim transition-colors duration-150 hover:text-app-sapphire focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-sapphire"
                      >
                        <Phone className="size-3.5" aria-hidden />
                        {customer.phone}
                      </a>
                    ) : (
                      <span className="text-[12.5px] text-app-dim-2">
                        {t("noPhone")}
                      </span>
                    )}
                  </span>

                  <span className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className="font-mono text-[14px] font-bold text-app-ink tabular-nums">
                      {money(customer.totalSpent)}
                    </span>
                    {debt > 0 ? (
                      <Badge tone="out">
                        {t("owes", { amount: money(debt) })}
                      </Badge>
                    ) : customer.points > 0 ? (
                      <Badge tone="gold">
                        {t("points", { count: customer.points })}
                      </Badge>
                    ) : null}
                  </span>
                </DataCard>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
