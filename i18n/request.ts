import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import type { Locale } from "@/types";

const loadMessages = {
  en: () => import("../locales/en.json").then((m) => m.default),
  es: () => import("../locales/es.json").then((m) => m.default),
  kk: () => import("../locales/kk.json").then((m) => m.default),
  uz: () => import("../locales/uz.json").then((m) => m.default),
  ru: () => import("../locales/ru.json").then((m) => m.default),
} satisfies Record<Locale, () => Promise<Record<string, unknown>>>;

/**
 * next-intl request-scoped configuration.
 * Provides the resolved locale and the corresponding messages bundle.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const resolvedRequested = requested ?? routing.defaultLocale;

  const locale = (routing.locales as readonly string[]).includes(resolvedRequested)
    ? (resolvedRequested as Locale)
    : routing.defaultLocale;

  const messages = await loadMessages[locale]();

  return {
    locale,
    messages,
  };
});

