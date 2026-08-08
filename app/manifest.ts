import type { MetadataRoute } from "next";

/**
 * Манифест приложения — то, что делает TIM устанавливаемым.
 *
 * С ним Chrome предлагает «Установить», и в системе появляется обычная
 * программа: значок на рабочем столе, строка в меню «Пуск», своё окно
 * без адресной строки и вкладок. Владелец кликает по значку, а не ищет
 * закладку в браузере.
 *
 * `start_url` ведёт на вход, а не на лендинг: в установленном приложении
 * рекламная страница не нужна — программа начинается со входа. Кто уже
 * вошёл, того `AuthGuard` уводит дальше сам, на `/stores`.
 *
 * Локаль в адресе жёсткая (`/tg`): манифест — статический файл, спросить
 * язык ему не у кого. Таджикский выбран как рабочий язык владельца.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/tg/auth",
    name: "TIM — идоракунии дӯкон",
    short_name: "TIM",
    description:
      "Савдо, анбор ва молия дар як система: касса, толор, анбор ва ҳисоботҳо.",
    start_url: "/tg/auth",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    lang: "tg",
    dir: "ltr",
    // Сапфир в системной рамке окна и в панели телефона; фон заставки —
    // тот же, что у рабочей области, иначе при запуске мигает белым.
    theme_color: "#0F52BA",
    background_color: "#F8FAFC",
    categories: ["business", "productivity", "finance"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Отдельная иконка во весь квадрат: Android обрезает её под свою
      // форму сам, и скруглённая обрезалась бы дважды.
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Касса", url: "/tg/pos" },
      { name: "Анбор", url: "/tg/warehouse" },
    ],
  };
}
