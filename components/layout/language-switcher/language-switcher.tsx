"use client";

import type React from "react";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/types";
import styles from "./language-switcher.module.css";

/**
 * Simple locale switcher for the `app/[locale]` routing setup.
 * Keeps the current path and swaps only the first URL segment.
 * @returns {React.ReactElement} Language switcher UI.
 */
export const LanguageSwitcher = (): React.ReactElement => {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("nav");

  const currentLocale = useMemo<Locale>(() => {
    const parts = pathname.split("/").filter(Boolean);
    const candidate = parts[0];
    return (LOCALES as readonly string[]).includes(candidate)
      ? (candidate as Locale)
      : DEFAULT_LOCALE;
  }, [pathname]);

  /**
   * Handles locale change by navigating to the same route under the new locale prefix.
   * @param {React.ChangeEvent<HTMLSelectElement>} event - Change event.
   */
  const handleLocaleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = event.target.value as Locale;
    if (nextLocale === currentLocale) {
      return;
    }

    const parts = pathname.split("/").filter(Boolean);
    const rest = parts.slice(1);
    const nextPath = `/${nextLocale}${rest.length ? `/${rest.join("/")}` : ""}`;

    router.push(nextPath);
  };

  return (
    <label className={styles.wrap}>
      <span className={styles.srLabel}>{t("languageLabel")}</span>
      <select
        className={styles.select}
        value={currentLocale}
        aria-label={t("languageLabel")}
        onChange={handleLocaleChange}
      >
        {LOCALES.map((loc) => (
          <option key={loc} value={loc}>
            {loc.toUpperCase()}
          </option>
        ))}
      </select>
    </label>
  );
};
