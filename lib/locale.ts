import type { Locale } from "@/types";
import { DEFAULT_LOCALE, LOCALES } from "@/types";

/**
 * Returns true when the value is a supported locale code.
 * @param {string} value - Candidate locale string.
 * @returns {value is Locale} Whether the value is a known locale.
 */
export const isLocale = (value: string): value is Locale => {
  return (LOCALES as readonly string[]).includes(value);
};

/**
 * Resolves a locale with fallback to the default English locale.
 * @param {string | undefined} value - Candidate locale string.
 * @returns {Locale} Resolved locale.
 */
export const resolveLocale = (value?: string): Locale => {
  if (!value || !isLocale(value)) {
    return DEFAULT_LOCALE;
  }

  return value;
};
