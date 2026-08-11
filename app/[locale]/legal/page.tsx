import { getTranslations, setRequestLocale } from "next-intl/server";
import { ContentPage } from "@/components/sections/content-page/content-page";
import { getLocaleStaticParams } from "@/lib/pages/render-stub-page";
import type { Locale } from "@/types";

export const generateStaticParams = getLocaleStaticParams;
/** Pure SSG legal page. */
export const revalidate = false;

type PageProps = {
  params: Promise<{ locale: string }>;
};

/**
 * Legal notice static page.
 * @param {PageProps} props - Route props.
 * @returns {Promise<React.ReactElement>} Legal content page.
 */
const LegalPage = async ({ params }: PageProps) => {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  setRequestLocale(locale);

  const t = await getTranslations("legalPage");
  const paragraphs = t.raw("content") as string[];

  return (
    <ContentPage
      title={t("title")}
      subtitle={t("subtitle")}
      paragraphs={Array.isArray(paragraphs) ? paragraphs : []}
    />
  );
};

export default LegalPage;
