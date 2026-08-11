import { getTranslations, setRequestLocale } from "next-intl/server";
import { StubPage } from "@/components/sections/stub-page/stub-page";
import { LOCALES, type Locale } from "@/types";

export type StubPageKey =
  | "mission"
  | "contacts"
  | "flights"
  | "baggage"
  | "refunds"
  | "insurance"
  | "account"
  | "signup";

/**
 * Returns static locale params for stub and legal SSG routes.
 * @returns {Array<{ locale: string }>} Locale params.
 */
export const getLocaleStaticParams = () => {
  return LOCALES.map((locale) => ({ locale }));
};

/**
 * Renders a localized stub page for unfinished product sections.
 * @param {string} localeParam - Locale from the route.
 * @param {StubPageKey} pageKey - Translation key under stubs.pages.
 * @returns {Promise<React.ReactElement>} Stub page element.
 */
export const renderStubPage = async (localeParam: string, pageKey: StubPageKey) => {
  const locale = localeParam as Locale;
  setRequestLocale(locale);

  const t = await getTranslations("stubs");

  return (
    <StubPage
      locale={locale}
      badgeLabel={t("comingSoonTitle")}
      title={t(`pages.${pageKey}.title`)}
      description={t(`pages.${pageKey}.description`)}
      ctaLabel={t("ctaHome")}
    />
  );
};
