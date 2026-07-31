"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useLayoutEffect, useSyncExternalStore } from "react";

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

/*
 * useLayoutEffect применяется до отрисовки кадра, поэтому восстановленная
 * тема не успевает мигнуть. На сервере такого хука нет, там подставляем
 * обычный useEffect: тело всё равно выполнится только в браузере.
 */
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Держит атрибут data-theme на <html> в согласии с localStorage.
 *
 * Зачем нужен отдельно от инлайнового скрипта: при смене локали
 * next-intl делает клиентский переход, React перерисовывает корневой
 * layout и СБРАСЫВАЕТ выставленный скриптом data-theme. Скрипт при этом
 * повторно не выполняется — он есть только в первоначальном HTML.
 * Без этой синхронизации пользователь со светлой темой и тёмной
 * системной настройкой при переключении языка проваливался в тёмную.
 */
export function ThemeSync() {
  useIsomorphicLayoutEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved !== "dark" && saved !== "light") return;

      const root = document.documentElement;
      if (root.getAttribute("data-theme") !== saved) {
        root.setAttribute("data-theme", saved);
      }
    } catch {
      // localStorage недоступен — остаётся системная настройка.
    }
  });

  return null;
}

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
