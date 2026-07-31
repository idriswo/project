import { useTranslations } from "next-intl";

import { LanguageSwitcher } from "@/components/language-switcher";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { anchors } from "@/lib/site";

import { MobileMenu } from "./mobile-menu";
import { NavLinks } from "./nav-links";

/** Хедер: sticky, высота 76px, полупрозрачный фон с размытием (макет п. 3.1). */
export function Header({ locale }: { locale: Locale }) {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");

  const items = [
    { href: anchors.features, label: t("features") },
    { href: anchors.pricing, label: t("pricing") },
    { href: anchors.industries, label: t("industries") },
    { href: anchors.footer, label: t("contacts") },
  ];

  return (
    <header className="header-elevate sticky top-0 z-50 border-b border-line bg-card/90 backdrop-blur-[10px]">
      <div className="relative mx-auto flex h-[76px] w-full max-w-[1200px] items-center justify-between gap-6 px-6">
        <a
          href={anchors.top}
          aria-label={t("home")}
          className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          <Logo />
        </a>

        <NavLinks items={items} />

        <div className="flex items-center gap-3.5">
          <ThemeToggle
            labelToDark={tCommon("themeToDark")}
            labelToLight={tCommon("themeToLight")}
          />

          <LanguageSwitcher
            current={locale}
            label={tCommon("languageSwitcher")}
          />

          <Link
            href="/auth"
            className="hidden text-[15px] font-semibold text-ink transition-colors hover:text-brand-ink tablet:inline"
          >
            {t("signIn")}
          </Link>

          <Button href="/auth" className="hidden tablet:inline-flex">
            {t("cta")}
          </Button>

          <MobileMenu
            items={items}
            labels={{
              open: t("openMenu"),
              close: t("closeMenu"),
              signIn: t("signIn"),
              cta: t("cta"),
            }}
          />
        </div>
      </div>
    </header>
  );
}
