"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getAuthSession } from "@/lib/auth/session";
import type { Locale } from "@/types";

type AccountGuardProps = {
  locale: Locale;
  children: ReactNode;
};

/**
 * Redirects unauthenticated users from the account area to the login page.
 * @param {AccountGuardProps} props - Locale and children.
 * @returns {React.ReactElement | null} Children when authenticated, otherwise null while redirecting.
 */
export const AccountGuard = ({ locale, children }: AccountGuardProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const session = getAuthSession();

    if (!session) {
      router.replace(`/${locale}/login`);
      return;
    }

    setIsReady(true);
  }, [locale, pathname, router]);

  if (!isReady) {
    return null;
  }

  return <>{children}</>;
};
