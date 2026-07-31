"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

export const THEME_STORAGE_KEY = "tim-theme";

/**
 * Скрипт, который выставляет тему до первой отрисовки.
 *
 * Без него страница успевает мигнуть светлой темой, прежде чем React
 * загрузится и применит сохранённый выбор. Поэтому он инлайновый и
 * стоит в <head>, а не в компоненте.
 */
export const themeInitScript = `
(function () {
  try {
    var saved = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    if (saved === "dark" || saved === "light") {
      document.documentElement.setAttribute("data-theme", saved);
    }
  } catch (e) {
    // localStorage может быть недоступен (приватный режим) — тогда
    // просто остаётся системная настройка через prefers-color-scheme.
  }
})();
`;

type Theme = "light" | "dark";

const THEME_CHANGE_EVENT = "tim:themechange";
const DARK_QUERY = "(prefers-color-scheme: dark)";

/**
 * Тема живёт вне React: в атрибуте на <html> и в системной настройке.
 * useSyncExternalStore — штатный способ читать такое состояние, без
 * setState в эффекте и без рассинхрона при гидратации.
 */
function subscribe(onChange: () => void) {
  const media = window.matchMedia(DARK_QUERY);
  media.addEventListener("change", onChange);
  window.addEventListener(THEME_CHANGE_EVENT, onChange);

  return () => {
    media.removeEventListener("change", onChange);
    window.removeEventListener(THEME_CHANGE_EVENT, onChange);
  };
}

function getSnapshot(): Theme {
  const attribute = document.documentElement.getAttribute("data-theme");
  if (attribute === "dark" || attribute === "light") return attribute;
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

/** На сервере темы нет — значит, на первом рендере иконку не показываем. */
function getServerSnapshot(): null {
  return null;
}

/** Переключатель светлой и тёмной темы. */
export function ThemeToggle({
  labelToDark,
  labelToLight,
}: {
  labelToDark: string;
  labelToLight: string;
}) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);

    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Выбор не сохранится между визитами, но текущая сессия работает.
    }

    // Сообщаем подписчикам, что атрибут поменялся: сам по себе он
    // событий не рассылает.
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? labelToLight : labelToDark}
      className="inline-flex size-9 items-center justify-center rounded-lg text-subtle transition-colors hover:bg-surface hover:text-brand-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
    >
      {/* До гидратации иконки нет — место под неё уже занято,
          поэтому вёрстка не прыгает. */}
      {theme === null ? null : isDark ? (
        <Sun className="size-[18px]" aria-hidden />
      ) : (
        <Moon className="size-[18px]" aria-hidden />
      )}
    </button>
  );
}
