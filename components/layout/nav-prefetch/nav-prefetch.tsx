"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
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
  return [
    `/${locale}`,
    `/${locale}/login`,
    `/${locale}/signup`,
    `/${locale}/about/mission`,
    `/${locale}/about/contacts`,
    `/${locale}/compensations/flights`,
    `/${locale}/compensations/baggage`,
    `/${locale}/compensations/refunds`,
    `/${locale}/compensations/insurance`,
    `/${locale}/account`,
    `/${locale}/account/travel-risk`,
    `/${locale}/account/fpl-validator`,
    `/${locale}/account/directories`,
    `/${locale}/privacy`,
    `/${locale}/legal`,
  ];
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
