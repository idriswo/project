import { getActiveTenantId } from "@/lib/activeTenant";
import { supabase } from "@/lib/supabase";

/**
 * Адрес бэкенда. Документация — https://tim.tj/docs (Swagger), спецификация
 * лежит на https://tim.tj/docs/json.
 *
 * По умолчанию — боевой бэкенд, а не `localhost:5000`, как было раньше.
 * Причина: `NEXT_PUBLIC_*` вшивается в бандл на этапе сборки. Если на
 * хостинге переменную не задали, старое значение уезжало в продакшен, и
 * браузер посетителя честно стучался в свой собственный localhost:5000 —
 * там, разумеется, никого нет, и **ни один запрос в приложении не работал**.
 * Локальный бэкенд теперь включается явно, через `.env.local`.
 */
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://tim.tj/api/v1";

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  // Get the current user session from Supabase
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  // If user is logged in, attach their JWT token for the backend to verify
  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }

  // Пользователь может иметь до 2 магазинов (profiles) — бекенд определяет
  // tenant по этому заголовку, а не доверяет body/query напрямую.
  const activeTenantId = getActiveTenantId();
  if (activeTenantId) {
    headers.set("X-Tenant-Id", activeTenantId);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Бекенд ҳар ҷавобро дар пӯшиши ягона мепечонад — `{ success, data, error }`
  // (ТЗ-и бекенд, боби 9; `src/shared/response.ts`). Онро ҳамин ҷо як бор
  // мекушоем, то ҳар саҳифа маҷбур нашавад `.data` нависад.
  const body =
    response.status === 204 ? null : await response.json().catch(() => null);
  const isEnvelope =
    body !== null && typeof body === "object" && "success" in body;

  if (!response.ok || (isEnvelope && !body.success)) {
    throw new Error(body?.error?.message || `API Error ${response.status}`);
  }

  // Ҷавоби бе пӯшиш ҳамон тавр бармегардад — то роут-и нав барномаро нашиканад.
  return isEnvelope ? body.data : body;
}
