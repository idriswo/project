import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

/**
 * Обёртки над навигацией Next.js, знающие про текущую локаль.
 * Импортировать Link/redirect нужно отсюда, а не из "next/link".
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
