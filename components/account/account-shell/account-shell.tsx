"use client";

import type { ReactNode } from "react";
import { AccountGuard } from "@/components/account/account-guard/account-guard";
import { AccountNav } from "@/components/account/account-nav/account-nav";
import { Container } from "@/components/layout/container/container";
import type { Locale } from "@/types";
import styles from "./account-shell.module.css";

type AccountShellProps = {
  locale: Locale;
  children: ReactNode;
};

/**
 * Authenticated account area chrome: side nav + content panel.
 * @param {AccountShellProps} props - Locale and page content.
 * @returns {React.ReactElement} Account shell layout.
 */
export const AccountShell = ({ locale, children }: AccountShellProps) => {
  return (
    <AccountGuard locale={locale}>
      <div className={styles.shell}>
        <Container className={styles.shell__grid}>
          <aside className={styles.shell__aside}>
            <AccountNav locale={locale} />
          </aside>
          <div className={styles.shell__content}>{children}</div>
        </Container>
      </div>
    </AccountGuard>
  );
};
