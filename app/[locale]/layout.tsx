import type React from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header/header";
import { Footer } from "@/components/layout/footer/footer";
import { NavPrefetch } from "@/components/layout/nav-prefetch/nav-prefetch";
import { LOCALES, type Locale } from "@/types";
import styles from "./layout.module.css";

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

/**
 * Returns static locale params for SSG of the locale layout segment.
 * @returns {Array<{ locale: string }>} Locale param list.
 */
export const generateStaticParams = () => {
  return LOCALES.map((locale) => ({ locale }));
};

/**
 * Locale-aware shell: Header + Main + Footer with next-intl provider.
 * @param {LocaleLayoutProps} props - Layout props.
 * @returns {Promise<React.ReactElement>} Provider-wrapped site shell.
 */
export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale: localeParam } = await params;

  if (!(LOCALES as readonly string[]).includes(localeParam)) {
    notFound();
  }

  const locale = localeParam as Locale;

  setRequestLocale(locale);
  const messages = await getMessages();
  const tCommon = await getTranslations("common");

  return (
    <NextIntlClientProvider messages={messages}>
      <div className={styles.shell}>
        <a href="#main" className="skip-link">
          {tCommon("skipToContent")}
        </a>
        <Header locale={locale} />
        <main id="main" className={styles.main} tabIndex={-1}>
          {children}
        </main>
        <Footer locale={locale} />
        <NavPrefetch locale={locale} />
      </div>
    </NextIntlClientProvider>
  );
}
