import { setRequestLocale } from "next-intl/server";
import { LoginForm } from "@/components/sections/login-form/login-form";
import { getLocaleStaticParams } from "@/lib/pages/render-stub-page";
import type { Locale } from "@/types";

export const generateStaticParams = getLocaleStaticParams;
/** ISR: login page shell (form is client-side). */
export const revalidate = 3600;

type PageProps = {
  params: Promise<{ locale: string }>;
};

/**
 * Sign-in page with a form matching ``POST /api/v1/auth/login/``.
 * @param {PageProps} props - Route props.
 * @returns {Promise<React.ReactElement>} Login page.
 */
const LoginPage = async ({ params }: PageProps) => {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  setRequestLocale(locale);

  return <LoginForm locale={locale} />;
};

export default LoginPage;
