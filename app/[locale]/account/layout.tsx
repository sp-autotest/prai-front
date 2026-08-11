import { setRequestLocale } from "next-intl/server";
import { AccountShell } from "@/components/account/account-shell/account-shell";
import { getLocaleStaticParams } from "@/lib/pages/render-stub-page";
import { LOCALES, type Locale } from "@/types";

export const generateStaticParams = getLocaleStaticParams;
export const revalidate = 3600;

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

/**
 * Account area layout with auth guard and secondary navigation.
 * @param {LayoutProps} props - Locale params and nested pages.
 * @returns {Promise<React.ReactElement>} Account shell.
 */
export default async function AccountLayout({ children, params }: LayoutProps) {
  const { locale: localeParam } = await params;
  const locale = (LOCALES as readonly string[]).includes(localeParam)
    ? (localeParam as Locale)
    : ("en" as Locale);

  setRequestLocale(locale);

  return <AccountShell locale={locale}>{children}</AccountShell>;
}
