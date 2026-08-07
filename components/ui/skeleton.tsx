import { cn } from "@/lib/cn";

/**
 * Скелет вместо спиннера.
 *
 * Спиннер сообщает только «подожди». Скелет стоит ровно там, где через
 * секунду появится число, и того же размера — страница не прыгает,
 * когда данные приходят, и глаз уже знает, куда смотреть.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "block rounded-md bg-app-track motion-safe:animate-app-shimmer",
        className,
      )}
    />
  );
}

/**
 * Скелет главного экрана: крупное число сверху, три подчинённых числа,
 * график. Повторяет разметку `DashboardView`, иначе при подмене
 * содержимое дёрнулось бы.
 */
export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-5" role="status" aria-busy="true">
      <div className="rounded-frame border border-app-line bg-app-card p-6 tablet:p-8">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="mt-4 h-11 w-64 tablet:h-13" />
        <div className="mt-7 flex flex-wrap gap-x-10 gap-y-5">
          <SkeletonStat />
          <SkeletonStat />
          <SkeletonStat />
        </div>
      </div>
      <div className="rounded-frame border border-app-line bg-app-card p-6 tablet:p-8">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="mt-5 h-[180px] w-full rounded-xl" />
      </div>
    </div>
  );
}

function SkeletonStat() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-6 w-20" />
      <Skeleton className="h-2.5 w-14" />
    </div>
  );
}

/** Скелет списка товаров: столько же строк, сколько просит каталог кассы. */
export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3" role="status" aria-busy="true">
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-card border border-app-line bg-app-card p-4"
        >
          <Skeleton className="size-12 shrink-0 rounded-xl" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-2.5 w-1/4" />
          </div>
          <Skeleton className="h-7 w-16 shrink-0" />
        </div>
      ))}
    </div>
  );
}
