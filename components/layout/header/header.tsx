import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Container } from "@/components/layout/container/container";
import { HeaderNav } from "@/components/layout/header/header-nav";
import type { Locale } from "@/types";
import styles from "./header.module.css";

type HeaderProps = {
  locale: Locale;
};

/**
 * Sticky site header with logo and Phase 4 navigation shell.
 * @param {HeaderProps} props - Header props.
 * @returns {Promise<React.ReactElement>} Header element.
 */
export const Header = async ({ locale }: HeaderProps) => {
  const tCommon = await getTranslations("common");
  const tNav = await getTranslations("nav");

  return (
    <header className={styles.header}>
      <Container className={styles.header__inner}>
        <Link
          href={`/${locale}`}
          prefetch
          className={styles.header__logo}
          aria-label={tNav("home")}
        >
          <span className={styles.header__logoMark} aria-hidden="true">
            PRAI
          </span>
          <span className={styles.header__logoText}>{tCommon("siteName")}</span>
        </Link>

        <HeaderNav
          locale={locale}
          labels={{
            mainAriaLabel: tNav("mainAriaLabel"),
            about: tNav("about"),
            aboutMenu: tNav("aboutMenu"),
            mission: tNav("mission"),
            contacts: tNav("contacts"),
            compensations: tNav("compensations"),
            compensationsMenu: tNav("compensationsMenu"),
            compensationAirports: tNav("compensationAirports"),
            compensationBaggage: tNav("compensationBaggage"),
            compensationRefunds: tNav("compensationRefunds"),
            compensationInsurance: tNav("compensationInsurance"),
            travelRisk: tNav("travelRisk"),
            signIn: tNav("signIn"),
            signUp: tNav("signUp"),
            account: tNav("account"),
            openMenu: tNav("openMenu"),
            closeMenu: tNav("closeMenu"),
          }}
        />
      </Container>
    </header>
  );
};
