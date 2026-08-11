import { setRequestLocale } from "next-intl/server";
import { AccountTravelRiskPanel } from "@/components/account/account-travel-risk/account-travel-risk";
import { getLocaleStaticParams } from "@/lib/pages/render-stub-page";
import type { Locale } from "@/types";

export const generateStaticParams = getLocaleStaticParams;
export const revalidate = 3600;

type PageProps = {
  params: Promise<{ locale: string }>;
};

/**
 * Account Travel Risk page with the main risk assessment scenario.
 * @param {PageProps} props - Route props.
 * @returns {Promise<React.ReactElement>} Travel Risk account page.
 */
const AccountTravelRiskPage = async ({ params }: PageProps) => {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  setRequestLocale(locale);

  return <AccountTravelRiskPanel />;
};

export default AccountTravelRiskPage;
