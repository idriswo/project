"use client";

import { Clock, CheckCircle2, PlayCircle, Flame } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { AppShell } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppSession } from "@/lib/session";
import { cn } from "@/lib/cn";

type OrderStatus = "new" | "prep" | "ready";
interface OrderItem {
  id: string;
  name: string;
  qty: number;
  modifiers?: string[];
}
interface Order {
  id: string;
  table: string;
  status: OrderStatus;
  time: number;
  items: OrderItem[];
}

const INITIAL_ORDERS: Order[] = [
  {
    id: "ORD-001",
    table: "T-12",
    status: "new",
    time: 2,
    items: [
      { id: "i1", name: "Оши палов (Девзира)", qty: 2, modifiers: ["Бе пиёз", "Гӯшти зиёд"] },
      { id: "i2", name: "Хӯриши Шакароб", qty: 1 }
    ]
  },
  {
    id: "ORD-002",
    table: "T-04",
    status: "new",
    time: 15,
    items: [
      { id: "i3", name: "Манту (Каду)", qty: 3 },
      { id: "i4", name: "Чои сабз", qty: 1 }
    ]
  },
  {
    id: "ORD-003",
    table: "VIP-1",
    status: "prep",
    time: 25,
    items: [
      { id: "i5", name: "Шӯрбои гӯсфандӣ", qty: 4 },
      { id: "i6", name: "Нон", qty: 2 }
    ]
  },
  {
    id: "ORD-004",
    table: "T-08",
    status: "ready",
    time: 32,
    items: [
      { id: "i7", name: "Қабоб (Мурғ)", qty: 2 }
    ]
  }
];

export function KitchenView() {
  const t = useTranslations("app.nav");
  const session = useAppSession();
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);

  const moveOrder = (id: string, newStatus: OrderStatus) => {
    setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
  };

  const newOrders = orders.filter(o => o.status === "new").sort((a, b) => b.time - a.time);
  const prepOrders = orders.filter(o => o.status === "prep").sort((a, b) => b.time - a.time);
  const readyOrders = orders.filter(o => o.status === "ready").sort((a, b) => b.time - a.time);

  return (
    <AppShell session={session}>
      {/* 
        KDS Layout:
        Using calc() for height to respect AppShell's padding.
        Enclosed in a rounded dark container to stand out from the main app background.
      */}
      <div className="flex h-[calc(100dvh-160px)] desktop:h-[calc(100dvh-100px)] flex-col rounded-2xl border border-slate-800 bg-[#0b101c] p-4 shadow-xl overflow-hidden desktop:p-6">
        
        {/* Header */}
        <header className="mb-6 flex shrink-0 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-app-sapphire/20 text-app-sapphire">
              <Flame className="size-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">{t("kitchen")} (KDS)</h1>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium text-slate-400">
            <div className="flex items-center gap-1.5">
              <Clock className="size-4" />
              <span>{new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <Badge tone="info">{orders.length} Фармоиш</Badge>
          </div>
        </header>

        {/* Kanban Board */}
        <div className="flex flex-1 gap-4 overflow-x-auto min-h-0 desktop:gap-6">
          
          <Column 
            title="Нав" 
            count={newOrders.length}
            tone="danger"
          >
            {newOrders.map(order => (
              <Ticket 
                key={order.id} 
                order={order} 
                onAction={() => moveOrder(order.id, "prep")}
                actionIcon={<PlayCircle className="size-5" />}
                actionLabel="Омода кардан"
              />
            ))}
          </Column>

          <Column 
            title="Дар ҳолати тайёрӣ" 
            count={prepOrders.length}
            tone="warning"
          >
            {prepOrders.map(order => (
              <Ticket 
                key={order.id} 
                order={order} 
                onAction={() => moveOrder(order.id, "ready")}
                actionIcon={<CheckCircle2 className="size-5" />}
                actionLabel="Тайёр"
                actionVariant="sapphire"
              />
            ))}
          </Column>

          <Column 
            title="Тайёр" 
            count={readyOrders.length}
            tone="success"
          >
            {readyOrders.map(order => (
              <Ticket 
                key={order.id} 
                order={order} 
                onAction={() => setOrders(orders.filter(o => o.id !== order.id))}
                actionIcon={<CheckCircle2 className="size-5" />}
                actionLabel="Баровардан"
                actionVariant="ghost"
              />
            ))}
          </Column>
          
        </div>
      </div>
    </AppShell>
  );
}

function Column({ title, count, tone, children }: { title: string; count: number; tone: "danger"|"warning"|"success"; children: React.ReactNode }) {
  const borderColors = {
    danger: "border-red-500/30",
    warning: "border-amber-500/30",
    success: "border-emerald-500/30",
  };
  
  const textColors = {
    danger: "text-red-400",
    warning: "text-amber-400",
    success: "text-emerald-400",
  };

  return (
    <div className={cn("flex w-72 desktop:w-80 shrink-0 flex-col rounded-xl border bg-slate-900/50", borderColors[tone])}>
      <div className="flex shrink-0 items-center justify-between border-b border-slate-800 p-4">
        <h2 className={cn("font-semibold tracking-tight", textColors[tone])}>{title}</h2>
        <span className="flex size-6 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-slate-300">
          {count}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {children}
      </div>
    </div>
  );
}

function Ticket({ 
  order, 
  onAction, 
  actionIcon, 
  actionLabel,
  actionVariant = "secondary"
}: { 
  order: Order; 
  onAction: () => void;
  actionIcon: React.ReactNode;
  actionLabel: string;
  actionVariant?: "sapphire" | "secondary" | "ghost";
}) {
  const isLate = order.time > 20;

  return (
    <div className={cn(
      "flex flex-col rounded-xl border bg-slate-950 shadow-sm transition-all",
      isLate && order.status === "new" ? "border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]" : "border-slate-800"
    )}>
      <div className="flex items-center justify-between border-b border-slate-800/50 p-3">
        <div className="flex flex-col">
          <span className="text-lg font-bold text-white">{order.table}</span>
          <span className="text-xs text-slate-500">{order.id}</span>
        </div>
        <div className={cn(
          "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-bold",
          isLate && order.status === "new" ? "bg-red-500/20 text-red-400" : "bg-slate-800 text-slate-300"
        )}>
          <Clock className="size-3.5" />
          {order.time}м
        </div>
      </div>
      
      <div className="p-3">
        <ul className="space-y-3">
          {order.items.map((item, i) => (
            <li key={i} className="flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium leading-tight text-slate-200">{item.name}</span>
                <span className="shrink-0 rounded bg-slate-800 px-2 py-0.5 text-sm font-bold text-white">
                  x{item.qty}
                </span>
              </div>
              {item.modifiers && item.modifiers.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {item.modifiers.map((mod, j) => (
                    <span key={j} className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[11px] font-medium text-amber-400">
                      {mod}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto p-3 pt-0">
        <Button 
          variant={actionVariant}
          className="w-full justify-center gap-2"
          onClick={onAction}
        >
          {actionIcon}
          {actionLabel}
        </Button>
      </div>
    </div>
  );
}
