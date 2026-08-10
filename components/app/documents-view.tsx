"use client";

import {
  ArrowLeftRight,
  Download,
  Eye,
  FileText,
  Receipt,
  RotateCcw,
  Search,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { EmptyBlock } from "@/components/ui/empty";
import { MockNotice } from "@/components/ui/mock-notice";
import { PillFilter } from "@/components/ui/segmented";
import { ListSkeleton } from "@/components/ui/skeleton";
import { PageHead } from "@/components/ui/stat";
import { SignedMoney, StatusPill } from "@/components/ui/status";
import { DataTable, Td, Th } from "@/components/ui/table";
import { Link } from "@/i18n/navigation";
import {
  type ArchiveRow,
  type DocumentType,
  fetchDocuments,
} from "@/lib/api/documents";
import { money } from "@/lib/format";

/**
 * Архив документов (Э-14).
 *
 * Это витрина поверх пяти разных сущностей — списаний, закупок,
 * Z-отчётов, перемещений и возвратов. Отдельной таблицы «документы» в
 * базе быть не должно: правда о документе живёт в его модуле, а здесь
 * только общий список с одинаковыми колонками.
 */

const ICONS: Record<DocumentType, typeof FileText> = {
  writeOff: Trash2,
  purchase: ShoppingCart,
  zReport: Receipt,
  transfer: ArrowLeftRight,
  return: RotateCcw,
};

const HREFS: Partial<Record<DocumentType, (id: string) => string>> = {
  writeOff: (id) => `/documents/write-off/${id}`,
};

type Filter = "all" | DocumentType;

export function DocumentsView() {
  const t = useTranslations("app.documents");
  const [rows, setRows] = useState<ArchiveRow[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let alive = true;
    fetchDocuments()
      .then((data) => alive && setRows(data))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const all = rows ?? [];
  const visible = all.filter((row) => {
    if (filter !== "all" && row.type !== filter) return false;
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    return (
      String(row.number).includes(needle) ||
      row.responsible.toLowerCase().includes(needle)
    );
  });

  const filters: { value: Filter; label: string; count?: number }[] = [
    { value: "all", label: t("filters.all"), count: all.length },
    ...(
      [
        "writeOff",
        "purchase",
        "zReport",
        "transfer",
        "return",
      ] as DocumentType[]
    ).map((type) => ({
      value: type,
      label: t(`types.${type}`),
      count: all.filter((row) => row.type === type).length,
    })),
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHead eyebrow={t("eyebrow")} title={t("title")}>
        <Button type="button" variant="sapphire" onClick={() => window.print()}>
          <Download className="size-[18px]" aria-hidden />
          {t("export")}
        </Button>
      </PageHead>

      <MockNotice text={t("mock")} />

      <PillFilter
        ariaLabel={t("filterLabel")}
        value={filter}
        onChange={setFilter}
        options={filters}
      />

      <label className="flex items-center gap-2.5 rounded-card border border-app-line bg-app-card px-3.5 py-2.5">
        <Search className="size-4 shrink-0 text-app-dim-2" aria-hidden />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchPlaceholder")}
          className="min-w-0 flex-1 bg-transparent text-[14px] font-medium text-app-ink outline-none placeholder:text-app-dim-2"
        />
      </label>

      {!rows ? (
        <ListSkeleton rows={5} />
      ) : visible.length === 0 ? (
        <EmptyBlock
          art="search"
          title={t("emptyTitle")}
          lead={t("emptyLead")}
        />
      ) : (
        <DataTable
          caption={t("title")}
          head={
            <>
              <Th>{t("type")}</Th>
              <Th>{t("number")}</Th>
              <Th>{t("date")}</Th>
              <Th>{t("responsible")}</Th>
              <Th align="right">{t("amount")}</Th>
              <Th>{t("status")}</Th>
              <Th align="right">{t("actions")}</Th>
            </>
          }
        >
          {visible.map((row) => {
            const Icon = ICONS[row.type];
            const href = HREFS[row.type]?.(row.id);

            return (
              <tr key={`${row.type}-${row.id}`}>
                <Td>
                  <span className="flex items-center gap-2.5 font-semibold">
                    <Icon
                      className="size-4 shrink-0 text-app-dim"
                      aria-hidden
                    />
                    {t(`types.${row.type}`)}
                  </span>
                </Td>
                <Td numeric className="text-app-dim">
                  №{row.number}
                </Td>
                <Td numeric className="whitespace-nowrap text-app-dim">
                  {row.createdAt}
                </Td>
                <Td>{row.responsible}</Td>
                <Td align="right">
                  <SignedMoney
                    value={row.amount}
                    formatted={money(Math.abs(row.amount))}
                  />
                </Td>
                <Td>
                  <StatusPill
                    tone={
                      row.status === "approved"
                        ? "info"
                        : row.status === "pending"
                          ? "low"
                          : "out"
                    }
                  >
                    {t(`statuses.${row.status}`)}
                  </StatusPill>
                </Td>
                <Td align="right">
                  {href ? (
                    <Link
                      href={href}
                      aria-label={t("open")}
                      title={t("open")}
                      className="inline-flex size-9 items-center justify-center rounded-full border border-app-line text-app-dim transition-colors duration-150 hover:border-app-sapphire hover:bg-app-sapphire-soft hover:text-app-sapphire"
                    >
                      <Eye className="size-4" aria-hidden />
                    </Link>
                  ) : (
                    /* Экранов просмотра для закупок, Z-отчётов, перемещений
                     * и возвратов ещё нет — кнопка появится вместе с ними,
                     * а не будет вести в пустоту. */
                    <span className="text-[12px] font-semibold text-app-dim-2">
                      {t("soon")}
                    </span>
                  )}
                </Td>
              </tr>
            );
          })}
        </DataTable>
      )}
    </div>
  );
}
