"use client";

import { useTranslations } from "next-intl";
import { Users, Clock, Receipt, Plus, X, UtensilsCrossed, ChevronRight } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppSession } from "@/lib/session";
import { cn } from "@/lib/cn";
import { count } from "@/lib/format";

type TableStatus = "free" | "occupied" | "bill";

interface Table {
  id: string;
  name: string;
  capacity: number;
  status: TableStatus;
  guests?: number;
  time?: number;
  total?: number;
}

const MOCK_TABLES: Table[] = [
  { id: "t1", name: "T-01", capacity: 4, status: "occupied", guests: 3, time: 45, total: 245.5 },
  { id: "t2", name: "T-02", capacity: 4, status: "free" },
  { id: "t3", name: "T-03", capacity: 2, status: "free" },
  { id: "t4", name: "T-04", capacity: 6, status: "bill", guests: 5, time: 82, total: 890.0 },
  { id: "v1", name: "VIP-1", capacity: 8, status: "occupied", guests: 8, time: 15, total: 1250.0 },
  { id: "v2", name: "VIP-2", capacity: 8, status: "free" },
  { id: "t5", name: "T-05", capacity: 4, status: "occupied", guests: 2, time: 5, total: 85.0 },
  { id: "t6", name: "T-06", capacity: 4, status: "free" },
];

export function TablesView() {
  const t = useTranslations("app.nav");
  const session = useAppSession();
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  const freeCount = MOCK_TABLES.filter(t => t.status === "free").length;
  const occupiedCount = MOCK_TABLES.filter(t => t.status !== "free").length;

  return (
    <AppShell session={session}>
      {/* 
        Floor Plan Layout:
        Use calculated height to fit inside AppShell.
        Rounded container to match the platform aesthetic.
      */}
      <div className="relative flex h-[calc(100dvh-160px)] desktop:h-[calc(100dvh-100px)] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
        
        {/* Main Floor Plan Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-4 desktop:px-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-app-sapphire/10 text-app-sapphire">
                <UtensilsCrossed className="size-6" />
              </div>
              <h1 className="text-xl desktop:text-2xl font-bold tracking-tight text-slate-900">{t("tables")}</h1>
            </div>
            <div className="flex items-center gap-2 desktop:gap-3">
              <Badge tone="neutral">{freeCount} Озод</Badge>
              <Badge tone="info">{occupiedCount} Банд</Badge>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 desktop:p-6 custom-scrollbar">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {MOCK_TABLES.map((table) => (
                <button
                  key={table.id}
                  onClick={() => setSelectedTable(table)}
                  className={cn(
                    "group relative flex aspect-square flex-col items-center justify-center rounded-2xl border-2 p-4 text-center transition-all hover:scale-[1.02]",
                    table.status === "free" && "border-slate-200 bg-white hover:border-slate-300",
                    table.status === "occupied" && "border-app-sapphire/20 bg-app-sapphire/5",
                    table.status === "bill" && "border-amber-500/30 bg-amber-50",
                    selectedTable?.id === table.id && "ring-4 ring-app-sapphire/20 ring-offset-2"
                  )}
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className={cn(
                      "text-2xl desktop:text-3xl font-bold tracking-tight",
                      table.status === "free" ? "text-slate-700" : 
                      table.status === "occupied" ? "text-app-sapphire" : "text-amber-600"
                    )}>
                      {table.name}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs desktop:text-sm font-medium text-slate-500">
                      <Users className="size-3.5 desktop:size-4" />
                      {table.guests ? `${table.guests} / ${table.capacity}` : `То ${table.capacity}`}
                    </div>
                  </div>

                  {table.status !== "free" && (
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-lg bg-white/90 px-2 py-1.5 backdrop-blur-sm shadow-sm">
                      <div className="flex items-center gap-1 text-[10px] desktop:text-xs font-semibold text-slate-600">
                        <Clock className="size-3" />
                        {table.time}м
                      </div>
                      <div className="text-[11px] desktop:text-xs font-bold text-slate-900">
                        {count(table.total || 0)}
                      </div>
                    </div>
                  )}

                  {table.status === "bill" && (
                    <div className="absolute -right-2 -top-2 flex size-6 desktop:size-8 items-center justify-center rounded-full bg-amber-500 text-white shadow-md shadow-amber-500/20">
                      <Receipt className="size-3.5 desktop:size-4" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </main>
        </div>

        {/* Sidebar Order Details */}
        {selectedTable && (
          <aside className="absolute inset-y-0 right-0 z-20 flex w-full flex-col border-l border-slate-200 bg-white shadow-2xl desktop:relative desktop:w-[400px] desktop:shrink-0">
            <header className="flex shrink-0 items-center justify-between border-b border-slate-100 p-4">
              <div className="flex flex-col">
                <span className="text-xl font-bold text-slate-900">{selectedTable.name}</span>
                <span className="text-sm text-slate-500">
                  {selectedTable.status === "free" ? "Мизи холӣ" : `Меҳмонон: ${selectedTable.guests}`}
                </span>
              </div>
              <button 
                onClick={() => setSelectedTable(null)}
                className="flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200"
              >
                <X className="size-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {selectedTable.status === "free" ? (
                <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                  <div className="flex size-16 items-center justify-center rounded-full bg-slate-50">
                    <UtensilsCrossed className="size-8 text-slate-300" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-slate-900">Миз холӣ аст</span>
                    <span className="text-sm text-slate-500">Меҳмонони навро ҷойгир кунед ва фармоиш гиред.</span>
                  </div>
                  <Button variant="sapphire" className="mt-2 w-full justify-center">
                    <Plus className="mr-2 size-5" />
                    Кушодани миз
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Clock className="size-4" />
                      Вақти хизмат: <span className="font-semibold text-slate-900">{selectedTable.time}м</span>
                    </div>
                  </div>

                  {/* Dummy order items */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900">Оши палов</span>
                        <span className="text-sm text-slate-500">2 x 45.00</span>
                      </div>
                      <span className="font-semibold text-slate-900">90.00</span>
                    </div>
                    <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900">Хӯриши баҳорӣ</span>
                        <span className="text-sm text-slate-500">1 x 25.50</span>
                      </div>
                      <span className="font-semibold text-slate-900">25.50</span>
                    </div>
                  </div>
                  
                  <Button variant="secondary" className="w-full justify-center bg-app-sapphire/5 text-app-sapphire hover:bg-app-sapphire/10">
                    <Plus className="mr-2 size-4" />
                    Иловаи хӯрок
                  </Button>
                </div>
              )}
            </div>

            {selectedTable.status !== "free" && (
              <footer className="shrink-0 border-t border-slate-200 bg-slate-50 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-lg font-medium text-slate-600">Ҷамъ:</span>
                  <span className="text-3xl font-bold tracking-tight text-slate-900">
                    {count(selectedTable.total || 0)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="sapphire" className="flex-1 justify-center text-lg desktop:size-14">
                    Ҳисоб кардан
                  </Button>
                  <Button variant="secondary" className="justify-center px-4 text-slate-600 hover:bg-slate-200 hover:text-slate-900 desktop:size-14">
                    <ChevronRight className="size-6" />
                  </Button>
                </div>
              </footer>
            )}
          </aside>
        )}
      </div>
    </AppShell>
  );
}
