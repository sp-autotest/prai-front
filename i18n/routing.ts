import { DEFAULT_LOCALE, LOCALES } from "@/types";

/**
 * Routing configuration for `next-intl` locale-based routing.
 * English is the product default; browser Accept-Language must not override `/` → `/en`.
 * Users switch languages only via the UI (or an explicit `/xx/...` URL).
 */
export const routing = {
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localeDetection: false,
};
