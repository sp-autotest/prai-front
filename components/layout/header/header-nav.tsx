"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dropdown } from "@/components/ui/dropdown/dropdown";
import { LanguageSwitcher } from "@/components/layout/language-switcher/language-switcher";
import {
  AUTH_SESSION_CHANGED_EVENT,
  AUTH_STORAGE_KEY,
  getAuthSession,
} from "@/lib/auth/session";
import type { Locale } from "@/types";
import styles from "./header.module.css";

export type HeaderNavLabels = {
  mainAriaLabel: string;
  about: string;
  aboutMenu: string;
  mission: string;
  contacts: string;
  compensations: string;
  compensationsMenu: string;
  compensationAirports: string;
  compensationBaggage: string;
  compensationRefunds: string;
  compensationInsurance: string;
  travelRisk: string;
  signIn: string;
  signUp: string;
  account: string;
  openMenu: string;
  closeMenu: string;
};

type HeaderNavProps = {
  locale: Locale;
  labels: HeaderNavLabels;
};

/**
 * Returns focusable elements inside a container for drawer focus trapping.
 * @param {HTMLElement} container - Container to scan.
 * @returns {HTMLElement[]} Focusable elements in DOM order.
 */
const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), select:not([disabled]), textarea:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hasAttribute("disabled") && element.tabIndex !== -1);
};

/**
 * Top navigation: About + Compensations dropdowns, Travel Risk, Sign in / Sign up,
 * plus an accessible mobile drawer with the same structure.
 * @param {HeaderNavProps} props - Navigation props.
 * @returns {React.ReactElement} Header navigation.
 */
export const HeaderNav = ({ locale, labels }: HeaderNavProps) => {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const drawerId = useId();
  const burgerRef = useRef<HTMLButtonElement | null>(null);
  const drawerRef = useRef<HTMLDivElement | null>(null);

  /**
   * Syncs auth UI with localStorage session.
   * Layout persists across navigations, so a one-shot mount check is not enough.
   */
  useEffect(() => {
    /**
     * Re-reads the session and updates the Sign in / Account link.
     * @returns {void}
     */
    const syncAuthState = () => {
      setIsAuthenticated(Boolean(getAuthSession()));
    };

    syncAuthState();

    /**
     * Reacts to cross-tab localStorage writes for the auth key.
     * @param {StorageEvent} event - Browser storage event.
     */
    const handleStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === AUTH_STORAGE_KEY) {
        syncAuthState();
      }
    };

    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, syncAuthState);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, syncAuthState);
      window.removeEventListener("storage", handleStorage);
    };
  }, [pathname]);

  const aboutItems = [
    { key: "mission", label: labels.mission, href: `/${locale}/about/mission` },
    { key: "contacts", label: labels.contacts, href: `/${locale}/about/contacts` },
  ];

  const compensationItems = [
    {
      key: "flights",
      label: labels.compensationAirports,
      href: `/${locale}/compensations/flights`,
    },
    {
      key: "baggage",
      label: labels.compensationBaggage,
      href: `/${locale}/compensations/baggage`,
    },
    {
      key: "refunds",
      label: labels.compensationRefunds,
      href: `/${locale}/compensations/refunds`,
    },
    {
      key: "insurance",
      label: labels.compensationInsurance,
      href: `/${locale}/compensations/insurance`,
    },
  ];

  /**
   * Locks body scroll, traps focus, and restores focus when the drawer closes.
   */
  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const burgerButton = burgerRef.current;
    document.body.style.overflow = "hidden";

    const drawer = drawerRef.current;
    const focusable = drawer ? getFocusableElements(drawer) : [];
    focusable[0]?.focus();

    /**
     * Closes the drawer on Escape and keeps Tab focus inside the dialog panel.
     * @param {KeyboardEvent} event - Keyboard event.
     */
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        return;
      }

      if (event.key !== "Tab" || !drawer) {
        return;
      }

      const items = getFocusableElements(drawer);

      if (items.length === 0) {
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
        return;
      }

      if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      burgerButton?.focus();
    };
  }, [isMenuOpen]);

  /**
   * Toggles the mobile navigation drawer.
   */
  const handleMenuToggle = () => {
    setIsMenuOpen((prev) => !prev);
  };

  /**
   * Closes the mobile navigation drawer.
   */
  const handleMenuClose = () => {
    setIsMenuOpen(false);
  };

  return (
    <div className={styles.header__actions}>
      <nav className={styles.header__navDesktop} aria-label={labels.mainAriaLabel}>
        <ul className={styles.header__navList}>
          <li>
            <Dropdown
              trigger={labels.about}
              ariaLabel={labels.aboutMenu}
              items={aboutItems}
              triggerClassName={styles.header__navLink}
            />
          </li>
          <li>
            <Dropdown
              trigger={labels.compensations}
              ariaLabel={labels.compensationsMenu}
              items={compensationItems}
              triggerClassName={styles.header__navLink}
            />
          </li>
          <li>
            <Link href={`/${locale}#travel-risk`} prefetch className={styles.header__navLink}>
              {labels.travelRisk}
            </Link>
          </li>
          <li>
            <Link
              href={isAuthenticated ? `/${locale}/account` : `/${locale}/login`}
              prefetch
              className={styles.header__navLink}
            >
              {isAuthenticated ? labels.account : labels.signIn}
            </Link>
          </li>
          {!isAuthenticated && (
            <li>
              <Link href={`/${locale}/signup`} prefetch className={styles.header__navLink}>
                {labels.signUp}
              </Link>
            </li>
          )}
        </ul>
      </nav>

      <div className={styles.header__langDesktop}>
        <LanguageSwitcher />
      </div>

      <button
        ref={burgerRef}
        type="button"
        className={styles.header__burger}
        aria-label={isMenuOpen ? labels.closeMenu : labels.openMenu}
        aria-expanded={isMenuOpen}
        aria-controls={drawerId}
        aria-haspopup="dialog"
        onClick={handleMenuToggle}
      >
        <span className={styles.header__burgerIcon} aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </button>

      {isMenuOpen && (
        <div className={styles.header__drawerRoot}>
          <button
            type="button"
            className={styles.header__backdrop}
            aria-label={labels.closeMenu}
            tabIndex={-1}
            onClick={handleMenuClose}
          />

          <div
            id={drawerId}
            ref={drawerRef}
            className={styles.header__drawer}
            role="dialog"
            aria-modal="true"
            aria-label={labels.mainAriaLabel}
          >
            <nav aria-label={labels.mainAriaLabel}>
              <ul className={styles.header__drawerList}>
                <li className={styles.header__drawerGroup}>
                  <p className={styles.header__drawerGroupTitle} id={`${drawerId}-about`}>
                    {labels.about}
                  </p>
                  <ul
                    className={styles.header__drawerSublist}
                    aria-labelledby={`${drawerId}-about`}
                  >
                    {aboutItems.map((item) => (
                      <li key={item.key}>
                        <Link
                          href={item.href}
                          prefetch
                          className={styles.header__drawerLink}
                          onClick={handleMenuClose}
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>

                <li className={styles.header__drawerGroup}>
                  <p
                    className={styles.header__drawerGroupTitle}
                    id={`${drawerId}-compensations`}
                  >
                    {labels.compensations}
                  </p>
                  <ul
                    className={styles.header__drawerSublist}
                    aria-labelledby={`${drawerId}-compensations`}
                  >
                    {compensationItems.map((item) => (
                      <li key={item.key}>
                        <Link
                          href={item.href}
                          prefetch
                          className={styles.header__drawerLink}
                          onClick={handleMenuClose}
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>

                <li>
                  <Link
                    href={`/${locale}#travel-risk`}
                    prefetch
                    className={styles.header__drawerLink}
                    onClick={handleMenuClose}
                  >
                    {labels.travelRisk}
                  </Link>
                </li>

                <li>
                  <Link
                    href={isAuthenticated ? `/${locale}/account` : `/${locale}/login`}
                    prefetch
                    className={styles.header__drawerLink}
                    onClick={handleMenuClose}
                  >
                    {isAuthenticated ? labels.account : labels.signIn}
                  </Link>
                </li>
                {!isAuthenticated && (
                  <li>
                    <Link
                      href={`/${locale}/signup`}
                      prefetch
                      className={styles.header__drawerLink}
                      onClick={handleMenuClose}
                    >
                      {labels.signUp}
                    </Link>
                  </li>
                )}
              </ul>
            </nav>

            <div className={styles.header__drawerLang}>
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
