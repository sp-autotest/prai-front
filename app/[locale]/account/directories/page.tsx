import { setRequestLocale } from "next-intl/server";
import { DirectoriesPanel } from "@/components/account/directories-panel/directories-panel";
import { getLocaleStaticParams } from "@/lib/pages/render-stub-page";
import type { Locale } from "@/types";

export const generateStaticParams = getLocaleStaticParams;
export const revalidate = 3600;

type PageProps = {
  params: Promise<{ locale: string }>;
};

/**
 * Account directories page: airports, airlines, equipment search.
 * @param {PageProps} props - Route props.
 * @returns {Promise<React.ReactElement>} Directories account page.
 */
const AccountDirectoriesPage = async ({ params }: PageProps) => {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  setRequestLocale(locale);

  return <DirectoriesPanel />;
};

export default AccountDirectoriesPage;
