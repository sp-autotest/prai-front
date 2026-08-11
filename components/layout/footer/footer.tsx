import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Container } from "@/components/layout/container/container";
import type { Locale } from "@/types";
import styles from "./footer.module.css";

type FooterProps = {
  locale: Locale;
};

/**
 * Site footer with legal links and copyright.
 * @param {FooterProps} props - Footer props.
 * @returns {Promise<React.ReactElement>} Footer element.
 */
export const Footer = async ({ locale }: FooterProps) => {
  const t = await getTranslations("footer");

  return (
    <footer className={styles.footer}>
      <Container className={styles.footer__inner}>
        <nav className={styles.footer__nav} aria-label={t("navAriaLabel")}>
          <ul className={styles.footer__list}>
            <li>
              <Link href={`/${locale}/privacy`} prefetch className={styles.footer__link}>
                {t("privacyAndCookies")}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/legal`} prefetch className={styles.footer__link}>
                {t("legalNotice")}
              </Link>
            </li>
          </ul>
        </nav>

        <p className={styles.footer__copyright}>{t("copyright")}</p>
      </Container>
    </footer>
  );
};
