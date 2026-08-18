"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { AppShell } from "@/components/app/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyBlock } from "@/components/ui/empty";
import { ListSkeleton } from "@/components/ui/skeleton";
import { DataCard, PageHead, SubStat } from "@/components/ui/stat";
import { fetchApi } from "@/lib/apiClient";
import { cn } from "@/lib/cn";
import { count, initial, toneOf } from "@/lib/format";
import { homeFor } from "@/lib/roles";
import { useAppSession } from "@/lib/session";

type BackendRole = "OWNER" | "STAFF";

interface StaffMember {
  id: string;
  fullName: string | null;
  phone: string | null;
  role: BackendRole;
  isActive: boolean;
}

/**
 * Сотрудники (Этап 19.20). Только владелец: `PATCH /users/:id/role` и
 * `/users/:id/active` в бэкенде закрыты `authorize(['OWNER'])`.
 *
 * Своя строка помечена и её переключатели отключены: бэкенд не даёт сменить
 * себе роль («магазин остался бы без владельца»), и ловить эту ошибку после
 * нажатия хуже, чем не дать нажать.
 *
 * Важно про роли. Бэкенд знает две — `OWNER` и `STAFF`; четыре роли
 * интерфейса (`lib/roles.ts`) пока уточняются на стороне клиента и правами
 * не являются. Поэтому экран честно говорит об этом подписью, а не делает
 * вид, что кладовщик «не сможет» открыть кассу.
 */
export function StaffView() {
  const t = useTranslations("app.staff");
  const session = useAppSession();

  const [staff, setStaff] = useState<StaffMember[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isOwner = session.role === "OWNER";

  const fetchStaff = useCallback(async (): Promise<StaffMember[]> => {
    try {
      const rows = (await fetchApi("/users")) as StaffMember[];
      return Array.isArray(rows) ? rows : [];
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    if (!isOwner) return;
    let cancelled = false;

    fetchStaff().then((rows) => {
      if (!cancelled) setStaff(rows);
    });

    return () => {
      cancelled = true;
    };
  }, [fetchStaff, isOwner]);

  async function change(
    member: StaffMember,
    body: Record<string, unknown>,
    path: "role" | "active",
  ) {
    setBusyId(member.id);
    setError(null);
    try {
      await fetchApi(`/users/${member.id}/${path}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      setStaff(await fetchStaff());
    } catch (err: unknown) {
      setError(err instanceof Error && err.message ? err.message : t("failed"));
    } finally {
      setBusyId(null);
    }
  }

  if (!isOwner) {
    return (
      <AppShell session={session}>
        <div className="mx-auto w-full max-w-[1040px]">
          <EmptyBlock
            art="search"
            title={t("noAccess.heading")}
            lead={t("noAccess.lead")}
            action={
              <Button href={homeFor(session.role)} size="xl" variant="sapphire">
                {t("noAccess.cta")}
              </Button>
            }
          />
        </div>
      </AppShell>
    );
  }

  const all = staff ?? [];
  const active = all.filter((m) => m.isActive).length;

  return (
    <AppShell session={session}>
      <div className="mx-auto flex w-full max-w-[1040px] flex-col gap-6">
        <PageHead eyebrow={t("eyebrow")} title={t("title")} />

        <DataCard className="flex flex-wrap gap-x-10 gap-y-6 p-6 tablet:p-7">
          <SubStat label={t("total")} value={count(all.length)} />
          <SubStat label={t("active")} value={count(active)} tone="ok" />
        </DataCard>

        <p className="rounded-card bg-app-panel px-5 py-4 text-[13px] leading-relaxed text-app-dim">
          {t("rolesNote")}
        </p>

        {error ? (
          <p
            role="alert"
            className="rounded-card bg-app-out-soft px-4 py-3.5 text-[13.5px] font-semibold text-app-out"
          >
            {error}
          </p>
        ) : null}

        {staff === null ? (
          <ListSkeleton rows={4} />
        ) : all.length === 0 ? (
          <EmptyBlock
            art="search"
            title={t("empty.heading")}
            lead={t("empty.lead")}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {all.map((member) => {
              const isMe = member.id === session.profileId;
              const busy = busyId === member.id;
              const name = member.fullName?.trim() || t("noName");

              return (
                <DataCard
                  key={member.id}
                  className={cn(
                    "flex flex-wrap items-center gap-x-4 gap-y-4 p-5",
                    !member.isActive && "opacity-60",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "flex size-12 shrink-0 items-center justify-center rounded-card text-[18px] font-extrabold",
                      toneOf(name),
                    )}
                  >
                    {initial(name)}
                  </span>

                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-bold text-app-ink">
                        {name}
                      </span>
                      {isMe ? <Badge tone="info">{t("you")}</Badge> : null}
                      {!member.isActive ? (
                        <Badge tone="out">{t("off")}</Badge>
                      ) : null}
                    </span>
                    <span className="font-mono text-[12.5px] text-app-dim">
                      {member.phone || t("noPhone")}
                    </span>
                  </span>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <select
                      value={member.role}
                      disabled={isMe || busy}
                      onChange={(e) =>
                        change(member, { role: e.target.value }, "role")
                      }
                      aria-label={t("roleLabel")}
                      className="h-11 rounded-card border-[1.5px] border-app-line-strong bg-app-card px-3 text-[13.5px] font-semibold text-app-ink transition-[border-color] duration-150 outline-none focus:border-app-sapphire disabled:opacity-50"
                    >
                      <option value="OWNER">{t("roles.OWNER")}</option>
                      <option value="STAFF">{t("roles.STAFF")}</option>
                    </select>

                    <Button
                      size="md"
                      variant={member.isActive ? "quiet" : "sapphire"}
                      disabled={isMe || busy}
                      onClick={() =>
                        change(member, { isActive: !member.isActive }, "active")
                      }
                    >
                      {member.isActive ? t("turnOff") : t("turnOn")}
                    </Button>
                  </div>
                </DataCard>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
