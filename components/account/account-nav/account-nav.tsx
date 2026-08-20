"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button/button";
import { clearAuthSession } from "@/lib/auth/session";
import type { Locale } from "@/types";
import styles from "./account-nav.module.css";

type AccountNavProps = {
  locale: Locale;
};

/**
 * Secondary navigation for the account area: profile, Travel Risk, FPL, directories.
 * @param {AccountNavProps} props - Active locale.
 * @returns {React.ReactElement} Account sidebar/nav.
 */
export const AccountNav = ({ locale }: AccountNavProps) => {
  const t = useTranslations("accountPage");
  const pathname = usePathname();
  const router = useRouter();

  const profileHref = `/${locale}/account`;
  const travelRiskHref = `/${locale}/account/travel-risk`;
  const fplValidatorHref = `/${locale}/account/fpl-validator`;
  const directoriesHref = `/${locale}/account/directories`;

  const isProfile =
    pathname === profileHref || pathname === `${profileHref}/`;
  const isTravelRisk = pathname.startsWith(travelRiskHref);
  const isFplValidator = pathname.startsWith(fplValidatorHref);
  const isDirectories = pathname.startsWith(directoriesHref);

  /**
   * Clears the session and returns to the public home page.
   */
  const handleSignOut = () => {
    clearAuthSession();
    router.push(`/${locale}`);
  };

  return (
    <nav className={styles.nav} aria-label={t("navAriaLabel")}>
      <p className={styles.nav__title}>{t("navTitle")}</p>
      <ul className={styles.nav__list}>
        <li>
          <Link
            href={profileHref}
            prefetch
            className={[styles.nav__link, isProfile ? styles["nav__link--active"] : ""].join(
              " ",
            )}
            aria-current={isProfile ? "page" : undefined}
          >
            {t("navProfile")}
          </Link>
        </li>
        <li>
          <Link
            href={travelRiskHref}
            prefetch
            className={[
              styles.nav__link,
              isTravelRisk ? styles["nav__link--active"] : "",
            ].join(" ")}
            aria-current={isTravelRisk ? "page" : undefined}
          >
            {t("navTravelRisk")}
          </Link>
        </li>
        <li>
          <Link
            href={fplValidatorHref}
            prefetch
            className={[
              styles.nav__link,
              isFplValidator ? styles["nav__link--active"] : "",
            ].join(" ")}
            aria-current={isFplValidator ? "page" : undefined}
          >
            {t("navFplValidator")}
          </Link>
        </li>
        <li>
          <Link
            href={directoriesHref}
            prefetch
            className={[
              styles.nav__link,
              isDirectories ? styles["nav__link--active"] : "",
            ].join(" ")}
            aria-current={isDirectories ? "page" : undefined}
          >
            {t("navDirectories")}
          </Link>
        </li>
      </ul>

      <div className={styles.nav__footer}>
        <Button type="button" variant="ghost" size="sm" onClick={handleSignOut}>
          {t("signOut")}
        </Button>
      </div>
    </nav>
  );
};
