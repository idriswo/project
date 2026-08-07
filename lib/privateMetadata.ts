import type { Metadata } from "next";

/**
 * Метаданные для экранов личного кабинета.
 *
 * `robots.txt` — только просьба: робот может дойти до страницы по внешней
 * ссылке и всё равно завести её в выдачу. `noindex` в метаданных — уже
 * указание, поэтому закрываем оба пути (ROADMAP 5.10).
 *
 * `nocache` и `noimageindex` добавлены, чтобы в поиске не осталось ни
 * сохранённой копии, ни картинок с внутренних экранов магазина.
 */
export const privateMetadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};
