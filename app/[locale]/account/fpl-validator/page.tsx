import { setRequestLocale } from "next-intl/server";
import { FplValidatorPanel } from "@/components/account/fpl-validator-panel/fpl-validator-panel";
import { getLocaleStaticParams } from "@/lib/pages/render-stub-page";
import type { Locale } from "@/types";

export const generateStaticParams = getLocaleStaticParams;
export const revalidate = 3600;

type PageProps = {
  params: Promise<{ locale: string }>;
};

/**
 * Account ICAO FPL Validator page shell (Phase F0 — no API integration yet).
 * @param {PageProps} props - Route props.
 * @returns {Promise<React.ReactElement>} FPL Validator account page.
 */
const AccountFplValidatorPage = async ({ params }: PageProps) => {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  setRequestLocale(locale);

  return <FplValidatorPanel />;
};

export default AccountFplValidatorPage;
