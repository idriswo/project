import { FlaskConical } from "lucide-react";

/**
 * Плашка «данные демонстрационные».
 *
 * Экран, который выглядит рабочим, но показывает выдуманные числа, —
 * это ловушка: по нему принимают решения. Пока за экраном нет
 * эндпоинта, он обязан сам об этом сообщать.
 *
 * Удаляется вместе с моком: когда `lib/api/<домен>.ts` начинает ходить
 * в бекенд, плашка уходит из разметки экрана.
 */
export function MockNotice({ text }: { text: string }) {
  return (
    <p className="flex items-start gap-2.5 rounded-card border border-app-low/25 bg-app-low-soft px-4 py-3 text-[13px] leading-snug font-semibold text-app-low">
      <FlaskConical className="mt-px size-4 shrink-0" aria-hidden />
      {text}
    </p>
  );
}
