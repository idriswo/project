import { mock } from "@/lib/api/mock";
import type { LabelType } from "@/lib/labels";

/**
 * Очередь печати этикеток (Э-03).
 *
 * Бекенда нет — модуль 10 в `design/BACKEND-REQUESTS.md`.
 * Состояние живёт в памяти вкладки: при перезагрузке очередь вернётся к
 * демонстрационной. Так и должно быть до появления эндпоинтов — иначе
 * мы бы написали в localStorage вторую базу данных, которую потом
 * пришлось бы выпиливать.
 */

export type PrintJobStatus = "queued" | "printing" | "done" | "cancelled";

export type PrintJob = {
  id: string;
  productName: string;
  labelType: LabelType;
  quantity: number;
  printed: number;
  status: PrintJobStatus;
};

export type PrintQueue = {
  jobs: PrintJob[];
  activeCount: number;
  printedToday: number;
  /** Принтер подключён к этому компьютеру, бекенд его не видит. */
  printerName: string;
  printerOnline: boolean;
};

let jobs: PrintJob[] = [
  {
    id: "89012",
    productName: 'Джинсы "Slim Fit", синие, 32/32',
    labelType: "discount",
    quantity: 250,
    printed: 188,
    status: "printing",
  },
  {
    id: "89013",
    productName: 'Платье летнее "Floral", M',
    labelType: "standard",
    quantity: 100,
    printed: 45,
    status: "printing",
  },
  {
    id: "89014",
    productName: "Худи унисекс, чёрное, L",
    labelType: "standard",
    quantity: 50,
    printed: 45,
    status: "printing",
  },
  {
    id: "89015",
    productName: "Футболки детские, набор 4–6 лет",
    labelType: "discount",
    quantity: 300,
    printed: 60,
    status: "queued",
  },
  {
    id: "89016",
    productName: "Носки хлопковые, белые",
    labelType: "standard",
    quantity: 500,
    printed: 50,
    status: "queued",
  },
];

let printedToday = 1540;

// MOCK: GET /print-jobs
export function fetchPrintQueue(): Promise<PrintQueue> {
  return mock({
    jobs: jobs.filter((job) => job.status !== "cancelled"),
    activeCount: jobs.filter(
      (job) => job.status === "queued" || job.status === "printing",
    ).length,
    printedToday,
    printerName: "Xprinter XP-370B",
    printerOnline: true,
  });
}

// MOCK: POST /print-jobs
export function queuePrintJob(input: {
  productName: string;
  labelType: LabelType;
  quantity: number;
}): Promise<PrintJob> {
  const job: PrintJob = {
    id: String(Math.floor(10000 + Math.random() * 89999)),
    productName: input.productName,
    labelType: input.labelType,
    quantity: input.quantity,
    printed: 0,
    status: "queued",
  };
  jobs = [job, ...jobs];
  printedToday += input.quantity;
  return mock(job);
}

// MOCK: POST /print-jobs/:id/pause
export function pausePrintJob(id: string): Promise<void> {
  jobs = jobs.map((job) =>
    job.id === id
      ? { ...job, status: job.status === "printing" ? "queued" : "printing" }
      : job,
  );
  return mock(undefined);
}

// MOCK: DELETE /print-jobs/:id
export function cancelPrintJob(id: string): Promise<void> {
  jobs = jobs.map((job) =>
    job.id === id ? { ...job, status: "cancelled" } : job,
  );
  return mock(undefined);
}

// MOCK: DELETE /print-jobs
export function clearPrintQueue(): Promise<void> {
  jobs = jobs.map((job) =>
    job.status === "done" ? job : { ...job, status: "cancelled" },
  );
  return mock(undefined);
}
