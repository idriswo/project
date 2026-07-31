import { useTranslations } from "next-intl";

import { Logo } from "@/components/logo";
import { anchors, site } from "@/lib/site";

const linkClass =
  "text-[15px] text-navy-text transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  // Заголовок колонки намеренно не heading: иначе он встал бы в один
  // уровень с H2 секций страницы и сломал иерархию (ТЗ п. 4.1).
  // Доступность обеспечивает <nav aria-label>.
  return (
    <nav aria-label={title}>
      <p className="mb-4 text-sm font-bold tracking-[0.5px] text-white">
        {title}
      </p>
      <div className="flex flex-col gap-[11px]">{children}</div>
    </nav>
  );
}

/** Футер: 4 колонки → 2 → 1, нижняя строка с копирайтом (макет п. 3.8). */
export function Footer() {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");

  return (
    <footer id={anchors.footer.slice(1)} className="bg-navy text-white">
      <div className="mx-auto grid w-full max-w-[1200px] gap-10 px-6 pt-18 pb-10 tablet:grid-cols-2 desktop:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo tone="dark" />
          <p className="mt-[18px] max-w-[280px] text-[15px] leading-relaxed text-navy-text">
            {t("description")}
          </p>
        </div>

        <FooterColumn title={t("product")}>
          <a href={anchors.features} className={linkClass}>
            {tNav("features")}
          </a>
          <a href={anchors.pricing} className={linkClass}>
            {tNav("pricing")}
          </a>
          <a href={anchors.industries} className={linkClass}>
            {tNav("industries")}
          </a>
        </FooterColumn>

        <FooterColumn title={t("company")}>
          <a href="#" className={linkClass}>
            {t("about")}
          </a>
          <a href="#" className={linkClass}>
            {t("blog")}
          </a>
          <a href="#" className={linkClass}>
            {t("partners")}
          </a>
        </FooterColumn>

        <FooterColumn title={t("contacts")}>
          <a href={`mailto:${site.email}`} className={linkClass}>
            {site.email}
          </a>
          <a href={`tel:${site.phoneHref}`} className={linkClass}>
            {site.phone}
          </a>
          <a href={site.telegram} className={linkClass}>
            {t("telegram")}
          </a>
        </FooterColumn>
      </div>

      <div className="border-t border-navy-rule">
        <div className="mx-auto flex w-full max-w-[1200px] flex-wrap justify-between gap-4 px-6 py-[22px] text-sm text-navy-dim">
          <span>{t("copyright", { year: new Date().getFullYear() })}</span>
          <div className="flex gap-6">
            <a
              href="#"
              className="text-sm text-navy-dim transition-colors hover:text-white"
            >
              {t("privacy")}
            </a>
            <a
              href="#"
              className="text-sm text-navy-dim transition-colors hover:text-white"
            >
              {t("terms")}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
