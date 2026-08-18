"use client";

import { useTranslations } from "next-intl";
import { CalendarClock, Plus, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";
import { useAppSession } from "@/lib/session";
import { cn } from "@/lib/cn";

interface Specialist {
  id: string;
  name: string;
  role: string;
}

interface Appointment {
  id: string;
  specialistId: string;
  clientName: string;
  phone: string;
  service: string;
  start: number;
  duration: number;
  status: "confirmed" | "progress" | "done";
}

const SPECIALISTS: Specialist[] = [
  { id: "s1", name: "Нигина А.", role: "Стилист" },
  { id: "s2", name: "Фаррух Р.", role: "Барбер" },
  { id: "s3", name: "Мадина С.", role: "Косметолог" },
  { id: "s4", name: "Шуҳрат М.", role: "Массажист" },
];

const APPOINTMENTS: Appointment[] = [
  { id: "a1", specialistId: "s1", clientName: "Зарина", phone: "900 11 22 33", service: "Ороиши мӯй", start: 10, duration: 1.5, status: "confirmed" },
  { id: "a2", specialistId: "s1", clientName: "Сабрина", phone: "918 00 11 22", service: "Рангкунӣ", start: 12, duration: 2, status: "progress" },
  { id: "a3", specialistId: "s2", clientName: "Рустам", phone: "93 444 55 66", service: "Тарошидани мӯй", start: 9.5, duration: 1, status: "done" },
  { id: "a4", specialistId: "s2", clientName: "Азиз", phone: "90 123 45 67", service: "Ороиши риш", start: 11, duration: 0.5, status: "confirmed" },
  { id: "a5", specialistId: "s3", clientName: "Гулноза", phone: "98 765 43 21", service: "Тозакунии рӯй", start: 14, duration: 1.5, status: "confirmed" },
];

const HOURS = Array.from({ length: 11 }, (_, i) => i + 9);

export function BookingView() {
  const t = useTranslations("app.nav");
  const session = useAppSession();
  const [currentDate] = useState(new Date());

  const hourWidth = 140; 
  const startHour = 9;
  const rowHeight = 80;

  return (
    <AppShell session={session}>
      <div className="flex h-[calc(100dvh-160px)] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm desktop:h-[calc(100dvh-100px)]">
        
        <header className="flex flex-col gap-4 shrink-0 border-b border-slate-200 px-4 py-4 desktop:flex-row desktop:items-center desktop:justify-between desktop:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-app-sapphire/10 text-app-sapphire">
              <CalendarClock className="size-6" />
            </div>
            <h1 className="text-xl desktop:text-2xl font-bold tracking-tight text-slate-900">{t("booking")}</h1>
          </div>
          
          <div className="flex items-center justify-between gap-4 desktop:justify-end">
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1">
              <Button variant="ghost" className="size-8 p-0">
                <ChevronLeft className="size-5" />
              </Button>
              <div className="flex w-28 desktop:w-32 justify-center text-sm font-medium text-slate-700">
                {currentDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
              </div>
              <Button variant="ghost" className="size-8 p-0">
                <ChevronRight className="size-5" />
              </Button>
            </div>
            <Button variant="sapphire" className="gap-1.5 px-3 desktop:gap-2 desktop:px-4">
              <Plus className="size-4 desktop:size-5" />
              Сабти нав
            </Button>
          </div>
        </header>

        <div className="flex flex-1 overflow-auto bg-slate-50 custom-scrollbar">
          
          <div className="sticky left-0 z-20 flex w-32 desktop:w-64 shrink-0 flex-col border-r border-slate-200 bg-white/95 backdrop-blur-sm">
            <div className="flex h-12 shrink-0 items-center border-b border-slate-200 px-3 desktop:px-4 text-[10px] desktop:text-xs font-semibold uppercase tracking-wider text-slate-400">
              Мутахассисон
            </div>
            <div className="flex-1">
              {SPECIALISTS.map(spec => (
                <div key={spec.id} className="flex flex-col justify-center border-b border-slate-100 px-3 desktop:px-4" style={{ height: `${rowHeight}px` }}>
                  <span className="truncate font-bold text-slate-900 text-sm desktop:text-base">{spec.name}</span>
                  <span className="truncate text-xs text-slate-500">{spec.role}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col relative shrink-0">
            <div 
              className="sticky top-0 z-10 flex h-12 shrink-0 border-b border-slate-200 bg-white/95 backdrop-blur-sm" 
              style={{ width: `${HOURS.length * hourWidth}px` }}
            >
              {HOURS.map(hour => (
                <div 
                  key={hour} 
                  className="flex shrink-0 items-center justify-center border-l border-slate-100 text-xs font-semibold text-slate-400 first:border-none"
                  style={{ width: `${hourWidth}px` }}
                >
                  {hour.toString().padStart(2, '0')}:00
                </div>
              ))}
            </div>

            <div 
              className="relative flex-1" 
              style={{ width: `${HOURS.length * hourWidth}px` }}
            >
              <div className="pointer-events-none absolute inset-0 flex">
                {HOURS.map(hour => (
                  <div 
                    key={hour} 
                    className="shrink-0 h-full border-l border-slate-200/60 first:border-none"
                    style={{ width: `${hourWidth}px` }}
                  />
                ))}
              </div>

              <div className="pointer-events-none absolute inset-0 flex flex-col">
                {SPECIALISTS.map(spec => (
                  <div 
                    key={spec.id} 
                    className="shrink-0 border-b border-slate-200/60" 
                    style={{ height: `${rowHeight}px` }}
                  />
                ))}
              </div>

              {SPECIALISTS.map((spec, index) => {
                const specAppointments = APPOINTMENTS.filter(a => a.specialistId === spec.id);
                const rowTop = index * rowHeight;

                return specAppointments.map(appt => {
                  const left = (appt.start - startHour) * hourWidth;
                  const width = appt.duration * hourWidth;
                  
                  const isDone = appt.status === "done";
                  const isProgress = appt.status === "progress";

                  return (
                    <div
                      key={appt.id}
                      className={cn(
                        "absolute flex flex-col justify-center rounded-lg border px-2 shadow-sm transition-transform hover:-translate-y-0.5 cursor-pointer",
                        isDone ? "bg-slate-100 border-slate-200 opacity-60" :
                        isProgress ? "bg-amber-50 border-amber-200 shadow-amber-500/10" :
                        "bg-white border-app-sapphire/30 shadow-app-sapphire/5"
                      )}
                      style={{
                        top: `${rowTop + 8}px`,
                        left: `${left + 4}px`,
                        width: `${width - 8}px`,
                        height: `${rowHeight - 16}px`
                      }}
                    >
                      <div className="flex items-center justify-between gap-2 overflow-hidden whitespace-nowrap">
                        <span className={cn(
                          "font-bold truncate text-sm desktop:text-base",
                          isDone ? "text-slate-600" :
                          isProgress ? "text-amber-900" : "text-slate-900"
                        )}>
                          {appt.clientName}
                        </span>
                        {isProgress && (
                          <span className="flex shrink-0 h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                        )}
                        {isDone && (
                          <CheckCircle2 className="shrink-0 size-3.5 text-slate-400" />
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] desktop:text-xs text-slate-500 truncate mt-0.5">
                        <span className="truncate">{appt.service}</span>
                      </div>
                    </div>
                  );
                });
              })}

              {/* Current Time Indicator */}
              <div 
                className="absolute top-0 bottom-0 border-l-2 border-red-500 z-10 pointer-events-none"
                style={{ left: `${(10.75 - startHour) * hourWidth}px` }}
              >
                <div className="absolute -left-[5px] -top-1 size-3 rounded-full bg-red-500" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
