import { setRequestLocale } from "next-intl/server";
import { ProfilePanel } from "@/components/account/profile-panel/profile-panel";
import { getLocaleStaticParams } from "@/lib/pages/render-stub-page";
import type { Locale } from "@/types";

export const generateStaticParams = getLocaleStaticParams;
export const revalidate = 3600;

type PageProps = {
  params: Promise<{ locale: string }>;
};

/**
 * Account profile page: view and edit account data.
 * @param {PageProps} props - Route props.
 * @returns {Promise<React.ReactElement>} Profile page.
 */
const AccountProfilePage = async ({ params }: PageProps) => {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  setRequestLocale(locale);

  return <ProfilePanel locale={locale} />;
};

export default AccountProfilePage;
