import { setRequestLocale } from "next-intl/server";
import { SignupForm } from "@/components/sections/signup-form/signup-form";
import { getLocaleStaticParams } from "@/lib/pages/render-stub-page";
import type { Locale } from "@/types";

export const generateStaticParams = getLocaleStaticParams;
/** ISR: signup page shell (form is client-side). */
export const revalidate = 3600;

type PageProps = {
  params: Promise<{ locale: string }>;
};

/**
 * Sign-up page with a form matching ``POST /api/v1/auth/register/``.
 * @param {PageProps} props - Route props.
 * @returns {Promise<React.ReactElement>} Signup page.
 */
const SignUpPage = async ({ params }: PageProps) => {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  setRequestLocale(locale);

  return <SignupForm locale={locale} />;
};

export default SignUpPage;
