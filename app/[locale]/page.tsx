import { getTranslations, setRequestLocale } from "next-intl/server";
import { HomeSplit } from "@/components/sections/home-split/home-split";
import { getLocaleStaticParams } from "@/lib/pages/render-stub-page";
import type { Locale } from "@/types";

export const generateStaticParams = getLocaleStaticParams;
/** ISR: home shell (see `ISR_REVALIDATE_SECONDS` in static-rendering.ts). */
export const revalidate = 3600;

type LocalePageProps = {
  params: Promise<{ locale: string }>;
};

/**
 * Locale-aware home page: Travel Risk (left) + brand copy (right) in one viewport.
 * Shell is ISR/SSG; live risk data comes from the dynamic `/api/travel-risk` route.
 * @param {LocalePageProps} props - Page props.
 * @returns {Promise<React.ReactElement>} Home page.
 */
export default async function LocaleHomePage({ params }: LocalePageProps) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const t = await getTranslations("homePage");

  return (
    <HomeSplit
      brand={t("brand")}
      title={t("title")}
      lead={t("lead")}
      imageAlt={t("imageAlt")}
    />
  );
}
