/**
 * Supported UI locales. English is the default product language.
 */
export const LOCALES = ["en", "es", "kk", "uz", "ru"] as const;

/** Locale code used across routing and i18n. */
export type Locale = (typeof LOCALES)[number];

/** Default locale for the platform. */
export const DEFAULT_LOCALE: Locale = "en";
