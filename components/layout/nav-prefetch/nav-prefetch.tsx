"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SHOW_COMPENSATIONS_NAV } from "@/lib/navigation/feature-flags";
import type { Locale } from "@/types";

type NavPrefetchProps = {
  locale: Locale;
};

/**
 * Builds the list of high-traffic navigation paths for a locale.
 * @param {Locale} locale - Active locale prefix.
 * @returns {string[]} Absolute in-app paths to prefetch.
 */
const getKeyNavPaths = (locale: Locale): string[] => {
  const paths = [
    `/${locale}`,
    `/${locale}/login`,
    `/${locale}/signup`,
    `/${locale}/about/mission`,
    `/${locale}/about/contacts`,
    `/${locale}/account`,
    `/${locale}/account/travel-risk`,
    `/${locale}/account/fpl-validator`,
    `/${locale}/account/directories`,
    `/${locale}/privacy`,
    `/${locale}/legal`,
  ];

  if (SHOW_COMPENSATIONS_NAV) {
    paths.push(
      `/${locale}/compensations/flights`,
      `/${locale}/compensations/baggage`,
      `/${locale}/compensations/refunds`,
      `/${locale}/compensations/insurance`,
    );
  }

  return paths;
};
/**
 * Prefetches primary navigation routes after hydration for faster client transitions.
 * Renders nothing; side effect only.
 * @param {NavPrefetchProps} props - Prefetch props.
 * @returns {null} No UI.
 */
export const NavPrefetch = ({ locale }: NavPrefetchProps) => {
  const router = useRouter();

  useEffect(() => {
    const paths = getKeyNavPaths(locale);

    paths.forEach((path) => {
      router.prefetch(path);
    });
  }, [locale, router]);

  return null;
};
